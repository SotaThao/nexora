import type { QueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import type {
  DirectPaymentStatusSnapshot,
  MerchantPaymentRecord,
  MerchantPaymentsListPage,
  PaymentStatusValue,
} from '../../types/domain'
import { PaymentStatus } from '../../types/domain'
import { normalizePaymentStatusValue } from '../../utils/directPaymentStatus'

export const DIRECT_PAYMENT_STATUS_POLL_MS = 5000

type PollablePayment = Pick<
  MerchantPaymentRecord,
  'status' | 'customerConfirmedAt' | 'merchantConfirmedAt'
>

/** Poll public status only while payment is Initiated (waiting for customer). */
export function shouldPollDirectPaymentStatus(
  status: PaymentStatusValue | undefined,
  _payment?: PollablePayment | null,
): boolean {
  return normalizePaymentStatusValue(status) === PaymentStatus.Initiated
}

export function mergePaymentWithStatusSnapshot(
  payment: MerchantPaymentRecord,
  snapshot: DirectPaymentStatusSnapshot,
): MerchantPaymentRecord {
  return {
    ...payment,
    status: normalizePaymentStatusValue(snapshot.status),
    amount: snapshot.amount || payment.amount,
    customerConfirmedAt: snapshot.customerConfirmedAt ?? payment.customerConfirmedAt ?? null,
    merchantConfirmedAt: snapshot.merchantConfirmedAt ?? payment.merchantConfirmedAt ?? null,
  }
}

function hasStatusSnapshotChanged(
  payment: MerchantPaymentRecord,
  snapshot: DirectPaymentStatusSnapshot,
): boolean {
  const merged = mergePaymentWithStatusSnapshot(payment, snapshot)
  return (
    merged.status !== payment.status
    || merged.customerConfirmedAt !== payment.customerConfirmedAt
    || merged.merchantConfirmedAt !== payment.merchantConfirmedAt
  )
}

export function syncDirectPaymentStatusToCache(
  queryClient: QueryClient,
  paymentId: string,
  snapshot: DirectPaymentStatusSnapshot,
) {
  queryClient.setQueriesData<MerchantPaymentsListPage>(
    { queryKey: ['merchantPayments', 'list'] },
    (old) => {
      if (!old?.items?.length) return old
      const current = old.items.find((item) => item.id === paymentId)
      if (!current || !hasStatusSnapshotChanged(current, snapshot)) return old
      return {
        ...old,
        items: old.items.map((item) =>
          item.id === paymentId ? mergePaymentWithStatusSnapshot(item, snapshot) : item,
        ),
      }
    },
  )

  queryClient.setQueryData<MerchantPaymentRecord>(
    qk.merchantPaymentDetail(paymentId),
    (old) => {
      if (!old || !hasStatusSnapshotChanged(old, snapshot)) return old
      return mergePaymentWithStatusSnapshot(old, snapshot)
    },
  )
}

export function resolveDirectPaymentStatusPollInterval(
  status: PaymentStatusValue | undefined,
  payment?: PollablePayment | null,
): number | false {
  return shouldPollDirectPaymentStatus(status, payment)
    ? DIRECT_PAYMENT_STATUS_POLL_MS
    : false
}
