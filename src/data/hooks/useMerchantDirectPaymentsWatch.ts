import { useCallback, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DIRECT_PAYMENTS_WATCH_PAGE_SIZE } from '../../constants/pagination'
import { resolveDirectPaymentDateRange } from '../../utils/directPaymentDateRange'
import { dismissAckPrompt, readDismissedAckIds } from '../../utils/directPaymentAckDismiss'
import { needsMerchantAcknowledge } from '../../utils/directPaymentStatus'
import type { MerchantPaymentRecord } from '../../types/domain'
import { PaymentType } from '../../types/domain'
import type { MerchantPaymentsListQuery } from '../repositories/merchantPayments'
import { useMerchantPaymentsList } from './useMerchantPayments'
import { useInitiatedDirectPaymentStatusPolls } from './useDirectPaymentStatusPoll'

export function useMerchantDirectPaymentsWatchBootstrapQuery(): MerchantPaymentsListQuery {
  return useMemo(
    () => ({
      page: 1,
      pageSize: DIRECT_PAYMENTS_WATCH_PAGE_SIZE,
      type: PaymentType.DirectPayment,
      ...resolveDirectPaymentDateRange('30days'),
    }),
    [],
  )
}

export function useMerchantDirectPaymentsWatch({ enabled = true } = {}) {
  const location = useLocation()
  const bootstrapQuery = useMerchantDirectPaymentsWatchBootstrapQuery()
  const { data: paymentsPage } = useMerchantPaymentsList(bootstrapQuery, { enabled })
  const payments = paymentsPage?.items ?? []

  const pendingAckCount = useMemo(
    () => payments.filter((payment) => needsMerchantAcknowledge(payment)).length,
    [payments],
  )

  const [ackNoticePayment, setAckNoticePayment] = useState<MerchantPaymentRecord | null>(null)
  const promptedAckIdsRef = useRef(new Set<string>())

  const selectedPaymentId = useMemo(() => {
    if (!location.pathname.includes('/dashboard/reports')) return null
    return new URLSearchParams(location.search).get('paymentId')
  }, [location.pathname, location.search])

  const handleCustomerConfirmed = useCallback((payment: MerchantPaymentRecord) => {
    if (ackNoticePayment || selectedPaymentId) return

    const dismissed = readDismissedAckIds()
    if (dismissed.has(payment.id) || promptedAckIdsRef.current.has(payment.id)) return

    promptedAckIdsRef.current.add(payment.id)
    setAckNoticePayment(payment)
  }, [ackNoticePayment, selectedPaymentId])

  useInitiatedDirectPaymentStatusPolls(payments, {
    onCustomerConfirmed: handleCustomerConfirmed,
  })

  const closeAckNotice = useCallback(() => {
    if (ackNoticePayment) dismissAckPrompt(ackNoticePayment.id)
    setAckNoticePayment(null)
  }, [ackNoticePayment])

  return {
    bootstrapQuery,
    payments,
    pendingAckCount,
    ackNoticePayment,
    setAckNoticePayment,
    closeAckNotice,
  }
}
