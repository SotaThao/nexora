import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DIRECT_PAYMENTS_WATCH_PAGE_SIZE } from '../../constants/pagination'
import { resolveDirectPaymentDateRange } from '../../utils/directPaymentDateRange'
import {
  pickNewestPendingAckPayment,
  scheduleAckNoticeUpdate,
  shouldPromptAckNotice,
} from '../../utils/directPaymentAckNotice'
import { needsMerchantAcknowledge } from '../../utils/directPaymentStatus'
import type { MerchantPaymentRecord } from '../../types/domain'
import { PaymentType } from '../../types/domain'
import type { MerchantPaymentsListQuery } from '../repositories/merchantPayments'
import { useMerchantPaymentsList } from './useMerchantPayments'

const EMPTY_PAYMENTS: MerchantPaymentRecord[] = []

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
  const payments = paymentsPage?.items ?? EMPTY_PAYMENTS

  const pendingAckCount = useMemo(
    () => payments.filter((payment) => needsMerchantAcknowledge(payment)).length,
    [payments],
  )

  const [ackNoticePayment, setAckNoticePayment] = useState<MerchantPaymentRecord | null>(null)
  const ackNoticePaymentRef = useRef(ackNoticePayment)
  const selectedPaymentIdRef = useRef<string | null>(null)
  const isViewingDirectPaymentsRef = useRef(false)
  const closedAckIdsRef = useRef(new Set<string>())

  const { selectedPaymentId, isViewingDirectPayments } = useMemo(() => {
    if (!location.pathname.includes('/dashboard/reports')) {
      return { selectedPaymentId: null, isViewingDirectPayments: false }
    }
    const params = new URLSearchParams(location.search)
    const isDirectPaymentsTab = params.get('tab') === 'direct_payments'
    return {
      selectedPaymentId: params.get('paymentId'),
      isViewingDirectPayments: isDirectPaymentsTab,
    }
  }, [location.pathname, location.search])

  ackNoticePaymentRef.current = ackNoticePayment
  selectedPaymentIdRef.current = selectedPaymentId
  isViewingDirectPaymentsRef.current = isViewingDirectPayments

  useEffect(() => {
    closedAckIdsRef.current.clear()
  }, [location.pathname, location.search])

  const tryShowAckNotice = useCallback((payment: MerchantPaymentRecord) => {
    if (isViewingDirectPaymentsRef.current) return
    if (selectedPaymentIdRef.current) return
    if (!needsMerchantAcknowledge(payment)) return
    if (closedAckIdsRef.current.has(payment.id)) return
    if (!shouldPromptAckNotice(payment.id)) return
    if (ackNoticePaymentRef.current?.id === payment.id) return

    scheduleAckNoticeUpdate(() => {
      if (isViewingDirectPaymentsRef.current) return
      if (selectedPaymentIdRef.current) return
      if (!shouldPromptAckNotice(payment.id)) return
      setAckNoticePayment(payment)
    })
  }, [])

  useEffect(() => {
    if (isViewingDirectPayments && ackNoticePayment) {
      setAckNoticePayment(null)
      return
    }

    if (!selectedPaymentId || !ackNoticePayment) return
    if (ackNoticePayment.id === selectedPaymentId) {
      setAckNoticePayment(null)
    }
  }, [selectedPaymentId, isViewingDirectPayments, ackNoticePayment])

  useEffect(() => {
    if (isViewingDirectPayments) return
    if (selectedPaymentId) return

    const newestPending = pickNewestPendingAckPayment(payments, needsMerchantAcknowledge)
    if (!newestPending) return

    tryShowAckNotice(newestPending)
  }, [payments, selectedPaymentId, isViewingDirectPayments, location.pathname, location.search, tryShowAckNotice])

  const closeAckNotice = useCallback(() => {
    if (ackNoticePayment) closedAckIdsRef.current.add(ackNoticePayment.id)
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
