import { normalizePaymentStatusValue } from './directPaymentStatus'
import { PaymentStatus } from '../types/domain'

type AckPendingPayment = {
  id: string
  status?: unknown
  customerConfirmedAt?: string | null
  createdAt: string
}

export function pickNewestPendingAckPayment<T extends AckPendingPayment>(
  payments: T[],
  needsAck: (payment: T) => boolean,
): T | null {
  const pending = payments.filter((payment) => needsAck(payment))
  if (!pending.length) return null

  return [...pending].sort((left, right) => {
    const leftTime = Date.parse(left.customerConfirmedAt || left.createdAt) || 0
    const rightTime = Date.parse(right.customerConfirmedAt || right.createdAt) || 0
    return rightTime - leftTime
  })[0]
}

/** Prefer Confirmed pending ack; otherwise track newest Initiated for status watch. */
export function pickNewestPaymentForAckWatch<T extends AckPendingPayment>(
  payments: T[],
  needsAck: (payment: T) => boolean,
): T | null {
  const pendingAck = pickNewestPendingAckPayment(payments, needsAck)
  if (pendingAck) return pendingAck

  const initiated = payments.filter(
    (payment) => normalizePaymentStatusValue(payment.status) === PaymentStatus.Initiated,
  )
  if (!initiated.length) return null

  return [...initiated].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt) || 0
    const rightTime = Date.parse(right.createdAt) || 0
    return rightTime - leftTime
  })[0]
}

export function collectPaymentsForAckWatch<T extends AckPendingPayment>(
  payments: T[],
  needsAck: (payment: T) => boolean,
): T[] {
  const byId = new Map<string, T>()
  payments.forEach((payment) => {
    const shouldWatch =
      needsAck(payment) ||
      normalizePaymentStatusValue(payment.status) === PaymentStatus.Initiated
    if (shouldWatch) {
      byId.set(payment.id, payment)
    }
  })
  return [...byId.values()]
}

export function shouldPromptAckNotice(paymentId: string): boolean {
  return Boolean(paymentId)
}

/** Defer dialog state updates so they never run during a query-cache sync render. */
export function scheduleAckNoticeUpdate<T>(update: () => T): void {
  queueMicrotask(update)
}
