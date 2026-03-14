import { useState, useEffect, useCallback } from 'react'
import { StatusBar } from './components/ui/StatusBar'
import { Sidebar } from './components/ui/Sidebar'
import { workbookRegistry } from './config/registry'
import type { StatusState } from './types'

declare const Office: any

export default function DialogApp() {
  const [data, setData] = useState<Record<string, any>>({})
  const [status, setStatus] = useState<{ state: StatusState; text: string }>({ state: 'waiting', text: 'Waiting for data...' })
  const [activePageId, setActivePageId] = useState('')

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
              setData(msg.data)
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

  // Detect which workbook based on data keys
  const detectedWorkbook = workbookRegistry.find(wb =>
    wb.pages.some(p => data[p.id] != null)
  ) ?? null

  const availablePages = detectedWorkbook
    ? detectedWorkbook.pages.filter(p => data[p.id] != null)
    : []

  // Set initial active page
  useEffect(() => {
    if (availablePages.length > 0 && !activePageId) {
      setActivePageId(availablePages[0].id)
    }
  }, [availablePages, activePageId])

  const activePage = availablePages.find(p => p.id === activePageId)
  const hasData = Object.values(data).some(v => v != null)

  return (
    <div className="min-h-screen flex">
      {hasData && detectedWorkbook && (
        <Sidebar
          workbook={detectedWorkbook}
          pages={availablePages}
          activePageId={activePageId}
          onPageChange={setActivePageId}
          isTaskPane={false}
        />
      )}
      <div className="flex-1 min-w-0">
        <StatusBar
          status={status}
          onRefresh={requestRefresh}
          onPrint={hasData ? printDashboard : undefined}
          isReady={hasData}
          isTaskPane={false}
        />

        {!hasData && (
          <div className="text-center py-16 px-5">
            <div className="text-5xl mb-3 opacity-60">📊</div>
            <h2 className="text-xl font-heading mb-2">Waiting for data from Excel...</h2>
            <p className="text-text-secondary text-sm">The dashboard will appear once the task pane sends data.</p>
          </div>
        )}

        {hasData && activePage && (
          <div role="tabpanel" className="p-5 max-w-[1400px] mx-auto">
            <activePage.component data={data[activePageId]} wide />
          </div>
        )}
      </div>
    </div>
  )
}
