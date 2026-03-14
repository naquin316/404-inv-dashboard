import { useState, useRef, useCallback } from 'react'

declare const Office: any

export function useDialog(loadAllData: () => Promise<void>) {
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useRef<any>(null)
  const readyRef = useRef(false)

  const sendData = useCallback((data: Record<string, any>) => {
    if (!dialogRef.current || !readyRef.current) return
    try {
      dialogRef.current.messageChild(JSON.stringify({ type: 'data', data }))
    } catch (e) {
      console.warn('Failed to send data to dialog:', e)
    }
  }, [])

  const openDialog = useCallback((data: Record<string, any>) => {
    if (dialogRef.current) {
      sendData(data)
      return
    }
    const origin = window.location.origin
    const url = origin + '/dialog.html'
    Office.context.ui.displayDialogAsync(url, { width: 80, height: 85, displayInIframe: false },
      (result: any) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          console.error('Dialog failed:', result.error.message)
          return
        }
        dialogRef.current = result.value
        readyRef.current = false
        setIsOpen(true)

        dialogRef.current.addEventHandler(Office.EventType.DialogMessageReceived, (arg: any) => {
          try {
            const msg = JSON.parse(arg.message)
            if (msg.type === 'ready') {
              readyRef.current = true
              sendData(data)
            } else if (msg.type === 'refresh') {
              loadAllData()
            }
          } catch (_e) { /* ignore */ }
        })

        dialogRef.current.addEventHandler(Office.EventType.DialogEventReceived, () => {
          dialogRef.current = null
          readyRef.current = false
          setIsOpen(false)
        })
      }
    )
  }, [sendData, loadAllData])

  return { isOpen, openDialog, sendData }
}
