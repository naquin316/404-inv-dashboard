import type { PageDefinition, WorkbookDefinition } from '../../types'
import raptorLogo from '../../assets/raptor.jpg'

interface SidebarProps {
  workbook: WorkbookDefinition
  pages: PageDefinition[]
  activePageId: string
  onPageChange: (id: string) => void
  isTaskPane: boolean
}

export function Sidebar({ pages, activePageId, onPageChange, isTaskPane }: SidebarProps) {
  if (pages.length === 0) return null

  // Taskpane: collapsible icon rail — 40px collapsed, expands on hover
  if (isTaskPane) {
    return (
      <div className="group fixed left-0 top-0 h-full z-40 w-10 hover:w-44 transition-all duration-200 bg-sidebar border-r border-border flex flex-col no-print">
        <div className="flex items-center gap-2 px-2 py-2 border-b border-border min-h-[44px]">
          <img src={raptorLogo} alt="404" className="w-6 h-6 object-cover shrink-0" />
          <span className="font-display text-accent-red text-xs tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            404
          </span>
        </div>
        <nav role="tablist" className="flex flex-col py-2">
          {pages.map(p => {
            const Icon = p.icon
            const active = activePageId === p.id
            return (
              <button
                key={p.id}
                role="tab"
                aria-selected={active}
                aria-label={p.label}
                onClick={() => onPageChange(p.id)}
                className={`flex items-center gap-2 px-2.5 py-2.5 cursor-pointer transition-colors border-l-[3px] ${
                  active
                    ? 'text-text-primary border-accent-teal bg-card-hover'
                    : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-card-hover/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-heading uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {p.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    )
  }

  // Dialog: always-expanded sidebar
  return (
    <div className="w-40 min-h-screen bg-sidebar border-r border-border flex flex-col shrink-0 no-print">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <img src={raptorLogo} alt="404" className="w-7 h-7 object-cover shrink-0" />
        <span className="font-display text-accent-red text-sm tracking-wider">404</span>
      </div>
      <nav role="tablist" className="flex flex-col py-2">
        {pages.map(p => {
          const Icon = p.icon
          const active = activePageId === p.id
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={active}
              onClick={() => onPageChange(p.id)}
              className={`flex items-center gap-2 text-left px-4 py-2.5 cursor-pointer transition-colors border-l-[3px] ${
                active
                  ? 'text-text-primary border-accent-teal bg-card-hover'
                  : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-card-hover/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-heading uppercase tracking-wider">{p.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
