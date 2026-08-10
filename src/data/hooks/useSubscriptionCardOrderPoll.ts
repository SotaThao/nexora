import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import {
  ORDER_STATUS_POLL_TIMEOUT_MS,
  subscriptionModalKey,
} from '../../components/dashboard/modals/subscriptionPaymentConstants'
import { SubscriptionPaymentStatus } from '../repositories/subscriptionPayments'
import { useSubscriptionOrderStatusPoll } from './useSubscriptionPayments'

type UseSubscriptionCardOrderPollOptions = {
  onPaid: () => void
  onFailed?: () => void
  /** Fired when polling exceeds the timeout — order may still settle via webhook. */
  onTimeout?: () => void
}

const PollTerminalKind = {
  Paid: 'paid',
  Failed: 'failed',
  Timeout: 'timeout',
} as const

type PollTerminalKindValue = (typeof PollTerminalKind)[keyof typeof PollTerminalKind]

const TERMINAL_KIND_BY_STATUS: Partial<
  Record<SubscriptionPaymentStatus, PollTerminalKindValue>
> = {
  [SubscriptionPaymentStatus.Paid]: PollTerminalKind.Paid,
  [SubscriptionPaymentStatus.Failed]: PollTerminalKind.Failed,
}

export function useSubscriptionCardOrderPoll({
  onPaid,
  onFailed,
  onTimeout,
}: UseSubscriptionCardOrderPollOptions) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [pollTimedOut, setPollTimedOut] = useState(false)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handledTerminalOrderRef = useRef<string | null>(null)

  const orderStatusQuery = useSubscriptionOrderStatusPoll(pendingOrderId, {
    enabled: Boolean(pendingOrderId) && !pollTimedOut,
  })

  const beginPolling = useCallback((orderId: string) => {
    if (!orderId) return
    setPollTimedOut(false)
    handledTerminalOrderRef.current = null
    setPendingOrderId(orderId)
  }, [])

  const resetPolling = useCallback(() => {
    setPendingOrderId(null)
    setPollTimedOut(false)
    handledTerminalOrderRef.current = null
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
  }, [])

  const settleTerminal = useCallback(
    (orderId: string, kind: PollTerminalKindValue) => {
      if (handledTerminalOrderRef.current === orderId) return
      handledTerminalOrderRef.current = orderId
      setPendingOrderId(null)

      if (kind === PollTerminalKind.Paid) {
        onPaid()
        return
      }
      if (kind === PollTerminalKind.Failed) {
        showToast(t(subscriptionModalKey('paymentFailed')), 'error')
        onFailed?.()
        return
      }
      showToast(t(subscriptionModalKey('cardPaymentProcessingTimeout')), 'info')
      onTimeout?.()
    },
    [onFailed, onPaid, onTimeout, showToast, t],
  )

  useEffect(() => {
    if (!pendingOrderId) return
    const status = orderStatusQuery.data?.paymentStatus
    const kind = status ? TERMINAL_KIND_BY_STATUS[status] : undefined
    if (!kind) return
    settleTerminal(pendingOrderId, kind)
  }, [pendingOrderId, orderStatusQuery.data?.paymentStatus, settleTerminal])

  useEffect(() => {
    if (!pendingOrderId) return

    const timeoutId = setTimeout(() => {
      pollTimeoutRef.current = null
      setPollTimedOut(true)
    }, ORDER_STATUS_POLL_TIMEOUT_MS)
    pollTimeoutRef.current = timeoutId

    return () => {
      if (pollTimeoutRef.current === timeoutId) {
        clearTimeout(timeoutId)
        pollTimeoutRef.current = null
      }
    }
  }, [pendingOrderId])

  useEffect(() => {
    if (!pollTimedOut || !pendingOrderId) return
    settleTerminal(pendingOrderId, PollTerminalKind.Timeout)
  }, [pollTimedOut, pendingOrderId, settleTerminal])

  return {
    pendingOrderId,
    isPolling: Boolean(pendingOrderId),
    beginPolling,
    resetPolling,
  }
}
