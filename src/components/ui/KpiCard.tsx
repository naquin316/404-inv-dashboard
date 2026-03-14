interface KpiCardProps {
  label: string
  value: string
  subtitle?: string
  color: 'teal' | 'green' | 'red' | 'amber'
}

const colorMap = {
  teal:  'text-accent-teal',
  green: 'text-accent-green',
  red:   'text-accent-red',
  amber: 'text-accent-amber',
}

export function KpiCard({ label, value, subtitle, color }: KpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-none border border-border bg-card p-4">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent-red" />
      <div className="text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-1 font-heading">{label}</div>
      <div className={`text-2xl tracking-tight font-display ${colorMap[color]}`}>{value}</div>
      {subtitle && <div className="text-[10px] text-text-muted mt-1">{subtitle}</div>}
    </div>
  )
}
