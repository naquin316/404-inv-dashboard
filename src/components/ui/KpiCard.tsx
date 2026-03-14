interface KpiCardProps {
  label: string
  value: string
  subtitle?: string
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'cyan'
}

const colorMap = {
  blue:   { accent: 'from-accent-blue to-blue-600', text: 'text-accent-blue' },
  green:  { accent: 'from-accent-green to-emerald-600', text: 'text-accent-green' },
  red:    { accent: 'from-accent-red to-red-600', text: 'text-accent-red' },
  amber:  { accent: 'from-accent-amber to-amber-600', text: 'text-accent-amber' },
  purple: { accent: 'from-accent-purple to-violet-600', text: 'text-accent-purple' },
  cyan:   { accent: 'from-accent-cyan to-cyan-600', text: 'text-accent-cyan' },
}

export function KpiCard({ label, value, subtitle, color }: KpiCardProps) {
  const c = colorMap[color]
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4">
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${c.accent}`} />
      <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">{label}</div>
      <div className={`text-2xl font-bold tracking-tight ${c.text}`}>{value}</div>
      {subtitle && <div className="text-[10px] text-text-muted mt-1">{subtitle}</div>}
    </div>
  )
}
