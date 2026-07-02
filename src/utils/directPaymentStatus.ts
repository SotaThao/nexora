import {
  PaymentStatus,
  type DirectPaymentStatusSnapshot,
  type MerchantPaymentRecord,
  type PaymentStatusValue,
  type StaffPaymentRecord,
} from '../types/domain'

export type DirectPaymentStatusVariant = 'merchant' | 'staff'

export const DIRECT_PAYMENT_STATUS_ORDER: PaymentStatusValue[] = [
  PaymentStatus.Initiated,
  PaymentStatus.Confirmed,
  PaymentStatus.Completed,
]

function statusKeyPrefix(variant: DirectPaymentStatusVariant): string {
  return variant === 'staff' ? 'staff_payments' : 'merchant_payments'
}

export function normalizePaymentStatusValue(status: unknown): PaymentStatusValue {
  if (status === 'Initiated' || status === 0 || status === '0') return PaymentStatus.Initiated
  if (status === 'Confirmed' || status === 1 || status === '1') return PaymentStatus.Confirmed
  if (status === 'Completed' || status === 2 || status === '2') return PaymentStatus.Completed
  const num = Number(status)
  if (num === PaymentStatus.Initiated || num === PaymentStatus.Confirmed || num === PaymentStatus.Completed) {
    return num
  }
  return PaymentStatus.Initiated
}

export function getDirectPaymentStatusLabelKey(
  status: PaymentStatusValue,
  variant: DirectPaymentStatusVariant = 'merchant',
): string {
  const prefix = statusKeyPrefix(variant)
  switch (status) {
    case PaymentStatus.Confirmed:
      return `${prefix}.status_confirmed`
    case PaymentStatus.Completed:
      return `${prefix}.status_completed`
    default:
      return `${prefix}.status_initiated`
  }
}

export function getDirectPaymentStatusDescKey(
  status: PaymentStatusValue,
  variant: DirectPaymentStatusVariant = 'merchant',
): string {
  const prefix = statusKeyPrefix(variant)
  switch (status) {
    case PaymentStatus.Confirmed:
      return `${prefix}.status_confirmed_desc`
    case PaymentStatus.Completed:
      return `${prefix}.status_completed_desc`
    default:
      return `${prefix}.status_initiated_desc`
  }
}

export function isAwaitingMerchantPaymentAck(status: PaymentStatusValue): boolean {
  return status === PaymentStatus.Confirmed
}

/** Customer sent money — merchant must PATCH /acknowledge (Confirmed → Completed). */
export function needsMerchantAcknowledge(
  payment: Pick<MerchantPaymentRecord, 'status' | 'customerConfirmedAt' | 'merchantConfirmedAt'>,
): boolean {
  if (payment.merchantConfirmedAt) return false
  const status = normalizePaymentStatusValue(payment.status)
  if (status === PaymentStatus.Completed) return false
  if (status === PaymentStatus.Confirmed) return true
  return Boolean(payment.customerConfirmedAt)
}

export function isDirectPaymentCompleted(status: PaymentStatusValue): boolean {
  return status === PaymentStatus.Completed
}

export function isDirectPaymentRecordCompleted(
  payment: Pick<MerchantPaymentRecord, 'status' | 'merchantConfirmedAt'>,
): boolean {
  return (
    isDirectPaymentCompleted(normalizePaymentStatusValue(payment.status)) ||
    Boolean(payment.merchantConfirmedAt)
  )
}

/** Customer sent money — staff must PATCH /acknowledge (Confirmed → Completed). */
export function needsStaffAcknowledge(
  payment: Pick<StaffPaymentRecord, 'status' | 'customerConfirmedAt' | 'staffConfirmedAt'>,
): boolean {
  if (payment.staffConfirmedAt) return false
  const status = normalizePaymentStatusValue(payment.status)
  if (status === PaymentStatus.Completed) return false
  if (status === PaymentStatus.Confirmed) return true
  return Boolean(payment.customerConfirmedAt)
}

export function isStaffDirectPaymentRecordCompleted(
  payment: Pick<StaffPaymentRecord, 'status' | 'staffConfirmedAt'>,
): boolean {
  return (
    isDirectPaymentCompleted(normalizePaymentStatusValue(payment.status)) ||
    Boolean(payment.staffConfirmedAt)
  )
}

/** Status API returned Confirmed and recipient has not acknowledged receipt yet. */
export function needsAcknowledgeFromStatusSnapshot(
  snapshot: Pick<DirectPaymentStatusSnapshot, 'status' | 'merchantConfirmedAt' | 'customerConfirmedAt'>,
): boolean {
  const status = normalizePaymentStatusValue(snapshot.status)
  if (status !== PaymentStatus.Confirmed) return false
  if (snapshot.merchantConfirmedAt) return false
  return true
}
