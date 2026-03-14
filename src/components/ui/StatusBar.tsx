import type { StatusState } from '../../types'

interface StatusBarProps {
  status: { state: StatusState; text: string }
  onRefresh: () => void
  onPopOut?: () => void
  isReady: boolean
  isTaskPane?: boolean
}

const dotClass: Record<StatusState, string> = {
  ok: 'bg-accent-green animate-pulse',
  loading: 'bg-accent-amber animate-[pulse_0.5s_ease-in-out_infinite]',
  err: 'bg-accent-red',
  waiting: 'bg-text-muted',
}

export function StatusBar({ status, onRefresh, onPopOut, isReady, isTaskPane = true }: StatusBarProps) {
  const sha = typeof __COMMIT_SHA__ !== 'undefined' ? __COMMIT_SHA__ : 'dev'

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 border-b border-border bg-gradient-to-br from-card to-background">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
          404 INV Dashboard
        </h1>
        <a
          href={`https://github.com/naquin316/404-inv-dashboard/commit/${sha}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-accent-blue/10 text-accent-blue/70 hover:text-accent-blue hover:bg-accent-blue/20 transition-colors no-print"
          title={`Build: ${sha}`}
        >
          {sha}
        </a>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-secondary no-print">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dotClass[status.state]}`} />
          {status.text}
        </span>
        {isTaskPane && isReady && onPopOut && (
          <button
            onClick={onPopOut}
            className="px-2.5 py-1 rounded-md border border-border text-text-secondary text-[10px] hover:border-accent-blue hover:text-accent-blue transition-colors cursor-pointer"
          >
            Pop Out
          </button>
        )}
        {isReady && (
          <button
            onClick={onRefresh}
            className="px-2.5 py-1 rounded-md bg-gradient-to-r from-accent-blue to-blue-600 text-white text-[10px] font-semibold hover:shadow-[0_2px_12px_rgba(78,140,255,0.4)] transition-shadow cursor-pointer"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  )
}
