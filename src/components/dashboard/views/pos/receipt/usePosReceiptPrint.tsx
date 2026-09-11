/**
 * Starts a print job on whichever transport this device is configured for.
 *
 * The two paths are shaped very differently and the hook exists to hide that from callers:
 *
 * - Browser: render the copies, then print. Two explicit commits, because the DOM being printed
 *   must exist before `window.print()` runs — expressing that as an effect rather than burying it
 *   in a callback is what keeps the ordering visible.
 * - PassPRNT: serialize, check the payload is not over budget, persist the job, then navigate away.
 *   There is nothing to await. The result arrives on a later page load and is picked up by
 *   `usePassPrntReturn`.
 *
 * `printSurface` must be rendered by the caller. It is the body-level portal the browser path
 * prints — it cannot live inside the app tree, because the print stylesheet hides `#root` outright
 * to stop the dashboard producing a second blank page.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { usePosPrinterProfile } from '../../../../../data/hooks/usePosPrinterSettings'
import posPrinterSettingsRepository from '../../../../../data/repositories/posPrinterSettings'
import {
  PASSPRNT_MAX_RECEIPT_HEIGHT_PX,
  PASSPRNT_JOB_STALE_MS,
  POS_PRINTER_I18N_PREFIX,
  PosPrintTransport,
} from '../../../../../constants/posPrinter'
import type { PosPrintTransportType } from '../../../../../constants/posPrinter'
import type { PosPrintRestoreState, PosReceiptDocument } from '../../../../../types/domain'
import { logger } from '../../../../../utils/logger'
import { randomUuid } from '../../../../../utils/uuid'
import PosReceiptPrintDocument from './PosReceiptPrintDocument'
import { printDomWithBodyClass } from './browserPrintTransport'
import type { BrowserPrintHandle } from './browserPrintTransport'
import { buildPassPrntBackUrl, buildPassPrntUrl, firePassPrnt, readPassPrntReturnPath } from './passprntTransport'
import { buildPosReceiptHtml, estimatePosReceiptHeightPx } from './posReceiptHtml'
import { POS_INVOICE_PRINT_BODY_CLASS } from '../PosReceiptPrintPreview'

export interface PosPrintRequest {
  /** Stable per print run — the order id for a receipt, so a resumed job is unambiguous. */
  jobId: string
  copies: number
  restore: PosPrintRestoreState | null
  /** Path the PassPRNT callback should return to. No query string; see passprntTransport. */
  backPath: string
  kind?: 'receipt' | 'testPrint'
  browserOnly?: boolean
}

/** Release the button if afterprint is missing, but keep the printable DOM alive. */
const BROWSER_PRINT_UNLOCK_MS = 3000

interface PendingBrowserPrint {
  doc: PosReceiptDocument
  copies: number
}

export function usePosReceiptPrint() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: profile } = usePosPrinterProfile()
  const [pendingBrowserPrint, setPendingBrowserPrint] = useState<PendingBrowserPrint | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const printingRef = useRef(false)
  const passPrntCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => () => passPrntCleanupRef.current?.(), [])

  const transport: PosPrintTransportType = profile?.transport ?? PosPrintTransport.Browser

  const printViaBrowser = useCallback((doc: PosReceiptDocument, copies: number) => {
    setPendingBrowserPrint({ doc, copies: Math.max(1, copies) })
  }, [])

  // Second commit: the portal is mounted, so there is something to print.
  //
  // The receipt has to stay in the DOM until printing is genuinely finished. Clearing it on the
  // line after window.print() happens to work where the call blocks, but iOS Safari does not
  // reliably block and does not reliably fire afterprint either — and a receipt unmounted a tick
  // too early prints as a blank page. Only afterprint tears down the document; the fallback
  // timer unlocks the button while retaining the document until completion or replacement.
  useEffect(() => {
    if (!pendingBrowserPrint) return undefined

    let handle: BrowserPrintHandle | undefined
    let timer: number | undefined
    let torn = false
    const unlock = () => {
      printingRef.current = false
      setIsPrinting(false)
    }
    const teardown = () => {
      if (torn) return
      torn = true
      window.removeEventListener('afterprint', teardown)
      window.clearTimeout(timer)
      handle?.cancel()
      setPendingBrowserPrint(null)
      unlock()
    }

    // Blocking browsers may dispatch afterprint before window.print returns.
    window.addEventListener('afterprint', teardown, { once: true })
    handle = printDomWithBodyClass(POS_INVOICE_PRINT_BODY_CLASS, teardown)
    if (!torn) timer = window.setTimeout(unlock, BROWSER_PRINT_UNLOCK_MS)

    return () => {
      window.removeEventListener("afterprint", teardown)
      window.clearTimeout(timer)
      handle?.cancel()
    }
  }, [pendingBrowserPrint])

  const print = useCallback(
    (doc: PosReceiptDocument, request: PosPrintRequest) => {
      // Explicit re-entrancy guard rather than relying on render ordering: a double tap on
      // Complete, or a second Print while one is in flight, must not start two jobs.
      if (printingRef.current) {
        logger.warn('[usePosReceiptPrint] a print is already in flight; ignoring', request.jobId)
        return
      }
      if (request.copies < 1) return

      printingRef.current = true
      setIsPrinting(true)

      if (transport === PosPrintTransport.Browser || request.browserOnly) {
        printViaBrowser(doc, request.copies)
        return
      }

      const widthDots = profile?.paperWidthDots ?? 576
      const attemptId = randomUuid()
      const html = buildPosReceiptHtml(doc, { widthDots })
      const built =
        estimatePosReceiptHeightPx(doc) > PASSPRNT_MAX_RECEIPT_HEIGHT_PX
          ? { tooLarge: true as const, encodedLength: 0 }
          : buildPassPrntUrl({
              html,
              backUrl: buildPassPrntBackUrl(window.location.origin, request.backPath, attemptId),
              widthDots,
            })

      if ('tooLarge' in built) {
        // Refusing here beats letting PassPRNT answer with error 3 or iOS truncate the URL —
        // both of those reach the operator as blank paper with nothing to trace.
        logger.warn('[usePosReceiptPrint] receipt too large for PassPRNT, using the browser', built)
        showToast(t(`${POS_PRINTER_I18N_PREFIX}.printTooLarge`), 'info')
        printViaBrowser(doc, request.copies)
        return
      }

      posPrinterSettingsRepository.savePendingPrintJob({
        jobId: request.jobId,
        kind: request.kind ?? 'receipt',
        createdAt: new Date().toISOString(),
        copiesTotal: request.copies,
        copiesDone: 0,
        firedAttempts: 1,
        document: doc,
        restore: request.restore,
        attemptId,
        backPath: readPassPrntReturnPath(request.backPath).backPath,
      })

      // iOS can resume this same page (including from the back/forward cache). A URL
      // scheme launch does not unmount React, so the local lock needs its own lifecycle.
      passPrntCleanupRef.current?.()
      let leftPage = false
      const cleanup = () => {
        window.clearTimeout(timer)
        document.removeEventListener('visibilitychange', visibilityChanged)
        window.removeEventListener('pagehide', pageHidden)
        window.removeEventListener('pageshow', pageShown)
      }
      const unlock = () => {
        cleanup()
        printingRef.current = false
        setIsPrinting(false)
      }
      const pageHidden = () => { leftPage = true }
      const pageShown = () => {
        if (!leftPage) return
        const pending = posPrinterSettingsRepository.getPendingPrintJob()
        if (pending?.attemptId === attemptId) {
          posPrinterSettingsRepository.savePendingPrintJob({ ...pending, workspaceRestored: true })
        }
        unlock()
      }
      const visibilityChanged = () => {
        if (document.visibilityState === 'hidden') pageHidden()
        else pageShown()
      }
      const timer = window.setTimeout(() => {
        if (leftPage || document.visibilityState === 'hidden') return
        unlock()
        showToast(t(`${POS_PRINTER_I18N_PREFIX}.printNotStarted`), 'error')
      }, PASSPRNT_JOB_STALE_MS)
      document.addEventListener('visibilitychange', visibilityChanged)
      window.addEventListener('pagehide', pageHidden)
      window.addEventListener('pageshow', pageShown)
      passPrntCleanupRef.current = cleanup
      try {
        firePassPrnt(built.url)
      } catch (error) {
        unlock()
        logger.error('[usePosReceiptPrint] could not open PassPRNT', error)
        showToast(t(`${POS_PRINTER_I18N_PREFIX}.printNotStarted`), 'error')
      }
    },
    [transport, profile?.paperWidthDots, printViaBrowser, showToast, t],
  )

  /**
   * Rendered off-screen and revealed only by the print stylesheet, so N copies leave as one job
   * without the operator ever seeing N receipts stacked on the page.
   */
  const printSurface =
    pendingBrowserPrint && typeof document !== 'undefined'
      ? createPortal(
          <div className="pos-receipt-print-offscreen" aria-hidden="true">
            {Array.from({ length: pendingBrowserPrint.copies }, (_, index) => (
              <PosReceiptPrintDocument
                key={`copy-${index}`}
                doc={pendingBrowserPrint.doc}
                className={
                  index < pendingBrowserPrint.copies - 1
                    ? 'pos-receipt-print--page-break'
                    : undefined
                }
              />
            ))}
          </div>,
          document.body,
        )
      : null

  return { print, isPrinting, transport, printSurface }
}
