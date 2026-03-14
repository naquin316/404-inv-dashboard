import { useState, useEffect } from 'react'
import { workbookRegistry } from '../config/registry'
import type { WorkbookContext } from '../types'

declare const Office: any
declare const Excel: any

export function useWorkbookDetection(): WorkbookContext & { isReady: boolean; error: string | null } {
  const [context, setContext] = useState<WorkbookContext>({ workbook: null, availablePages: [], allSheetNames: [] })
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof Office === 'undefined') {
      setError('Office.js not loaded. This add-in must run inside Excel.')
      return
    }

    Office.onReady(({ host }: { host: string }) => {
      if (host !== Office.HostType.Excel) {
        setError('This add-in must run inside Excel.')
        return
      }

      Excel.run(async (ctx: any) => {
        const sheets = ctx.workbook.worksheets
        sheets.load('items/name')
        await ctx.sync()
        const sheetNames: string[] = sheets.items.map((s: any) => s.name)

        // Find the workbook with the most sheet overlaps
        let bestMatch: typeof workbookRegistry[0] | null = null
        let bestOverlap = 0

        for (const wb of workbookRegistry) {
          const requiredSheets = wb.pages.map(p => p.sheet)
          const overlap = requiredSheets.filter(s => sheetNames.includes(s)).length
          if (overlap > bestOverlap) {
            bestOverlap = overlap
            bestMatch = wb
          }
        }

        if (bestMatch) {
          const availablePages = bestMatch.pages.filter(p => sheetNames.includes(p.sheet))
          setContext({ workbook: bestMatch, availablePages, allSheetNames: sheetNames })
        } else {
          setContext({ workbook: null, availablePages: [], allSheetNames: sheetNames })
        }

        setIsReady(true)
      }).catch((err: any) => {
        console.error('Detection error:', err)
        setError('Error detecting workbook: ' + err.message)
      })
    })
  }, [])

  return { ...context, isReady, error }
}
