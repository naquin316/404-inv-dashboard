import {
  BarChart, Bar, Line, ComposedChart, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { KpiCard } from '../ui/KpiCard'
import { Card } from '../ui/Card'
import { fmt$, fmtN, fmtPct, fmtDate } from '../../lib/utils'
import type { FlowCutsData } from '../../types'

const COLORS = ['#4e8cff', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#22d3ee', '#f472b6', '#818cf8']

interface Props {
  data: FlowCutsData
  wide?: boolean
}

export function FlowCutsTab({ data: d, wide = false }: Props) {
  const gridCols = wide ? 'grid-cols-4' : 'grid-cols-2'
  const summary = d.summary as Record<string, any>
  const tlKeys = Object.keys(d.timeline).sort()

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
      <div className={`grid ${gridCols} gap-3`}>
        <KpiCard label="Items Shorted" value={fmtN(d.totalItems)} subtitle="Today" color="red" />
        <KpiCard label="Affected SKUs" value={fmtN(d.totalSKUs)} color="amber" />
        <KpiCard label="Cost Impact" value={fmt$(d.totalCost)} color="blue" />
        <KpiCard label="True Cuts" value={fmt$(d.trueCuts)} color="green" />
      </div>

      {/* Period Summary */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label="Period Items"
            value={fmtN(Number(summary['Total Items Shorted']) || 0)}
            subtitle={`${summary['Earliest Date'] || ''} — ${summary['Latest Date'] || ''}`}
            color="purple"
          />
          <KpiCard label="Period Cost" value={fmt$(Number(summary['Total Cost Impact']) || 0)} color="cyan" />
        </div>
      )}

      {/* Top Drivers: table + chart */}
      {d.topDrivers.length > 0 && (
        <div className={wide ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
          <Card title="Top Cost Drivers" badge="Today">
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-xs">
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
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={driverChartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3d" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9aa0b0', fontSize: 10 }} tickFormatter={v => '$' + v} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9aa0b0', fontSize: 9 }} width={wide ? 140 : 100} axisLine={false} />
                <Tooltip
                  formatter={(v: any) => [fmt$(Number(v)), 'Cost']}
                  contentStyle={{ background: '#1a1d27', border: '1px solid #2a2e3d', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e8eaed' }}
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
          <table className="w-full text-xs">
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
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={dailyChartData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3d" />
                  <XAxis dataKey="date" tick={{ fill: '#9aa0b0', fontSize: 10 }} axisLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: '#9aa0b0', fontSize: 10 }} tickFormatter={v => '$' + v} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9aa0b0', fontSize: 10 }} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1d27', border: '1px solid #2a2e3d', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#e8eaed' }}
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
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={timelineData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3d" />
                  <XAxis dataKey="time" tick={{ fill: '#9aa0b0', fontSize: 10 }} axisLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: '#9aa0b0', fontSize: 10 }} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9aa0b0', fontSize: 10 }} tickFormatter={v => '$' + fmtN(v)} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1d27', border: '1px solid #2a2e3d', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#e8eaed' }}
                    formatter={(v: any, name: any) => [name === 'cost' ? fmt$(Number(v)) : fmtN(Number(v)), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="qty" fill="#3b6cb4" stroke="#2c5491" strokeWidth={1} radius={[3, 3, 0, 0]} name="Qty" />
                  <Line yAxisId="right" dataKey="cost" stroke="#8b2020" strokeWidth={2} dot={{ fill: '#8b2020', r: 4, strokeWidth: 0 }} name="Cost" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
