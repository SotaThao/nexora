/**
 * The `window.print()` path — the receipt printing this app already did, extracted so both the
 * preview modal and the new orchestration hook share one implementation.
 *
 * The body class is what the print stylesheet keys off: it hides `#root`, forces black ink, and
 * applies the 80mm `@page` rule. The `afterprint` listener has to be one-shot and has to run even
 * when `window.print()` throws, or the class stays on and the app renders as a receipt.
 *
 * The same shape appears in `report/PosReportDetailModal.tsx` for the 80mm staff report; swapping
 * that over is a behaviour-free follow-up, deliberately not bundled into this change.
 */
import { logger } from '../../../../../utils/logger'

export interface BrowserPrintHandle {
  /** Removes the body class and the listener. Safe to call twice. */
  cancel: () => void
}

export function printDomWithBodyClass(bodyClass: string): BrowserPrintHandle {
  if (typeof window === 'undefined' || typeof window.print !== 'function') {
    return { cancel: () => {} }
  }

  let done = false
  const cleanup = () => {
    if (done) return
    done = true
    window.removeEventListener('afterprint', cleanup)
    document.body.classList.remove(bodyClass)
  }

  document.body.classList.add(bodyClass)
  window.addEventListener('afterprint', cleanup, { once: true })

  try {
    window.print()
  } catch (error) {
    // A blocked or unavailable print dialog must not leave the app wearing the print stylesheet.
    logger.error('[browserPrintTransport] window.print() failed', error)
    cleanup()
  }

  return { cancel: cleanup }
}
