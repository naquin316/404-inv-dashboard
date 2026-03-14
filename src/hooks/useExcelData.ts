import { useState, useEffect, useCallback, useRef } from 'react'
import type { PageDefinition, StatusState } from '../types'

declare const Excel: any

export function useExcelData(availablePages: PageDefinition[]) {
  const [data, setData] = useState<Record<string, any>>({})
  const [status, setStatus] = useState<{ state: StatusState; text: string }>({ state: 'waiting', text: 'Initializing...' })
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<number | null>(null)
  const pagesRef = useRef(availablePages)
  pagesRef.current = availablePages

  const loadAllData = useCallback(async () => {
    const pages = pagesRef.current
    if (pages.length === 0) return
    setStatus({ state: 'loading', text: 'Reading workbook...' })
    setError(null)
    try {
      await Excel.run(async (ctx: any) => {
        const result: Record<string, any> = {}
        for (const page of pages) {
          result[page.id] = await page.dataLoader(ctx)
        }
        setData(result)
      })
      setStatus({ state: 'ok', text: 'Updated ' + new Date().toLocaleTimeString() })
    } catch (err: any) {
      console.error('Load error:', err)
      setStatus({ state: 'err', text: 'Error' })
      setError('Error reading workbook: ' + err.message)
    }
  }, [])

  // Initial load when pages become available
  useEffect(() => {
    if (availablePages.length > 0) {
      loadAllData()
    }
  }, [availablePages, loadAllData])

  // Auto-refresh every 30s
  useEffect(() => {
    if (availablePages.length === 0) return
    intervalRef.current = window.setInterval(() => loadAllData(), 30000)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [availablePages, loadAllData])

  return { data, status, error, loadAllData }
}
