import { useState, useEffect, useCallback, useRef } from 'react'
import type { FlowCutsData, ShortRecord, StatusState } from '../types'

declare const Office: any
declare const Excel: any

export function useExcelData() {
  const [fcData, setFcData] = useState<FlowCutsData | null>(null)
  const [shData, setShData] = useState<ShortRecord[] | null>(null)
  const [status, setStatus] = useState<{ state: StatusState; text: string }>({ state: 'waiting', text: 'Initializing...' })
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const intervalRef = useRef<number | null>(null)

  const loadFlowCuts = useCallback(async (ctx: any) => {
    const ws = ctx.workbook.worksheets.getItem('Flow Cuts')
    const used = ws.getUsedRange()
    used.load('values')
    await ctx.sync()
    const a = used.values
    if (!a || a.length === 0) return

    function findVal(label: string) {
      for (let r = 0; r < Math.min(a.length, 55); r++) {
        if (String(a[r][1] || '').trim() === label) return a[r][2]
      }
      return ''
    }

    const report: FlowCutsData = {
      title: String(a[0]?.[1] || 'FLOW CUTS REPORT'),
      weekNum: a[0]?.[2] || '',
      dateStr: a[1]?.[1] || '',
      periodStr: a[1]?.[2] || '',
      totalItems: Number(findVal('Total Items Shorted')) || 0,
      totalSKUs: Number(findVal('Total Affected SKUs')) || 0,
      totalCost: Number(findVal('Total Cost Impact')) || 0,
      trueCuts: Number(findVal('True Cuts (Confirmed Losses)')) || 0,
      topDrivers: [],
      topSelectors: [],
      summary: {},
      daily: [],
      timeline: {},
    }

    // Top Cost Drivers
    let tdStart = -1
    for (let r = 0; r < a.length; r++) {
      if (String(a[r][1] || '').includes('TOP COST DRIVERS')) { tdStart = r + 1; break }
    }
    if (tdStart > 0) {
      for (let r = tdStart; r < a.length; r++) {
        const rank = Number(a[r][1])
        if (!rank || rank > 20) break
        report.topDrivers.push({ rank, pick: String(a[r][2] || '').trim(), desc: String(a[r][3] || '').trim(), caseCost: Number(a[r][4]) || 0, qty: Number(a[r][5]) || 0, totalCost: Number(a[r][6]) || 0 })
      }
    }

    // Top 5 Selectors
    let selStart = -1
    for (let r = 0; r < a.length; r++) {
      if (String(a[r][1] || '').includes('TOP 5 SELECTORS')) { selStart = r + 2; break }
    }
    if (selStart > 0) {
      for (let r = selStart; r < a.length; r++) {
        const rank = Number(a[r][1])
        if (!rank || rank > 20) break
        report.topSelectors.push({ rank, name: String(a[r][2] || '').trim(), qty: Number(a[r][4]) || 0, pct: Number(a[r][5]) || 0 })
      }
    }

    // Summary Metrics
    let sumStart = -1
    for (let r = 0; r < a.length; r++) {
      if (String(a[r][1] || '').trim() === 'SUMMARY METRICS') { sumStart = r + 2; break }
    }
    if (sumStart > 0) {
      for (let r = sumStart; r < a.length; r++) {
        const k = String(a[r][1] || '').trim()
        if (!k) break
        report.summary[k] = a[r][2]
      }
    }

    // Daily Breakdown
    let dStart = -1
    for (let r = 0; r < a.length; r++) {
      if (String(a[r][1] || '').trim() === 'DAILY BREAKDOWN') { dStart = r + 2; break }
    }
    if (dStart > 0) {
      for (let r = dStart; r < a.length; r++) {
        const dv = a[r][1]
        if (!dv || String(dv).trim() === 'TOTAL') {
          if (String(dv || '').trim() === 'TOTAL') {
            report.dailyTotal = { items: Number(a[r][2]) || 0, skus: Number(a[r][3]) || 0, cost: Number(a[r][4]) || 0, trueCuts: Number(a[r][5]) || 0 }
          }
          break
        }
        report.daily.push({ date: dv, items: Number(a[r][2]) || 0, skus: Number(a[r][3]) || 0, cost: Number(a[r][4]) || 0, trueCuts: Number(a[r][5]) || 0 })
      }
    }
    report.daily.sort((x, y) => new Date(x.date as string).getTime() - new Date(y.date as string).getTime())

    // Timeline — find TIME_BUCKET column
    let tbCol = -1
    if (a[0]) {
      for (let c = 0; c < a[0].length; c++) {
        if (String(a[0][c] || '').trim() === 'TIME_BUCKET') { tbCol = c; break }
      }
    }
    if (tbCol >= 0) {
      const qtyCol = tbCol + 9, costCol = tbCol + 10
      for (let r = 1; r < a.length; r++) {
        const raw = a[r][tbCol]
        if (!raw) continue
        let timeLabel = ''
        if (typeof raw === 'number') {
          const frac = raw % 1
          const totalMins = Math.round(frac * 24 * 60)
          const hh = Math.floor(totalMins / 60)
          const mm = totalMins % 60
          timeLabel = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0')
        } else if (raw instanceof Date) {
          timeLabel = String(raw.getHours()).padStart(2, '0') + ':' + String(raw.getMinutes()).padStart(2, '0')
        } else {
          const s = String(raw)
          const m = s.match(/(\d{1,2}):(\d{2})/)
          if (m) timeLabel = m[1].padStart(2, '0') + ':' + m[2]
          else continue
        }
        if (!timeLabel) continue
        if (!report.timeline[timeLabel]) report.timeline[timeLabel] = { qty: 0, cost: 0 }
        report.timeline[timeLabel].qty += Number(a[r][qtyCol]) || 0
        report.timeline[timeLabel].cost += Number(a[r][costCol]) || 0
      }
    }

    setFcData(report)
  }, [])

  const loadShorts = useCallback(async (ctx: any) => {
    const ws = ctx.workbook.worksheets.getItem('Final Short Tracker')
    const used = ws.getUsedRange()
    used.load('values')
    await ctx.sync()
    const a = used.values
    if (!a || a.length < 2) return

    const headers = a[0] as string[]
    const data: ShortRecord[] = []
    for (let r = 1; r < a.length; r++) {
      const row: ShortRecord = {}
      let hasData = false
      headers.forEach((h: string, c: number) => {
        row[h] = a[r][c]
        if (a[r][c]) hasData = true
      })
      if (hasData && (row['PARTNER'] || row['PRODUCT'])) data.push(row)
    }
    setShData(data)
  }, [])

  const loadAllData = useCallback(async () => {
    setStatus({ state: 'loading', text: 'Reading workbook...' })
    setError(null)
    try {
      await Excel.run(async (ctx: any) => {
        const sheets = ctx.workbook.worksheets
        sheets.load('items/name')
        await ctx.sync()
        const sheetNames = sheets.items.map((s: any) => s.name)

        if (sheetNames.includes('Flow Cuts')) await loadFlowCuts(ctx)
        if (sheetNames.includes('Final Short Tracker')) await loadShorts(ctx)
      })
      setStatus({ state: 'ok', text: 'Updated ' + new Date().toLocaleTimeString() })
    } catch (err: any) {
      console.error('Load error:', err)
      setStatus({ state: 'err', text: 'Error' })
      setError('Error reading workbook: ' + err.message)
    }
  }, [loadFlowCuts, loadShorts])

  // Office.js initialization
  useEffect(() => {
    if (typeof Office === 'undefined') {
      setStatus({ state: 'err', text: 'Office.js not loaded' })
      setError('Office.js not loaded. This add-in must run inside Excel.')
      return
    }

    Office.onReady(({ host }: { host: string }) => {
      if (host === Office.HostType.Excel) {
        setIsReady(true)
        setStatus({ state: 'ok', text: 'Connected to Excel' })
        loadAllData()
      } else {
        setStatus({ state: 'err', text: 'Not in Excel' })
        setError('This add-in must run inside Excel.')
      }
    })
  }, [loadAllData])

  // Auto-refresh every 30s
  useEffect(() => {
    if (!isReady) return
    intervalRef.current = window.setInterval(() => loadAllData(), 30000)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [isReady, loadAllData])

  return { fcData, shData, status, error, isReady, loadAllData }
}
