import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  title: string
  badge?: string
  children: ReactNode
  className?: string
}

export function Card({ title, badge, children, className }: CardProps) {
  return (
    <div className={cn('rounded-none border border-border bg-card', className)}>
      <div className="-mx-px -mt-px bg-accent-teal px-4 py-2 flex items-center gap-2">
        <span className="text-xs font-heading uppercase tracking-wider text-white">{title}</span>
        {badge && (
          <span className="text-[10px] font-medium px-2 py-0.5 bg-black/30 text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}
