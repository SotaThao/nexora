import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DIRECT_PAYMENTS_WATCH_PAGE_SIZE } from '../../constants/pagination'
import { resolveDirectPaymentDateRange } from '../../utils/directPaymentDateRange'
import {
  pickNewestPendingAckPayment,
  scheduleAckNoticeUpdate,
  shouldPromptAckNotice,
} from '../../utils/directPaymentAckNotice'
import { needsStaffAcknowledge } from '../../utils/directPaymentStatus'
import type { StaffPaymentRecord } from '../../types/domain'
import { PaymentType } from '../../types/domain'
import type { StaffPaymentsListQuery } from '../repositories/staffPayments'
import { useStaffPaymentsList } from './useStaffPayments'

const EMPTY_PAYMENTS: StaffPaymentRecord[] = []

export function useStaffDirectPaymentsWatchBootstrapQuery(): StaffPaymentsListQuery {
  return useMemo(
    () => ({
      page: 1,
      pageSize: DIRECT_PAYMENTS_WATCH_PAGE_SIZE,
      type: PaymentType.StaffDirectPayment,
      ...resolveDirectPaymentDateRange('30days'),
    }),
    [],
  )
}

export function useStaffDirectPaymentsWatch({ enabled = true } = {}) {
  const location = useLocation()
  const bootstrapQuery = useStaffDirectPaymentsWatchBootstrapQuery()
  const { data: paymentsPage } = useStaffPaymentsList(bootstrapQuery, { enabled })
  const payments = paymentsPage?.items ?? EMPTY_PAYMENTS

  const pendingAckCount = useMemo(
    () => payments.filter((payment) => needsStaffAcknowledge(payment)).length,
    [payments],
  )

  const [ackNoticePayment, setAckNoticePayment] = useState<StaffPaymentRecord | null>(null)
  const ackNoticePaymentRef = useRef(ackNoticePayment)
  const selectedPaymentIdRef = useRef<string | null>(null)
  const closedAckIdsRef = useRef(new Set<string>())

  const selectedPaymentId = useMemo(() => {
    if (!location.pathname.includes('/staff/payments')) return null
    const parts = location.pathname.split('/').filter(Boolean)
    const paymentsIdx = parts.indexOf('payments')
    if (paymentsIdx >= 0 && parts[paymentsIdx + 1]) {
      return parts[paymentsIdx + 1]
    }
    return null
  }, [location.pathname])

  ackNoticePaymentRef.current = ackNoticePayment
  selectedPaymentIdRef.current = selectedPaymentId

  useEffect(() => {
    closedAckIdsRef.current.clear()
  }, [location.pathname])

  const tryShowAckNotice = useCallback((payment: StaffPaymentRecord) => {
    if (selectedPaymentIdRef.current) return
    if (!needsStaffAcknowledge(payment)) return
    if (closedAckIdsRef.current.has(payment.id)) return
    if (!shouldPromptAckNotice(payment.id)) return
    if (ackNoticePaymentRef.current?.id === payment.id) return

    scheduleAckNoticeUpdate(() => {
      if (selectedPaymentIdRef.current) return
      if (!shouldPromptAckNotice(payment.id)) return
      setAckNoticePayment(payment)
    })
  }, [])

  // Hide overlay while viewing the same payment detail — re-show when navigating away.
  useEffect(() => {
    if (!selectedPaymentId || !ackNoticePayment) return
    if (ackNoticePayment.id === selectedPaymentId) {
      setAckNoticePayment(null)
    }
  }, [selectedPaymentId, ackNoticePayment])

  useEffect(() => {
    if (selectedPaymentId) return

    const newestPending = pickNewestPendingAckPayment(payments, needsStaffAcknowledge)
    if (!newestPending) return

    tryShowAckNotice(newestPending)
  }, [payments, selectedPaymentId, location.pathname, tryShowAckNotice])

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
