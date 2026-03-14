import type { FlowCutsData, ShortRecord, CountRecord, CountErrorData, CounterSummary, TopVarianceItem, HourBucket } from '../types'

export async function loadFlowCuts(ctx: any): Promise<FlowCutsData | null> {
  const ws = ctx.workbook.worksheets.getItem('Flow Cuts')
  const used = ws.getUsedRange()
  used.load('values')
  await ctx.sync()
  const a = used.values
  if (!a || a.length === 0) return null

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

  return report
}

export async function loadShorts(ctx: any): Promise<ShortRecord[] | null> {
  const ws = ctx.workbook.worksheets.getItem('Final Short Tracker')
  const used = ws.getUsedRange()
  used.load('values')
  await ctx.sync()
  const a = used.values
  if (!a || a.length < 2) return null

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
  return data
}

export async function loadCountErrors(ctx: any): Promise<CountErrorData | null> {
  const ws = ctx.workbook.worksheets.getItem('LiveShiftErrors')
  const used = ws.getUsedRange()
  used.load('values')
  await ctx.sync()
  const a = used.values
  if (!a || a.length < 2) return null

  const records: CountRecord[] = []
  for (let r = 1; r < a.length; r++) {
    const sysQty = Number(a[r][6]) || 0
    if (!sysQty) continue

    const serial = Number(a[r][0]) || 0
    const countTime = new Date((serial - 25569) * 86400000)
    const countHour = Math.round((serial % 1) * 24) % 24
    const statusRaw = String(a[r][11] || '').trim().toUpperCase()

    records.push({
      countTime,
      countHour,
      locId: String(a[r][1] || '').trim(),
      prodId: Number(a[r][2]) || 0,
      description: String(a[r][3] || '').trim(),
      counterId: String(a[r][4] || '').trim(),
      counterName: String(a[r][5] || '').replace(/^\S+\s+/, '').trim(),
      systemQty: sysQty,
      unitVar: Number(a[r][7]) || 0,
      caseVar: Number(a[r][8]) || 0,
      dollarVar: Number(a[r][9]) || 0,
      minutesOpen: Number(a[r][10]) || 0,
      status: statusRaw === 'CORRECTED' ? 'CORRECTED' : 'OPEN',
    })
  }

  if (records.length === 0) return null

  const openRecords = records.filter(r => r.status === 'OPEN')
  const totalCounts = records.length
  const openCounts = openRecords.length
  const correctedCounts = totalCounts - openCounts
  const netDollarVar = records.reduce((s, r) => s + r.dollarVar, 0)
  const totalAbsDollarVar = records.reduce((s, r) => s + Math.abs(r.dollarVar), 0)
  const avgMinutesOpen = openCounts > 0
    ? openRecords.reduce((s, r) => s + r.minutesOpen, 0) / openCounts
    : 0

  // By counter
  const counterMap: Record<string, CounterSummary> = {}
  for (const r of records) {
    if (!counterMap[r.counterName]) {
      counterMap[r.counterName] = { name: r.counterName, totalCounts: 0, openCounts: 0, absDollarVar: 0, avgMinutesOpen: 0 }
    }
    const c = counterMap[r.counterName]
    c.totalCounts++
    if (r.status === 'OPEN') c.openCounts++
    c.absDollarVar += Math.abs(r.dollarVar)
  }
  for (const c of Object.values(counterMap)) {
    const counterOpen = records.filter(r => r.counterName === c.name && r.status === 'OPEN')
    c.avgMinutesOpen = counterOpen.length > 0
      ? counterOpen.reduce((s, r) => s + r.minutesOpen, 0) / counterOpen.length
      : 0
  }
  const byCounter = Object.values(counterMap).sort((a, b) => b.absDollarVar - a.absDollarVar)

  // Top variance items
  const prodMap: Record<string, TopVarianceItem> = {}
  for (const r of records) {
    if (!prodMap[r.description]) {
      prodMap[r.description] = { description: r.description, absDollarVar: 0, totalUnitVar: 0, recordCount: 0 }
    }
    const p = prodMap[r.description]
    p.absDollarVar += Math.abs(r.dollarVar)
    p.totalUnitVar += r.unitVar
    p.recordCount++
  }
  const topVarianceItems = Object.values(prodMap)
    .sort((a, b) => b.absDollarVar - a.absDollarVar)
    .slice(0, 10)

  // By hour
  const hourMap: Record<number, HourBucket> = {}
  for (const r of records) {
    if (!hourMap[r.countHour]) {
      const h = r.countHour
      const ampm = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`
      hourMap[r.countHour] = { hour: h, label: ampm, count: 0, absDollarVar: 0 }
    }
    hourMap[r.countHour].count++
    hourMap[r.countHour].absDollarVar += Math.abs(r.dollarVar)
  }
  const byHour = Object.values(hourMap).sort((a, b) => a.hour - b.hour)

  return {
    records: records.sort((a, b) => b.countTime.getTime() - a.countTime.getTime()),
    totalCounts,
    openCounts,
    correctedCounts,
    netDollarVar,
    totalAbsDollarVar,
    avgMinutesOpen,
    byCounter,
    topVarianceItems,
    byHour,
  }
}
