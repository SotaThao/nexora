import type { QueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import type {
  DirectPaymentStatusSnapshot,
  MerchantPaymentRecord,
  MerchantPaymentsListPage,
  PaymentStatusValue,
  StaffPaymentRecord,
  StaffPaymentsListPage,
} from '../../types/domain'
import { PaymentStatus, PaymentType } from '../../types/domain'
import { normalizePaymentStatusValue } from '../../utils/directPaymentStatus'

export const DIRECT_PAYMENT_STATUS_POLL_MS = 5000

type PollablePayment = Pick<
  MerchantPaymentRecord,
  'status' | 'customerConfirmedAt' | 'merchantConfirmedAt'
>

/** Poll public status while Initiated (detect Confirmed) or Confirmed (awaiting receipt ack). */
export function shouldPollDirectPaymentAckWatch(
  status: PaymentStatusValue | undefined,
  payment?: PollablePayment | null,
): boolean {
  const normalized = normalizePaymentStatusValue(status ?? payment?.status)
  return normalized === PaymentStatus.Initiated || normalized === PaymentStatus.Confirmed
}

/** Poll public status only while payment is Confirmed (detail views). */
export function shouldPollDirectPaymentStatus(
  status: PaymentStatusValue | undefined,
  payment?: PollablePayment | null,
): boolean {
  const normalized = normalizePaymentStatusValue(status ?? payment?.status)
  return normalized === PaymentStatus.Confirmed
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

export function mergeStaffPaymentWithStatusSnapshot(
  payment: StaffPaymentRecord,
  snapshot: DirectPaymentStatusSnapshot,
): StaffPaymentRecord {
  return {
    ...payment,
    status: normalizePaymentStatusValue(snapshot.status),
    amount: snapshot.amount || payment.amount,
    customerConfirmedAt: snapshot.customerConfirmedAt ?? payment.customerConfirmedAt ?? null,
    staffConfirmedAt: payment.staffConfirmedAt ?? null,
  }
}

export function staffPaymentFromStatusSnapshot(
  snapshot: DirectPaymentStatusSnapshot,
): StaffPaymentRecord {
  return {
    id: snapshot.paymentId,
    type: snapshot.type === PaymentType.DirectPayment ? PaymentType.DirectPayment : PaymentType.StaffDirectPayment,
    amount: snapshot.amount,
    status: normalizePaymentStatusValue(snapshot.status),
    paymentMethodType: '',
    createdAt: snapshot.createdAt,
    customerConfirmedAt: snapshot.customerConfirmedAt ?? null,
    staffConfirmedAt: null,
    accountInfo: null,
    imageUrl: null,
  }
}

export function merchantPaymentFromStatusSnapshot(
  snapshot: DirectPaymentStatusSnapshot,
): MerchantPaymentRecord {
  return {
    id: snapshot.paymentId,
    type: snapshot.type === PaymentType.StaffDirectPayment ? PaymentType.StaffDirectPayment : PaymentType.DirectPayment,
    amount: snapshot.amount,
    status: normalizePaymentStatusValue(snapshot.status),
    paymentMethodType: '',
    createdAt: snapshot.createdAt,
    customerConfirmedAt: snapshot.customerConfirmedAt ?? null,
    merchantConfirmedAt: snapshot.merchantConfirmedAt ?? null,
    accountInfo: null,
    imageUrl: null,
  }
}

function hasStaffStatusSnapshotChanged(
  payment: StaffPaymentRecord,
  snapshot: DirectPaymentStatusSnapshot,
): boolean {
  const merged = mergeStaffPaymentWithStatusSnapshot(payment, snapshot)
  return (
    merged.status !== payment.status
    || merged.customerConfirmedAt !== payment.customerConfirmedAt
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

  queryClient.setQueriesData<StaffPaymentsListPage>(
    { queryKey: ['staffPayments', 'list'] },
    (old) => {
      if (!old?.items?.length) return old
      const current = old.items.find((item) => item.id === paymentId)
      if (!current || !hasStaffStatusSnapshotChanged(current, snapshot)) return old
      return {
        ...old,
        items: old.items.map((item) =>
          item.id === paymentId ? mergeStaffPaymentWithStatusSnapshot(item, snapshot) : item,
        ),
      }
    },
  )

  queryClient.setQueryData<StaffPaymentRecord>(
    qk.staffPaymentDetail(paymentId),
    (old) => {
      if (!old || !hasStaffStatusSnapshotChanged(old, snapshot)) return old
      return mergeStaffPaymentWithStatusSnapshot(old, snapshot)
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
