import { useState, useEffect } from 'react'
import { StatusBar } from './components/ui/StatusBar'
import { Sidebar } from './components/ui/Sidebar'
import { LandingPage } from './components/LandingPage'
import { useWorkbookDetection } from './hooks/useWorkbookDetection'
import { useExcelData } from './hooks/useExcelData'
import { useDialog } from './hooks/useDialog'

export default function App() {
  const detection = useWorkbookDetection()
  const { data, status, error, loadAllData } = useExcelData(detection.availablePages)
  const { openDialog, sendData } = useDialog(loadAllData)
  const [activePageId, setActivePageId] = useState('')

  // Set initial active page when detection completes
  useEffect(() => {
    if (detection.availablePages.length > 0 && !activePageId) {
      setActivePageId(detection.availablePages[0].id)
    }
  }, [detection.availablePages, activePageId])

  // Send updated data to dialog whenever data changes
  useEffect(() => {
    sendData(data)
  }, [data, sendData])

  const activePage = detection.availablePages.find(p => p.id === activePageId)
  const hasData = Object.values(data).some(v => v != null)
  const combinedError = detection.error || error

  // No workbook matched
  if (detection.isReady && !detection.workbook) {
    return (
      <div className="min-h-screen">
        <StatusBar
          status={{ state: 'waiting', text: 'No workbook detected' }}
          onRefresh={() => window.location.reload()}
          onPopOut={() => openDialog({})}
          isReady={false}
          isTaskPane={true}
        />
        <LandingPage sheetNames={detection.allSheetNames} onPopOut={() => openDialog({})} />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {detection.workbook && hasData && (
        <Sidebar
          workbook={detection.workbook}
          pages={detection.availablePages}
          activePageId={activePageId}
          onPageChange={setActivePageId}
          isTaskPane={true}
        />
      )}

      <div className={hasData && detection.workbook ? 'ml-10' : ''}>
        <StatusBar
          status={detection.isReady ? status : { state: 'waiting', text: 'Detecting workbook...' }}
          onRefresh={loadAllData}
          onPopOut={() => openDialog(data)}
          isReady={detection.isReady && hasData}
          isTaskPane={true}
        />

        {combinedError && (
          <div className="mx-4 mt-3 p-3 rounded-none bg-accent-red/10 border border-accent-red/30 text-accent-red text-xs">
            {combinedError}
          </div>
        )}

        {!hasData && !combinedError && detection.isReady && (
          <div className="text-center py-16 px-5">
            <div className="text-4xl mb-3 opacity-60">📊</div>
            <h2 className="text-lg font-heading mb-2">Loading data...</h2>
            <p className="text-text-secondary text-sm">Reading sheets from the workbook.</p>
          </div>
        )}

        {!detection.isReady && !combinedError && (
          <div className="text-center py-16 px-5">
            <div className="text-4xl mb-3 opacity-60">📊</div>
            <h2 className="text-lg font-heading mb-2">Connecting to Excel...</h2>
            <p className="text-text-secondary text-sm">The dashboard will load automatically once Office.js initializes.</p>
          </div>
        )}

        {hasData && activePage && (
          <div role="tabpanel" className="p-4">
            <activePage.component data={data[activePageId]} />
          </div>
        )}
      </div>
    </div>
  )
}
