import { useState, useEffect } from 'react'
import { StatusBar } from './components/ui/StatusBar'
import { FlowCutsTab } from './components/dashboard/FlowCutsTab'
import { FinalShortsTab } from './components/dashboard/FinalShortsTab'
import { useExcelData } from './hooks/useExcelData'
import { useDialog } from './hooks/useDialog'

type TabId = 'fc' | 'sh'

export default function App() {
  const { fcData, shData, status, error, isReady, loadAllData } = useExcelData()
  const { openDialog, sendData } = useDialog(loadAllData)
  const [activeTab, setActiveTab] = useState<TabId>('fc')

  // Send updated data to dialog whenever data changes
  useEffect(() => {
    sendData(fcData, shData)
  }, [fcData, shData, sendData])

  const tabs: { id: TabId; label: string }[] = []
  if (fcData) tabs.push({ id: 'fc', label: 'Flow Cuts' })
  if (shData) tabs.push({ id: 'sh', label: 'Final Shorts' })

  const hasData = fcData || shData

  return (
    <div className="min-h-screen">
      <StatusBar
        status={status}
        onRefresh={loadAllData}
        onPopOut={() => openDialog(fcData, shData)}
        isReady={isReady}
        isTaskPane={true}
      />

      {error && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs">
          {error}
        </div>
      )}

      {!hasData && !error && (
        <div className="text-center py-16 px-5">
          <div className="text-4xl mb-3 opacity-60">📊</div>
          <h2 className="text-lg font-semibold mb-2">Connecting to Excel...</h2>
          <p className="text-text-secondary text-sm">The dashboard will load automatically once Office.js initializes.</p>
        </div>
      )}

      {hasData && (
        <>
          {/* Tab Bar */}
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

          {/* Content */}
          <div role="tabpanel" className="p-4">
            {activeTab === 'fc' && fcData && <FlowCutsTab data={fcData} />}
            {activeTab === 'sh' && shData && <FinalShortsTab data={shData} />}
          </div>
        </>
      )}
    </div>
  )
}
