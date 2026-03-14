import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { KpiCard } from '../ui/KpiCard'
import { Card } from '../ui/Card'
import { fmt$, fmtN } from '../../lib/utils'
import type { CountErrorData, CountRecord } from '../../types'

const CHART_GRID = 'var(--color-border)'
const CHART_TICK = { fill: 'var(--color-text-secondary)', fontSize: 10 }
const CHART_TICK_SM = { fill: 'var(--color-text-secondary)', fontSize: 9 }
const CHART_TOOLTIP_STYLE = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 2,
  fontSize: 12,
}

const SELECT_CLASS = 'bg-background border border-border px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent-teal transition-colors cursor-pointer'

/** Shift runs 5 PM → 5 AM. Returns the "shift date" (the evening's calendar date). */
function getShiftDate(r: CountRecord): string {
  const d = new Date(r.countTime)
  // Records before 5 AM belong to previous calendar day's shift
  if (r.countHour < 5) {
    d.setDate(d.getDate() - 1)
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatShiftDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d)}/${y}`
}

function isInShiftHours(r: CountRecord): boolean {
  return r.countHour >= 17 || r.countHour < 5
}

interface Props {
  data: CountErrorData
  wide?: boolean
}

export function CountErrorsTab({ data, wide = false }: Props) {
  const [shiftOnly, setShiftOnly] = useState(true)
  const [selectedDate, setSelectedDate] = useState('all')
  const [selectedCounter, setSelectedCounter] = useState('all')
  const [search, setSearch] = useState('')
  const chartHeight = wide ? 280 : 200

  // Extract unique shift dates and counter names from all records
  const { shiftDates, counterNames } = useMemo(() => {
    const dateSet = new Set<string>()
    const nameSet = new Set<string>()
    for (const r of data.records) {
      dateSet.add(getShiftDate(r))
      nameSet.add(r.counterName)
    }
    const shiftDates = Array.from(dateSet).sort().reverse()
    const counterNames = Array.from(nameSet).sort()
    return { shiftDates, counterNames }
  }, [data.records])

  // Apply all filters → filtered records drive everything
  const filtered = useMemo(() => {
    let recs = data.records
    if (shiftOnly) recs = recs.filter(isInShiftHours)
    if (selectedDate !== 'all') recs = recs.filter(r => getShiftDate(r) === selectedDate)
    if (selectedCounter !== 'all') recs = recs.filter(r => r.counterName === selectedCounter)
    return recs
  }, [data.records, shiftOnly, selectedDate, selectedCounter])

  // Compute all aggregations from filtered records
  const agg = useMemo(() => {
    const openRecs = filtered.filter(r => r.status === 'OPEN')
    const totalCounts = filtered.length
    const openCounts = openRecs.length
    const correctedCounts = totalCounts - openCounts
    const netDollarVar = filtered.reduce((s, r) => s + r.dollarVar, 0)
    const totalAbsDollarVar = filtered.reduce((s, r) => s + Math.abs(r.dollarVar), 0)
    const avgMinutesOpen = openCounts > 0
      ? openRecs.reduce((s, r) => s + r.minutesOpen, 0) / openCounts
      : 0

    // By counter
    const cMap: Record<string, { name: string; totalCounts: number; openCounts: number; absDollarVar: number; openMin: number }> = {}
    for (const r of filtered) {
      if (!cMap[r.counterName]) cMap[r.counterName] = { name: r.counterName, totalCounts: 0, openCounts: 0, absDollarVar: 0, openMin: 0 }
      const c = cMap[r.counterName]
      c.totalCounts++
      if (r.status === 'OPEN') { c.openCounts++; c.openMin += r.minutesOpen }
      c.absDollarVar += Math.abs(r.dollarVar)
    }
    const byCounter = Object.values(cMap)
      .map(c => ({ ...c, avgMinutesOpen: c.openCounts > 0 ? c.openMin / c.openCounts : 0 }))
      .sort((a, b) => b.absDollarVar - a.absDollarVar)

    // Top variance products
    const pMap: Record<string, { description: string; absDollarVar: number; totalUnitVar: number; recordCount: number }> = {}
    for (const r of filtered) {
      if (!pMap[r.description]) pMap[r.description] = { description: r.description, absDollarVar: 0, totalUnitVar: 0, recordCount: 0 }
      const p = pMap[r.description]
      p.absDollarVar += Math.abs(r.dollarVar)
      p.totalUnitVar += r.unitVar
      p.recordCount++
    }
    const topVarianceItems = Object.values(pMap).sort((a, b) => b.absDollarVar - a.absDollarVar).slice(0, 10)

    // By hour
    const hMap: Record<number, { hour: number; label: string; count: number; absDollarVar: number }> = {}
    for (const r of filtered) {
      if (!hMap[r.countHour]) {
        const h = r.countHour
        const ampm = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`
        hMap[r.countHour] = { hour: h, label: ampm, count: 0, absDollarVar: 0 }
      }
      hMap[r.countHour].count++
      hMap[r.countHour].absDollarVar += Math.abs(r.dollarVar)
    }
    const byHour = Object.values(hMap).sort((a, b) => a.hour - b.hour)

    return { totalCounts, openCounts, correctedCounts, netDollarVar, totalAbsDollarVar, avgMinutesOpen, byCounter, topVarianceItems, byHour }
  }, [filtered])

  // Table search (on top of other filters)
  const tableRecords = useMemo(() => {
    if (!search) return filtered
    const q = search.toLowerCase()
    return filtered.filter(r =>
      r.description.toLowerCase().includes(q) ||
      r.counterName.toLowerCase().includes(q) ||
      r.locId.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    )
  }, [filtered, search])

  const counterChartData = agg.byCounter.map(c => ({
    name: c.name.length > 18 ? c.name.slice(0, 16) + '\u2026' : c.name,
    absDollarVar: c.absDollarVar,
  }))

  const topProdData = agg.topVarianceItems.map(p => ({
    name: p.description.length > 28 ? p.description.slice(0, 26) + '\u2026' : p.description,
    absDollarVar: p.absDollarVar,
  }))

  const activeFilterCount = (shiftOnly ? 1 : 0) + (selectedDate !== 'all' ? 1 : 0) + (selectedCounter !== 'all' ? 1 : 0)

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-card border border-border px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Filters</span>

        {/* Shift toggle */}
        <button
          onClick={() => setShiftOnly(!shiftOnly)}
          className={`px-2 py-1 text-xs font-medium border transition-colors ${
            shiftOnly
              ? 'bg-accent-teal/20 border-accent-teal text-accent-teal'
              : 'bg-background border-border text-text-secondary hover:border-text-secondary'
          }`}
        >
          5P–5A
        </button>

        {/* Day picker */}
        <select
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className={SELECT_CLASS}
          aria-label="Filter by shift date"
        >
          <option value="all">All Days</option>
          {shiftDates.map(d => (
            <option key={d} value={d}>{formatShiftDate(d)}</option>
          ))}
        </select>

        {/* Counter picker */}
        <select
          value={selectedCounter}
          onChange={e => setSelectedCounter(e.target.value)}
          className={SELECT_CLASS}
          aria-label="Filter by counter"
        >
          <option value="all">All Counters</option>
          {counterNames.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {/* Active filter count + reset */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => { setShiftOnly(false); setSelectedDate('all'); setSelectedCounter('all') }}
            className="ml-auto px-2 py-1 text-[10px] font-semibold uppercase text-text-secondary hover:text-accent-red transition-colors"
          >
            Clear ({activeFilterCount})
          </button>
        )}

        <span className="ml-auto text-[10px] text-text-secondary tabular-nums">
          {filtered.length} / {data.records.length} records
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total Counts" value={fmtN(agg.totalCounts)} color="teal" />
        <KpiCard label="Open Errors" value={fmtN(agg.openCounts)} color="red" />
        <KpiCard label="Net $ Variance" value={fmt$(agg.netDollarVar)} color="amber" />
        <KpiCard label="Avg Min Open" value={fmtN(Math.round(agg.avgMinutesOpen))} color="green" />
      </div>

      {/* Charts side by side */}
      <div className={wide ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
        <Card title="By Counter" badge="Abs $ Var">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={counterChartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
              <XAxis type="number" tick={CHART_TICK} tickFormatter={v => '$' + v} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={CHART_TICK_SM} width={120} axisLine={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(v: any) => [fmt$(Number(v)), 'Abs $ Var']}
              />
              <Bar dataKey="absDollarVar" fill="#00b2a960" stroke="#00b2a9" strokeWidth={1} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Counts by Hour">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={agg.byHour} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="label" tick={CHART_TICK_SM} axisLine={false} />
              <YAxis tick={CHART_TICK} axisLine={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(v: any) => [fmtN(Number(v)), 'Count']}
              />
              <Bar dataKey="count" fill="#00b2a960" stroke="#00b2a9" strokeWidth={1} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Variance Products */}
      <Card title="Top Variance Products" badge="Top 10">
        <ResponsiveContainer width="100%" height={wide ? 320 : 260}>
          <BarChart data={topProdData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
            <XAxis type="number" tick={CHART_TICK} tickFormatter={v => '$' + v} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={CHART_TICK_SM} width={180} axisLine={false} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(v: any) => [fmt$(Number(v)), 'Abs $ Var']}
            />
            <Bar dataKey="absDollarVar" fill="#00b2a960" stroke="#00b2a9" strokeWidth={1} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Data Table */}
      <Card title="All Records" badge={String(tableRecords.length)}>
        <input
          type="text"
          placeholder="Search records..."
          aria-label="Search records"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-background border border-border rounded-none px-3 py-2 text-xs text-text-primary outline-none mb-2 focus:border-accent-teal transition-colors no-print"
        />
        <div className="overflow-auto max-h-[500px]">
          <table className="w-full text-[11px]" aria-label="Count Error Records">
            <thead>
              <tr>
                {['Time', 'Location', 'Description', 'Counter', 'Sys Qty', 'Unit Var', '$ Var', 'Status', 'Min Open'].map(h => (
                  <th key={h} className="sticky top-0 bg-smokey text-left p-2 text-[9px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRecords.map((r, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-card-hover transition-colors">
                  <td className="p-2 whitespace-nowrap font-mono-data">
                    {r.countTime.toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </td>
                  <td className="p-2 whitespace-nowrap font-mono-data">{r.locId}</td>
                  <td className="p-2 max-w-[200px] truncate">{r.description}</td>
                  <td className="p-2 whitespace-nowrap">{r.counterName}</td>
                  <td className="p-2 text-right font-mono-data tabular-nums">{r.systemQty}</td>
                  <td className="p-2 text-right font-mono-data tabular-nums">{r.unitVar}</td>
                  <td className={`p-2 text-right font-mono-data tabular-nums ${r.dollarVar < 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                    {fmt$(r.dollarVar)}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <span className={`inline-block px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                      r.status === 'OPEN'
                        ? 'bg-accent-red/20 text-accent-red'
                        : 'bg-accent-green/20 text-accent-green'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-2 text-right font-mono-data tabular-nums">{r.minutesOpen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
