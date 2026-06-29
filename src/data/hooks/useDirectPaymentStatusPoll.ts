import { useEffect, useMemo, useRef } from 'react'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import publicDirectPaymentRepository from '../repositories/publicDirectPayment'
import type { DirectPaymentStatusSnapshot, MerchantPaymentRecord } from '../../types/domain'
import { PaymentStatus } from '../../types/domain'
import {
  mergePaymentWithStatusSnapshot,
  resolveDirectPaymentStatusPollInterval,
  shouldPollDirectPaymentAckWatch,
  shouldPollDirectPaymentStatus,
  syncDirectPaymentStatusToCache,
  DIRECT_PAYMENT_STATUS_POLL_MS,
} from '../utils/syncDirectPaymentStatus'
import { normalizePaymentStatusValue, needsAcknowledgeFromStatusSnapshot } from '../../utils/directPaymentStatus'
import { collectPaymentsForAckWatch } from '../../utils/directPaymentAckNotice'

function useSyncStatusSnapshot(paymentId: string | null | undefined, snapshot?: DirectPaymentStatusSnapshot) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!paymentId || !snapshot) return
    syncDirectPaymentStatusToCache(queryClient, paymentId, snapshot)
  }, [paymentId, queryClient, snapshot])
}

type PollSeed = Pick<MerchantPaymentRecord, 'status' | 'customerConfirmedAt' | 'merchantConfirmedAt'>

type AckStatusPollPayment = {
  id: string
  status: unknown
  customerConfirmedAt?: string | null
  merchantConfirmedAt?: string | null
}

/** Poll public status for one Confirmed payment (awaiting receipt ack). */
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

/** Poll the newest Confirmed payment that still needs receipt acknowledgement (detail views). */
export function useConfirmedDirectPaymentStatusPoll(
  payment: AckStatusPollPayment | null | undefined,
) {
  const seedStatus = payment ? normalizePaymentStatusValue(payment.status) : undefined
  const pollSeed: PollSeed | null = payment
    ? {
        status: seedStatus!,
        customerConfirmedAt: payment.customerConfirmedAt,
        merchantConfirmedAt: payment.merchantConfirmedAt ?? null,
      }
    : null

  return useDirectPaymentStatusPoll(payment?.id, {
    enabled: Boolean(payment),
    seedStatus,
    seedPayment: pollSeed,
  })
}

type AckWatchPollPayment = AckStatusPollPayment & {
  createdAt?: string
}

/** Global watcher — poll every payment needing ack watch; fire when status API is Confirmed. */
export function useDirectPaymentsAckWatchPolls<T extends AckWatchPollPayment>(
  payments: T[] = [],
  {
    needsAck,
    onCustomerConfirmed,
  }: {
    needsAck: (payment: T) => boolean
    onCustomerConfirmed?: (snapshot: DirectPaymentStatusSnapshot) => void
  },
) {
  const queryClient = useQueryClient()
  const onCustomerConfirmedRef = useRef(onCustomerConfirmed)

  useEffect(() => {
    onCustomerConfirmedRef.current = onCustomerConfirmed
  }, [onCustomerConfirmed])

  const watchPayments = useMemo(
    () => collectPaymentsForAckWatch(payments, needsAck),
    [payments, needsAck],
  )

  const queries = useQueries({
    queries: watchPayments.map((payment) => {
      const seedStatus = normalizePaymentStatusValue(payment.status)
      const pollSeed: PollSeed = {
        status: seedStatus,
        customerConfirmedAt: payment.customerConfirmedAt,
        merchantConfirmedAt: payment.merchantConfirmedAt ?? null,
      }

      return {
        queryKey: qk.publicPaymentStatus(payment.id),
        queryFn: () => publicDirectPaymentRepository.getPaymentStatus(payment.id),
        enabled: shouldPollDirectPaymentAckWatch(seedStatus, pollSeed),
        retry: false,
        refetchInterval: (q: { state: { data?: DirectPaymentStatusSnapshot } }) => {
          const snapshot = q.state.data
          const mergedStatus = snapshot
            ? normalizePaymentStatusValue(snapshot.status)
            : seedStatus
          return shouldPollDirectPaymentAckWatch(mergedStatus, pollSeed)
            ? DIRECT_PAYMENT_STATUS_POLL_MS
            : false
        },
        refetchIntervalInBackground: false,
      }
    }),
  })

  useEffect(() => {
    queries.forEach((result, index) => {
      const payment = watchPayments[index]
      if (!payment || !result.data) return

      syncDirectPaymentStatusToCache(queryClient, payment.id, result.data)

      if (
        needsAcknowledgeFromStatusSnapshot(result.data) &&
        onCustomerConfirmedRef.current
      ) {
        const handler = onCustomerConfirmedRef.current
        const payload = result.data
        queueMicrotask(() => handler(payload))
      }
    })
  }, [queries, watchPayments, queryClient])

  return { watchPayments, queries }
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
  {
    onCustomerConfirmed,
    enabled = true,
  }: { onCustomerConfirmed?: CustomerConfirmedHandler; enabled?: boolean } = {},
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
    () => (enabled && initiatedPaymentToTrack ? [initiatedPaymentToTrack.id] : []),
    [enabled, initiatedPaymentToTrack],
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
        const handler = onCustomerConfirmedRef.current
        const payload = merged
        queueMicrotask(() => handler(payload))
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
