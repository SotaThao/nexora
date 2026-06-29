import { PaymentStatus, type MerchantPaymentRecord, type PaymentStatusValue } from '../types/domain'

export const DIRECT_PAYMENT_STATUS_ORDER: PaymentStatusValue[] = [
  PaymentStatus.Initiated,
  PaymentStatus.Confirmed,
  PaymentStatus.Completed,
]

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

export function getDirectPaymentStatusLabelKey(status: PaymentStatusValue): string {
  switch (status) {
    case PaymentStatus.Confirmed:
      return 'merchant_payments.status_confirmed'
    case PaymentStatus.Completed:
      return 'merchant_payments.status_completed'
    default:
      return 'merchant_payments.status_initiated'
  }
}

export function getDirectPaymentStatusDescKey(status: PaymentStatusValue): string {
  switch (status) {
    case PaymentStatus.Confirmed:
      return 'merchant_payments.status_confirmed_desc'
    case PaymentStatus.Completed:
      return 'merchant_payments.status_completed_desc'
    default:
      return 'merchant_payments.status_initiated_desc'
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
