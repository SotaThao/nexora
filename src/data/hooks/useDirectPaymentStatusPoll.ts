import { useEffect, useMemo, useRef } from 'react'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import publicDirectPaymentRepository from '../repositories/publicDirectPayment'
import type { DirectPaymentStatusSnapshot, MerchantPaymentRecord } from '../../types/domain'
import { PaymentStatus } from '../../types/domain'
import {
  mergePaymentWithStatusSnapshot,
  resolveDirectPaymentStatusPollInterval,
  shouldPollDirectPaymentStatus,
  syncDirectPaymentStatusToCache,
} from '../utils/syncDirectPaymentStatus'
import { normalizePaymentStatusValue } from '../../utils/directPaymentStatus'

function useSyncStatusSnapshot(paymentId: string | null | undefined, snapshot?: DirectPaymentStatusSnapshot) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!paymentId || !snapshot) return
    syncDirectPaymentStatusToCache(queryClient, paymentId, snapshot)
  }, [paymentId, queryClient, snapshot])
}

type PollSeed = Pick<MerchantPaymentRecord, 'status' | 'customerConfirmedAt' | 'merchantConfirmedAt'>

/** Poll public status for one payment while Initiated. */
export function useDirectPaymentStatusPoll(
  paymentId?: string | null,
  {
    enabled = true,
    seedStatus,
    seedPayment,
  }: { enabled?: boolean; seedStatus?: number; seedPayment?: PollSeed | null } = {},
) {
  const pollSeed = seedPayment ?? (seedStatus != null ? { status: seedStatus } : null)
  const shouldPoll = enabled && Boolean(paymentId) && shouldPollDirectPaymentStatus(seedStatus, pollSeed)

  const query = useQuery<DirectPaymentStatusSnapshot>({
    queryKey: qk.publicPaymentStatus(paymentId ?? ''),
    queryFn: () => publicDirectPaymentRepository.getPaymentStatus(paymentId!),
    enabled: shouldPoll,
    retry: false,
    refetchInterval: (q) => {
      const snapshot = q.state.data
      const merged = snapshot && pollSeed
        ? mergePaymentWithStatusSnapshot(
            { id: paymentId!, ...pollSeed } as MerchantPaymentRecord,
            snapshot,
          )
        : pollSeed
      return resolveDirectPaymentStatusPollInterval(
        snapshot?.status ?? seedStatus,
        merged ?? pollSeed,
      )
    },
    refetchIntervalInBackground: false,
  })

  useSyncStatusSnapshot(paymentId, query.data)

  return query
}

type CustomerConfirmedHandler = (payment: MerchantPaymentRecord) => void

function pickNewestInitiatedPayment(payments: MerchantPaymentRecord[]): MerchantPaymentRecord | null {
  const initiated = payments.filter(
    (payment) => normalizePaymentStatusValue(payment.status) === PaymentStatus.Initiated,
  )
  if (!initiated.length) return null

  return [...initiated].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || '') || 0
    const rightTime = Date.parse(right.createdAt || '') || 0
    return rightTime - leftTime
  })[0]
}

/** Poll the newest Initiated payment; fires when status API reports Confirmed. */
export function useInitiatedDirectPaymentStatusPolls(
  payments: MerchantPaymentRecord[] = [],
  { onCustomerConfirmed }: { onCustomerConfirmed?: CustomerConfirmedHandler } = {},
) {
  const queryClient = useQueryClient()
  const previousStatusRef = useRef(new Map<string, number>())
  const onCustomerConfirmedRef = useRef(onCustomerConfirmed)

  useEffect(() => {
    onCustomerConfirmedRef.current = onCustomerConfirmed
  }, [onCustomerConfirmed])

  const initiatedPaymentToTrack = useMemo(
    () => pickNewestInitiatedPayment(payments),
    [payments],
  )

  const pollableIds = useMemo(
    () => (initiatedPaymentToTrack ? [initiatedPaymentToTrack.id] : []),
    [initiatedPaymentToTrack],
  )

  const paymentById = useMemo(() => {
    const map = new Map<string, MerchantPaymentRecord>()
    if (initiatedPaymentToTrack) {
      map.set(initiatedPaymentToTrack.id, initiatedPaymentToTrack)
    }
    return map
  }, [initiatedPaymentToTrack])

  useEffect(() => {
    if (!initiatedPaymentToTrack) return
    if (!previousStatusRef.current.has(initiatedPaymentToTrack.id)) {
      previousStatusRef.current.set(
        initiatedPaymentToTrack.id,
        normalizePaymentStatusValue(initiatedPaymentToTrack.status),
      )
    }
  }, [initiatedPaymentToTrack])

  const queries = useQueries({
    queries: pollableIds.map((paymentId) => {
      const payment = paymentById.get(paymentId)!
      return {
        queryKey: qk.publicPaymentStatus(paymentId),
        queryFn: () => publicDirectPaymentRepository.getPaymentStatus(paymentId),
        enabled: true,
        retry: false,
        refetchInterval: (q: { state: { data?: DirectPaymentStatusSnapshot } }) => {
          const snapshot = q.state.data
          const merged = snapshot
            ? mergePaymentWithStatusSnapshot(payment, snapshot)
            : payment
          return resolveDirectPaymentStatusPollInterval(merged.status, merged)
        },
        refetchIntervalInBackground: false,
      }
    }),
  })

  useEffect(() => {
    queries.forEach((result, index) => {
      const paymentId = pollableIds[index]
      const payment = paymentById.get(paymentId)
      if (!paymentId || !payment || !result.data) return

      const previousStatus =
        previousStatusRef.current.get(paymentId) ?? normalizePaymentStatusValue(payment.status)
      const nextStatus = normalizePaymentStatusValue(result.data.status)
      const merged = mergePaymentWithStatusSnapshot(payment, result.data)

      syncDirectPaymentStatusToCache(queryClient, paymentId, result.data)
      previousStatusRef.current.set(paymentId, nextStatus)

      if (
        previousStatus === PaymentStatus.Initiated &&
        nextStatus === PaymentStatus.Confirmed &&
        onCustomerConfirmedRef.current
      ) {
        onCustomerConfirmedRef.current(merged)
      }
    })
  }, [queries, pollableIds, paymentById, queryClient])

  const statusById = useMemo(() => {
    const map = new Map<string, DirectPaymentStatusSnapshot>()
    queries.forEach((result, index) => {
      if (result.data) {
        map.set(pollableIds[index], result.data)
      }
    })
    return map
  }, [queries, pollableIds])

  return { initiatedIds: pollableIds, statusById, isPolling: pollableIds.length > 0 }
}

export function mergePaymentWithLiveStatus(
  payment: MerchantPaymentRecord | null | undefined,
  snapshot?: DirectPaymentStatusSnapshot | null,
): MerchantPaymentRecord | null {
  if (!payment) return null
  if (!snapshot) return payment
  return mergePaymentWithStatusSnapshot(payment, snapshot)
}

export function isAwaitingCustomerConfirm(status: number | undefined): boolean {
  return normalizePaymentStatusValue(status) === PaymentStatus.Initiated
}
