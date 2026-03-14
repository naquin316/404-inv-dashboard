import type { ReactNode } from 'react'

interface CardProps {
  title: string
  badge?: string
  children: ReactNode
  className?: string
}

export function Card({ title, badge, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-text-primary">
        {title}
        {badge && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-accent-blue/15 text-accent-blue">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
