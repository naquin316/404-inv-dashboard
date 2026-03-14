interface Tab {
  id: string
  label: string
}

interface SidebarProps {
  activeTab: string
  onTabChange: (id: string) => void
  tabs: Tab[]
  isTaskPane: boolean
}

export function Sidebar({ activeTab, onTabChange, tabs, isTaskPane }: SidebarProps) {
  if (tabs.length === 0) return null

  // Taskpane: horizontal strip
  if (isTaskPane) {
    return (
      <div role="tablist" className="flex gap-0 px-4 bg-card border-b border-border no-print">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => onTabChange(t.id)}
            className={`px-4 py-2 text-[11px] font-heading uppercase tracking-wider cursor-pointer transition-colors border-b-2 ${
              activeTab === t.id
                ? 'text-accent-teal border-accent-teal bg-card-hover'
                : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-card-hover'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    )
  }

  // Dialog: vertical sidebar
  return (
    <div className="w-40 min-h-screen bg-sidebar border-r border-border flex flex-col shrink-0 no-print">
      <div className="px-4 py-4 border-b border-border">
        <span className="font-display text-accent-red text-sm tracking-wider">HEB 404</span>
      </div>
      <nav role="tablist" className="flex flex-col py-2">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => onTabChange(t.id)}
            className={`text-left px-4 py-2.5 text-[11px] font-heading uppercase tracking-wider cursor-pointer transition-colors border-l-[3px] ${
              activeTab === t.id
                ? 'text-text-primary border-accent-teal bg-card-hover'
                : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-card-hover/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
