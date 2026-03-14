import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { KpiCard } from '../ui/KpiCard'
import { Card } from '../ui/Card'
import { fmt$, fmtN, fmtDate } from '../../lib/utils'
import type { ShortRecord } from '../../types'

const CHART_GRID = 'var(--color-border)'
const CHART_TICK = { fill: 'var(--color-text-secondary)', fontSize: 10 }
const CHART_TICK_SM = { fill: 'var(--color-text-secondary)', fontSize: 9 }
const CHART_TOOLTIP_STYLE = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 12,
}

interface Props {
  data: ShortRecord[]
  wide?: boolean
}

export function FinalShortsTab({ data, wide = false }: Props) {
  const [search, setSearch] = useState('')
  const chartHeight = wide ? 280 : 200

  const { totalShorts, totalCost, byTeam, byPartner } = useMemo(() => {
    let totalShorts = 0, totalCost = 0
    const byTeam: Record<string, { s: number; c: number }> = {}
    const byPartner: Record<string, { s: number; c: number }> = {}

    data.forEach(r => {
      const s = Number(r['FINAL_SHORTS']) || 0
      const c = Number(r['COST']) || 0
      totalShorts += s
      totalCost += c
      const team = String(r['JobTitle'] || '').trim()
      const partner = String(r['PARTNER'] || '').trim()
      if (team) {
        if (!byTeam[team]) byTeam[team] = { s: 0, c: 0 }
        byTeam[team].s += s
        byTeam[team].c += c
      }
      if (partner) {
        if (!byPartner[partner]) byPartner[partner] = { s: 0, c: 0 }
        byPartner[partner].s += s
        byPartner[partner].c += c
      }
    })

    return { totalShorts, totalCost, byTeam, byPartner }
  }, [data])

  const teamData = Object.entries(byTeam)
    .sort((a, b) => b[1].c - a[1].c)
    .map(([name, v]) => ({ name: name.replace('SM RSC ', ''), cost: v.c }))

  const partnerData = Object.entries(byPartner)
    .sort((a, b) => b[1].s - a[1].s)
    .slice(0, 10)
    .map(([name, v]) => ({ name, shorts: v.s }))

  const filteredData = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(q))
    )
  }, [data, search])

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total Shorts" value={fmtN(totalShorts)} color="red" />
        <KpiCard label="Total Cost" value={fmt$(totalCost)} color="amber" />
        <KpiCard label="Records" value={fmtN(data.length)} color="blue" />
        <KpiCard label="Teams" value={fmtN(Object.keys(byTeam).length)} color="green" />
      </div>

      {/* Charts side by side */}
      <div className={wide ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
        <Card title="Shorts by Team" badge="Cost">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={teamData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis dataKey="name" tick={CHART_TICK_SM} angle={-20} textAnchor="end" height={50} axisLine={false} />
              <YAxis tick={CHART_TICK} tickFormatter={v => '$' + v} axisLine={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(v: any) => [fmt$(Number(v)), 'Cost']}
              />
              <Bar dataKey="cost" fill="#fbbf2480" stroke="#fbbf24" strokeWidth={1} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top Partners">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={partnerData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
              <XAxis type="number" tick={CHART_TICK} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={CHART_TICK_SM} width={100} axisLine={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(v: any) => [fmtN(Number(v)), 'Shorts']}
              />
              <Bar dataKey="shorts" fill="#a78bfa80" stroke="#a78bfa" strokeWidth={1} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Data Table */}
      <Card title="All Records" badge={String(filteredData.length)}>
        <input
          type="text"
          placeholder="Search records..."
          aria-label="Search records"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary outline-none mb-2 focus:border-accent-blue transition-colors no-print"
        />
        <div className="overflow-auto max-h-[500px]">
          <table className="w-full text-[11px]" aria-label="Final Short Records">
            <thead>
              <tr>
                {['Date', 'Product', 'Description', 'Partner', 'Shorts', 'Cost', 'Team'].map(h => (
                  <th key={h} className="sticky top-0 bg-card-hover text-left p-2 text-[9px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((r, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-card-hover transition-colors">
                  <td className="p-2 whitespace-nowrap">{fmtDate(r['RPT_DT'])}</td>
                  <td className="p-2 whitespace-nowrap">{String(r['PRODUCT'] || '')}</td>
                  <td className="p-2 max-w-[200px] truncate">{String(r['DESCRIPTION'] || '')}</td>
                  <td className="p-2 whitespace-nowrap">{String(r['PARTNER'] || '')}</td>
                  <td className="p-2 text-right tabular-nums">{Number(r['FINAL_SHORTS']) || 0}</td>
                  <td className="p-2 text-right tabular-nums">{fmt$(Number(r['COST']) || 0)}</td>
                  <td className="p-2 whitespace-nowrap">{String(r['JobTitle'] || '').replace('SM RSC ', '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
