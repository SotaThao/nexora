/**
 * VlinkPayCheckoutFrame — embeds the VlinkPay Merchant Portal payment page inside POS so a
 * cashier can collect crypto or gift card payments without leaving the order.
 *
 * Two things this component is careful about:
 *
 * 1. It only trusts messages whose `event.origin` matches the VlinkPay portal. Any page can
 *    post into this window, so the origin check is what stops a forged "paid" message.
 *
 * 2. When the iframe closes without a result, the payment may still have gone through — the
 *    message can be lost if the tab is closed, the device sleeps, or the browser blocks it.
 *    In that case the caller must reconcile with VlinkPay before letting the cashier collect
 *    again, which is why `onUnresolved` exists and is distinct from `onCancelled`.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import type { VlinkPayEmbedResultMessage } from '../../types/repositories'

const RESULT_MESSAGE_TYPE = 'VLINKPAY_PAYMENT_RESULT'

export interface VlinkPayCheckoutFrameProps {
  /** URL returned by the payment-url endpoint. */
  iframeUrl: string
  /** Order this payment belongs to; used to ignore results meant for another order. */
  orderId: string
  onSuccess: (result: VlinkPayEmbedResultMessage) => void
  onFailed: (result: VlinkPayEmbedResultMessage) => void
  /** Cashier or customer backed out; nothing was charged. */
  onCancelled: () => void
  /**
   * Closed without any result. The payment may or may not have happened — reconcile with
   * VlinkPay by order id before offering to collect again.
   */
  onUnresolved: () => void
  onClose: () => void
  title?: string
}

function originOf(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

export function VlinkPayCheckoutFrame({
  iframeUrl,
  orderId,
  onSuccess,
  onFailed,
  onCancelled,
  onUnresolved,
  onClose,
  title = 'VlinkPay',
}: VlinkPayCheckoutFrameProps) {
  const [loading, setLoading] = useState(true)
  // Tracks whether VlinkPay told us anything at all, so closing the frame can distinguish
  // "customer walked away" from "we simply never heard back".
  const resolvedRef = useRef(false)

  const expectedOrigin = originOf(iframeUrl)

  useEffect(() => {
    if (!expectedOrigin) return

    const handleMessage = (event: MessageEvent) => {
      // Never act on a message from anywhere other than the VlinkPay portal.
      if (event.origin !== expectedOrigin) return

      const data = event.data as VlinkPayEmbedResultMessage | undefined
      if (!data || data.type !== RESULT_MESSAGE_TYPE) return

      // A stale frame from a previous order must not settle this one.
      if (data.externalRefId !== orderId) return

      resolvedRef.current = true

      if (data.status === 'success') {
        onSuccess(data)
      } else if (data.status === 'failed') {
        onFailed(data)
      } else {
        onCancelled()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [expectedOrigin, orderId, onSuccess, onFailed, onCancelled])

  const handleClose = useCallback(() => {
    if (!resolvedRef.current) onUnresolved()
    onClose()
  }, [onUnresolved, onClose])

  if (!expectedOrigin) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
        <div role="alert" className="nexora-modal-card max-w-md gap-4">
          <p className="text-base font-bold text-nexoraText">
            Could not open VlinkPay: the payment link is not valid.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-nexoraBorder bg-nexoraSurface px-4 text-sm font-bold text-nexoraText hover:bg-nexoraCanvas"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    // No backdrop-click-to-close here, unlike the other POS dialogs: a stray tap while the
    // customer is mid-payment would drop the frame without a result, and the money may already
    // have moved. Closing is deliberate, through the header button only.
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="nexora-card flex h-full max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-nexoraBorder px-6 py-4">
          <span className="min-w-0 flex-1 truncate text-xl font-bold text-nexoraText">
            {title}
          </span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close payment"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraSurface text-nexoraText hover:bg-nexoraCanvas"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* The iframe and the spinner share this box so the payment page is never pushed out of
            view by the loading state — the spinner sits on top and disappears on load. */}
        <div className="relative min-h-0 flex-1">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-nexoraSurface">
              <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
            </div>
          ) : null}

          <iframe
            title={title}
            src={iframeUrl}
            onLoad={() => setLoading(false)}
            className="h-full w-full border-0"
            // The payment pages scan QR codes, so the camera has to be reachable.
            allow="camera; microphone"
          />
        </div>
      </div>
    </div>
  )
}

export default VlinkPayCheckoutFrame
