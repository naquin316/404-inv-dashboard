import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { KpiCard } from '../ui/KpiCard'
import { Card } from '../ui/Card'
import { fmt$, fmtN } from '../../lib/utils'
import type { CountErrorData } from '../../types'

const CHART_GRID = 'var(--color-border)'
const CHART_TICK = { fill: 'var(--color-text-secondary)', fontSize: 10 }
const CHART_TICK_SM = { fill: 'var(--color-text-secondary)', fontSize: 9 }
const CHART_TOOLTIP_STYLE = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 2,
  fontSize: 12,
}

interface Props {
  data: CountErrorData
  wide?: boolean
}

export function CountErrorsTab({ data, wide = false }: Props) {
  const [search, setSearch] = useState('')
  const chartHeight = wide ? 280 : 200

  const filteredRecords = useMemo(() => {
    if (!search) return data.records
    const q = search.toLowerCase()
    return data.records.filter(r =>
      r.description.toLowerCase().includes(q) ||
      r.counterName.toLowerCase().includes(q) ||
      r.locId.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    )
  }, [data.records, search])

  const counterData = data.byCounter.map(c => ({
    name: c.name.length > 18 ? c.name.slice(0, 16) + '…' : c.name,
    absDollarVar: c.absDollarVar,
  }))

  const topProdData = data.topVarianceItems.map(p => ({
    name: p.description.length > 28 ? p.description.slice(0, 26) + '…' : p.description,
    absDollarVar: p.absDollarVar,
  }))

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total Counts" value={fmtN(data.totalCounts)} color="teal" />
        <KpiCard label="Open Errors" value={fmtN(data.openCounts)} color="red" />
        <KpiCard label="Net $ Variance" value={fmt$(data.netDollarVar)} color="amber" />
        <KpiCard label="Avg Min Open" value={fmtN(Math.round(data.avgMinutesOpen))} color="green" />
      </div>

      {/* Charts side by side */}
      <div className={wide ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
        <Card title="By Counter" badge="Abs $ Var">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={counterData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
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
            <BarChart data={data.byHour} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
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
      <Card title="All Records" badge={String(filteredRecords.length)}>
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
              {filteredRecords.map((r, i) => (
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
