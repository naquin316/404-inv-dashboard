import { useState, useEffect, useCallback } from 'react'
import { StatusBar } from './components/ui/StatusBar'
import { Sidebar } from './components/ui/Sidebar'
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

  const tabs: { id: string; label: string }[] = []
  if (fcData) tabs.push({ id: 'fc', label: 'Flow Cuts' })
  if (shData) tabs.push({ id: 'sh', label: 'Final Shorts' })

  const hasData = fcData || shData

  return (
    <div className="min-h-screen flex">
      {hasData && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
          tabs={tabs}
          isTaskPane={false}
        />
      )}
      <div className="flex-1 min-w-0">
        <StatusBar
          status={status}
          onRefresh={requestRefresh}
          onPrint={hasData ? printDashboard : undefined}
          isReady={!!hasData}
          isTaskPane={false}
        />

        {!hasData && (
          <div className="text-center py-16 px-5">
            <div className="text-5xl mb-3 opacity-60">📊</div>
            <h2 className="text-xl font-heading mb-2">Waiting for data from Excel...</h2>
            <p className="text-text-secondary text-sm">The dashboard will appear once the task pane sends data.</p>
          </div>
        )}

        {hasData && (
          <div role="tabpanel" className="p-5 max-w-[1400px] mx-auto">
            {activeTab === 'fc' && fcData && <FlowCutsTab data={fcData} wide />}
            {activeTab === 'sh' && shData && <FinalShortsTab data={shData} wide />}
          </div>
        )}
      </div>
    </div>
  )
}
