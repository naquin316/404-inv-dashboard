import {
  BarChart, Bar, Line, ComposedChart, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { KpiCard } from '../ui/KpiCard'
import { Card } from '../ui/Card'
import { fmt$, fmtN, fmtPct, fmtDate } from '../../lib/utils'
import type { FlowCutsData } from '../../types'

const COLORS = ['#4e8cff', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#22d3ee', '#f472b6', '#818cf8']

const CHART_GRID = 'var(--color-border)'
const CHART_TICK = { fill: 'var(--color-text-secondary)', fontSize: 10 }
const CHART_TICK_SM = { fill: 'var(--color-text-secondary)', fontSize: 9 }
const CHART_TOOLTIP_STYLE = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}
const CHART_LABEL_STYLE = { color: 'var(--color-text-primary)' }

interface Props {
  data: FlowCutsData
  wide?: boolean
}

export function FlowCutsTab({ data: d, wide = false }: Props) {
  const summary = d.summary as Record<string, unknown>
  const tlKeys = Object.keys(d.timeline).sort()
  const chartHeight = wide ? 280 : 200

  const driverChartData = d.topDrivers.map(r => ({
    name: r.desc.substring(0, wide ? 26 : 20),
    cost: r.totalCost,
  }))

  const dailyChartData = d.daily.map(r => ({
    date: fmtDate(r.date),
    cost: r.cost,
    trueCuts: r.trueCuts,
    items: r.items,
  }))

  const timelineData = tlKeys.map(t => ({
    time: t,
    qty: d.timeline[t].qty,
    cost: d.timeline[t].cost,
  }))

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Items Shorted" value={fmtN(d.totalItems)} subtitle="Today" color="red" />
        <KpiCard label="Affected SKUs" value={fmtN(d.totalSKUs)} subtitle="Today" color="amber" />
        <KpiCard label="Cost Impact" value={fmt$(d.totalCost)} subtitle="Today" color="blue" />
        <KpiCard label="True Cuts" value={fmt$(d.trueCuts)} subtitle="Today" color="green" />
      </div>

      {/* Period Summary */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label="Period Items"
            value={fmtN(Number(summary['Total Items Shorted'] as number) || 0)}
            subtitle={`${(summary['Earliest Date'] as string) || ''} — ${(summary['Latest Date'] as string) || ''}`}
            color="purple"
          />
          <KpiCard label="Period Cost" value={fmt$(Number(summary['Total Cost Impact'] as number) || 0)} color="cyan" />
        </div>
      )}

      {/* Top Drivers: table + chart */}
      {d.topDrivers.length > 0 && (
        <div className={wide ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
          <Card title="Top Cost Drivers" badge="Today">
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-xs" aria-label="Top Cost Drivers">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-[10px] uppercase tracking-wider text-text-muted">#</th>
                    <th className="text-left p-2 text-[10px] uppercase tracking-wider text-text-muted">Pick</th>
                    <th className="text-left p-2 text-[10px] uppercase tracking-wider text-text-muted">Description</th>
                    <th className="text-right p-2 text-[10px] uppercase tracking-wider text-text-muted">Cost</th>
                    <th className="text-right p-2 text-[10px] uppercase tracking-wider text-text-muted">Qty</th>
                    <th className="text-right p-2 text-[10px] uppercase tracking-wider text-text-muted">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {d.topDrivers.map(r => (
                    <tr key={r.rank} className="border-b border-border/40 hover:bg-card-hover transition-colors">
                      <td className="p-2">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold ${
                          r.rank === 1 ? 'bg-accent-amber/15 text-accent-amber' :
                          r.rank === 2 ? 'bg-slate-400/15 text-slate-400' :
                          r.rank === 3 ? 'bg-amber-700/15 text-amber-500' :
                          'bg-text-muted/10 text-text-muted'
                        }`}>{r.rank}</span>
                      </td>
                      <td className="p-2 font-mono text-accent-cyan text-[11px]">{r.pick}</td>
                      <td className="p-2 text-text-secondary">{r.desc}</td>
                      <td className="p-2 text-right tabular-nums">{fmt$(r.caseCost)}</td>
                      <td className="p-2 text-right tabular-nums">{r.qty}</td>
                      <td className="p-2 text-right tabular-nums font-semibold text-accent-red">{fmt$(r.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Cost Drivers">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={driverChartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
                <XAxis type="number" tick={CHART_TICK} tickFormatter={v => '$' + v} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={CHART_TICK_SM} width={wide ? 140 : 100} axisLine={false} />
                <Tooltip
                  formatter={(v: any) => [fmt$(Number(v)), 'Cost']}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={CHART_LABEL_STYLE}
                />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]} barSize={18}>
                  {driverChartData.map((_entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length] + '99'} stroke={COLORS[i % COLORS.length]} strokeWidth={1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Top Selectors */}
      {d.topSelectors.length > 0 && (
        <Card title="Top Selectors by Qty" badge="Today">
          <table className="w-full text-xs" aria-label="Top Selectors by Quantity">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-[10px] uppercase tracking-wider text-text-muted">#</th>
                <th className="text-left p-2 text-[10px] uppercase tracking-wider text-text-muted">Selector</th>
                <th className="text-right p-2 text-[10px] uppercase tracking-wider text-text-muted">Qty</th>
                <th className="text-right p-2 text-[10px] uppercase tracking-wider text-text-muted">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {d.topSelectors.map(r => (
                <tr key={r.rank} className="border-b border-border/40 hover:bg-card-hover transition-colors">
                  <td className="p-2">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold ${
                      r.rank === 1 ? 'bg-accent-amber/15 text-accent-amber' :
                      r.rank === 2 ? 'bg-slate-400/15 text-slate-400' :
                      r.rank === 3 ? 'bg-amber-700/15 text-amber-500' :
                      'bg-text-muted/10 text-text-muted'
                    }`}>{r.rank}</span>
                  </td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2 text-right tabular-nums">{r.qty}</td>
                  <td className="p-2 text-right tabular-nums">{fmtPct(r.pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Daily + Timeline charts */}
      {(dailyChartData.length > 0 || timelineData.length > 0) && (
        <div className={wide ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
          {dailyChartData.length > 0 && (
            <Card title="Daily Breakdown">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <ComposedChart data={dailyChartData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="date" tick={CHART_TICK} axisLine={false} />
                  <YAxis yAxisId="left" tick={CHART_TICK} tickFormatter={v => '$' + v} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={CHART_TICK} axisLine={false} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    labelStyle={CHART_LABEL_STYLE}
                    formatter={(v: any, name: any) => [name === 'items' ? fmtN(Number(v)) : fmt$(Number(v)), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="cost" fill="#4e8cff60" stroke="#4e8cff" strokeWidth={1} radius={[3, 3, 0, 0]} name="Cost" />
                  <Bar yAxisId="left" dataKey="trueCuts" fill="#f8717160" stroke="#f87171" strokeWidth={1} radius={[3, 3, 0, 0]} name="True Cuts" />
                  <Line yAxisId="right" dataKey="items" stroke="#fbbf24" strokeWidth={2} dot={{ fill: '#fbbf24', r: 3 }} name="Items" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {timelineData.length > 0 && (
            <Card title="Flow Short Timeline — Qty & Cost" badge={`${timelineData.length} intervals`}>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <ComposedChart data={timelineData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="time" tick={CHART_TICK} axisLine={false} />
                  <YAxis yAxisId="left" tick={CHART_TICK} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={CHART_TICK} tickFormatter={v => '$' + fmtN(v)} axisLine={false} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    labelStyle={CHART_LABEL_STYLE}
                    formatter={(v: any, name: any) => [name === 'cost' ? fmt$(Number(v)) : fmtN(Number(v)), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="qty" fill="#4e8cff60" stroke="#4e8cff" strokeWidth={1} radius={[3, 3, 0, 0]} name="Qty" />
                  <Line yAxisId="right" dataKey="cost" stroke="#f87171" strokeWidth={2} dot={{ fill: '#f87171', r: 4, strokeWidth: 0 }} name="Cost" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
