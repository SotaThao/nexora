/**
 * Order-level discount ("Discount all services") preview math, mirroring the backend
 * PosOrderDiscountResolver so the panel can show the resolved figure the instant a chip is tapped.
 *
 * The server stays the authority — this only decides what the operator sees between the tap and the
 * refetch. Everything is computed on whole cents: rounding a percentage on dollars is what made a
 * 50/50 split land a cent off in the service-line discount work.
 */
import { MAX_DISCOUNT_PERCENT, PosServiceDiscountType } from '../constants/posDiscount'

const CENTS = 100

function toCents(amount: number): number {
  return Math.round(amount * CENTS)
}

/** The most an order-level discount may still take off: services total less the line discounts. */
export function resolveOrderDiscountCap(servicesSubtotal: number, lineDiscountTotal: number): number {
  return Math.max(0, Math.round((servicesSubtotal - lineDiscountTotal) * CENTS)) / CENTS
}

export function resolveOrderDiscountAmount(
  discountType: string | null | undefined,
  discountValue: number | null | undefined,
  servicesSubtotal: number,
  cap: number,
): number {
  if (!discountType || discountValue == null || discountValue <= 0) return 0

  const rawCents =
    discountType === PosServiceDiscountType.Percent
      ? Math.round((toCents(servicesSubtotal) * Math.min(discountValue, MAX_DISCOUNT_PERCENT)) / 100)
      : toCents(discountValue)

  return Math.min(Math.max(rawCents, 0), toCents(cap)) / CENTS
}

/** True when the entered value was larger than the cap, so the panel can explain the difference. */
export function isOrderDiscountCapped(
  discountType: string | null | undefined,
  discountValue: number | null | undefined,
  servicesSubtotal: number,
  cap: number,
): boolean {
  if (!discountType || discountValue == null || discountValue <= 0) return false

  const rawCents =
    discountType === PosServiceDiscountType.Percent
      ? Math.round((toCents(servicesSubtotal) * Math.min(discountValue, MAX_DISCOUNT_PERCENT)) / 100)
      : toCents(discountValue)

  return rawCents > toCents(cap)
}
