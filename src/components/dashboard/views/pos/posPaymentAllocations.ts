/**
 * Split Pay allocations read from the saved order rather than from the Quick Split screen.
 *
 * The tip is part of what one method collects, not a line of its own: the order's Total already
 * includes it, and the backend rejects a portion carrying more tip than its own amount. So a
 * portion's own share of the bill is what is left once its tip is taken off — which is what makes
 * an edited tip re-placeable without asking the cashier to retype an amount.
 */
import { PosCheckoutPaymentMethod } from '../../../../constants/posCheckoutPaymentMethod'
import type {
  OrderPaymentAllocationApiDto,
  SetOrderPaymentAllocationsPayload,
} from '../../../../types/repositories'

// Whole cents throughout. Working in dollars and flooring is what leaves a split a cent short of
// the amount due, which then blocks checkout over a rounding artefact.
function toCents(amount: number): number {
  return Math.round(amount * 100)
}

/** What this portion collects towards the bill, with any tip it carries taken off. */
export function allocationBillCents(allocation: OrderPaymentAllocationApiDto): number {
  return toCents(allocation.amount) - toCents(allocation.tipAmount)
}

function sortedByDisplayOrder(allocations: OrderPaymentAllocationApiDto[]): OrderPaymentAllocationApiDto[] {
  return allocations.slice().sort((a, b) => a.displayOrder - b.displayOrder)
}

/**
 * The same split with `tipAmount` moved onto the method the cashier already chose for the tip.
 *
 * Returns null when there is nothing to send: no split yet, no method chosen for the tip, or the
 * saved amounts already say this. With no choice on record there is nothing to honour, and Quick
 * Split asks for one.
 *
 * `fallbackBearerMethod` covers a tip cleared to zero: the choice is recorded only on the portion
 * carrying the tip, so a zero tip leaves nothing to read it from.
 */
export function reallocateTip(
  allocations: OrderPaymentAllocationApiDto[],
  tipAmount: number,
  fallbackBearerMethod?: string | null,
): SetOrderPaymentAllocationsPayload | null {
  const bearer = allocations.find((allocation) => allocation.tipAmount > 0)
    ?? allocations.find((allocation) => allocation.paymentMethodType === fallbackBearerMethod)
  if (!bearer) return null

  const tipCents = toCents(tipAmount)
  const sorted = sortedByDisplayOrder(allocations)
  const next = sorted.map((allocation) => {
    // Unique per order at the DB level, so it identifies the portion without relying on object identity.
    const isBearer = allocation.paymentMethodType === bearer.paymentMethodType
    const amountCents = allocationBillCents(allocation) + (isBearer ? tipCents : 0)
    return {
      paymentMethodType: allocation.paymentMethodType,
      amount: amountCents / 100,
      tipAmount: isBearer ? tipCents / 100 : 0,
      cashReceived: resolveCashReceived(allocation, amountCents),
    }
  })

  const isUnchanged = next.every((entry, index) => {
    const current = sorted[index]
    return toCents(entry.amount) === toCents(current.amount)
      && toCents(entry.tipAmount) === toCents(current.tipAmount)
      && toCents(entry.cashReceived ?? 0) === toCents(current.cashReceived ?? 0)
  })

  return isUnchanged ? null : { allocations: next }
}

// Cash the customer paid exactly follows the new amount, the way Quick Split fills it in. An
// overpayment is money actually handed over, so it stays as recorded — if a raised tip now exceeds
// it, checkout says the cash is short, which is the truth rather than an invented banknote.
function resolveCashReceived(
  allocation: OrderPaymentAllocationApiDto,
  amountCents: number,
): number | null {
  if (allocation.paymentMethodType !== PosCheckoutPaymentMethod.Cash) return null
  if (allocation.cashReceived == null) return amountCents / 100
  return toCents(allocation.cashReceived) === toCents(allocation.amount)
    ? amountCents / 100
    : allocation.cashReceived
}
