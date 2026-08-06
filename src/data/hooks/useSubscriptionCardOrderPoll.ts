import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import { ORDER_STATUS_POLL_TIMEOUT_MS, subscriptionModalKey } from '../../components/dashboard/modals/subscriptionPaymentConstants'
import { SubscriptionPaymentStatus } from '../repositories/subscriptionPayments'
import { useSubscriptionOrderStatusPoll } from './useSubscriptionPayments'

type UseSubscriptionCardOrderPollOptions = {
  onPaid: () => void
  onFailed?: () => void
}

export function useSubscriptionCardOrderPoll({
  onPaid,
  onFailed,
}: UseSubscriptionCardOrderPollOptions) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [pollTimedOut, setPollTimedOut] = useState(false)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handledPaidOrderRef = useRef<string | null>(null)

  const orderStatusQuery = useSubscriptionOrderStatusPoll(pendingOrderId, {
    enabled: Boolean(pendingOrderId) && !pollTimedOut,
  })

  const beginPolling = useCallback((orderId: string) => {
    setPollTimedOut(false)
    setPendingOrderId(orderId)
  }, [])

  const resetPolling = useCallback(() => {
    setPendingOrderId(null)
    setPollTimedOut(false)
    handledPaidOrderRef.current = null
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (!pendingOrderId) return

    const status = orderStatusQuery.data?.paymentStatus
    if (status === SubscriptionPaymentStatus.Paid) {
      if (handledPaidOrderRef.current === pendingOrderId) return
      handledPaidOrderRef.current = pendingOrderId
      setPendingOrderId(null)
      onPaid()
      return
    }

    if (status === SubscriptionPaymentStatus.Failed) {
      showToast(t(subscriptionModalKey('cardPaymentError')), 'error')
      setPendingOrderId(null)
      onFailed?.()
    }
  }, [
    pendingOrderId,
    orderStatusQuery.data?.paymentStatus,
    onPaid,
    onFailed,
    showToast,
    t,
  ])

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
    showToast(t(subscriptionModalKey('cardPaymentProcessingTimeout')), 'info')
  }, [pollTimedOut, pendingOrderId, showToast, t])

  return {
    pendingOrderId,
    isPolling: Boolean(pendingOrderId),
    beginPolling,
    resetPolling,
  }
}
