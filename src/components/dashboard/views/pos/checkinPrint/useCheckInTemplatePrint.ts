import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { printDomWithBodyClass, type BrowserPrintHandle } from '../receipt/browserPrintTransport'
import type { CheckInPrintDocument, PrintAssets } from './checkInPrintTypes'

export interface CheckInPrintJob { document: CheckInPrintDocument; assets: PrintAssets; landscape: boolean; widthPt: number; heightPt: number }
export function useCheckInTemplatePrint() {
  const [job, setJob] = useState<CheckInPrintJob | null>(null)
  const handle = useRef<BrowserPrintHandle | null>(null)
  const cleanup = useCallback(() => { handle.current?.cancel(); handle.current = null; setJob(null) }, [])
  useEffect(() => {
    window.addEventListener('afterprint', cleanup)
    return () => { window.removeEventListener('afterprint', cleanup); handle.current?.cancel() }
  }, [cleanup])
  const print = (document: CheckInPrintDocument, assets: PrintAssets) => {
    if (job) return
    const landscape = document.widthPt > document.heightPt
    flushSync(() => setJob({ document, assets, landscape, widthPt: document.widthPt, heightPt: document.heightPt }))
    handle.current = printDomWithBodyClass('printing-checkin-qr')
    if (!window.document.body.classList.contains('printing-checkin-qr')) cleanup()
  }
  return { job, print, cancel: cleanup }
}
