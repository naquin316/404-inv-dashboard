import { useState, useEffect, useCallback } from 'react'
import { StatusBar } from './components/ui/StatusBar'
import { FlowCutsTab } from './components/dashboard/FlowCutsTab'
import { FinalShortsTab } from './components/dashboard/FinalShortsTab'
import type { FlowCutsData, ShortRecord, StatusState } from './types'

declare const Office: any

type TabId = 'fc' | 'sh'

export default function DialogApp() {
  const [fcData, setFcData] = useState<FlowCutsData | null>(null)
  const [shData, setShData] = useState<ShortRecord[] | null>(null)
  const [status, setStatus] = useState<{ state: StatusState; text: string }>({ state: 'waiting', text: 'Waiting for data...' })
  const [activeTab, setActiveTab] = useState<TabId>('fc')

  const requestRefresh = useCallback(() => {
    setStatus({ state: 'loading', text: 'Requesting refresh...' })
    Office.context.ui.messageParent(JSON.stringify({ type: 'refresh' }))
  }, [])

  const printDashboard = useCallback(() => {
    // Show all tabs for printing
    setTimeout(() => window.print(), 100)
  }, [])

  useEffect(() => {
    if (typeof Office === 'undefined') return

    Office.onReady(() => {
      Office.context.ui.addHandlerAsync(
        Office.EventType.DialogParentMessageReceived,
        (arg: any) => {
          try {
            const msg = JSON.parse(arg.message)
            if (msg.type === 'data') {
              setFcData(msg.fcData)
              setShData(msg.shData)
              setStatus({ state: 'ok', text: 'Updated ' + new Date().toLocaleTimeString() })
            }
          } catch (e) {
            console.error('Message parse error:', e)
          }
        }
      )
      Office.context.ui.messageParent(JSON.stringify({ type: 'ready' }))
    })
  }, [])

  const tabs: { id: TabId; label: string }[] = []
  if (fcData) tabs.push({ id: 'fc', label: 'Flow Cuts' })
  if (shData) tabs.push({ id: 'sh', label: 'Final Shorts' })

  const hasData = fcData || shData

  return (
    <div className="min-h-screen">
      <StatusBar
        status={status}
        onRefresh={requestRefresh}
        isReady={!!hasData}
        isTaskPane={false}
      />

      {/* Print button */}
      {hasData && (
        <div className="flex justify-end px-5 py-1 no-print">
          <button
            onClick={printDashboard}
            aria-label="Print dashboard"
            className="px-3 py-1 rounded-md border border-border text-text-secondary text-[10px] hover:border-accent-blue hover:text-accent-blue transition-colors cursor-pointer"
          >
            Print
          </button>
        </div>
      )}

      {!hasData && (
        <div className="text-center py-16 px-5">
          <div className="text-5xl mb-3 opacity-60">📊</div>
          <h2 className="text-xl font-semibold mb-2">Waiting for data from Excel...</h2>
          <p className="text-text-secondary text-sm">The dashboard will appear once the task pane sends data.</p>
        </div>
      )}

      {hasData && (
        <>
          <div role="tablist" className="flex flex-wrap gap-1 px-5 py-2 bg-card border-b border-border no-print">
            {tabs.map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
                  activeTab === t.id
                    ? 'text-accent-blue bg-accent-blue/10 border-accent-blue/30'
                    : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-card-hover'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="p-5 max-w-[1400px] mx-auto">
            {activeTab === 'fc' && fcData && <FlowCutsTab data={fcData} wide />}
            {activeTab === 'sh' && shData && <FinalShortsTab data={shData} wide />}
          </div>
        </>
      )}
    </div>
  )
}
