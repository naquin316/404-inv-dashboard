import { FileQuestion, ExternalLink } from 'lucide-react'
import { workbookRegistry } from '../config/registry'

interface LandingPageProps {
  sheetNames: string[]
  onPopOut?: () => void
}

export function LandingPage({ sheetNames, onPopOut }: LandingPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6">
      <div className="text-center max-w-md">
        <FileQuestion className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-60" />
        <h2 className="text-xl font-heading uppercase tracking-wider mb-3">No Recognized Data Found</h2>
        <p className="text-text-secondary text-sm mb-6 leading-relaxed">
          This add-in looks for specific Excel sheets to build a dashboard. Open a workbook containing one of these sheet sets:
        </p>
        <div className="text-left space-y-3 mb-6">
          {workbookRegistry.map(wb => (
            <div key={wb.id} className="bg-card border border-border p-3">
              <span className="text-xs font-heading uppercase tracking-wider text-accent-teal">{wb.label}</span>
              <div className="mt-1 text-text-secondary text-xs">
                Sheets: {wb.pages.map(p => `"${p.sheet}"`).join(', ')}
              </div>
            </div>
          ))}
        </div>
        {sheetNames.length > 0 && (
          <div className="bg-card border border-border p-3 text-left">
            <span className="text-xs font-heading uppercase tracking-wider text-text-muted">Detected sheets in this workbook:</span>
            <div className="mt-1 text-text-secondary text-xs">
              {sheetNames.join(', ')}
            </div>
          </div>
        )}
        {onPopOut && (
          <button
            onClick={onPopOut}
            className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-none border border-border text-text-secondary text-xs hover:border-accent-teal hover:text-accent-teal transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Pop Out
          </button>
        )}
      </div>
    </div>
  )
}
