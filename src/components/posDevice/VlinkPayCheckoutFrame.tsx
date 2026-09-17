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
      <div role="alert">
        Could not open VlinkPay: the payment link is not valid.
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="vlinkpay-checkout-frame">
      <header className="vlinkpay-checkout-frame__header">
        <span>{title}</span>
        <button type="button" onClick={handleClose} aria-label="Close payment">
          ×
        </button>
      </header>

      {loading && <div className="vlinkpay-checkout-frame__loading">Loading…</div>}

      <iframe
        title={title}
        src={iframeUrl}
        onLoad={() => setLoading(false)}
        className="vlinkpay-checkout-frame__iframe"
        // The payment pages scan QR codes, so the camera has to be reachable.
        allow="camera; microphone"
      />
    </div>
  )
}

export default VlinkPayCheckoutFrame
