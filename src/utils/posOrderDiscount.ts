/**
 * Order-level discount ("Discount all services") preview math, mirroring the backend
 * PosOrderDiscountResolver so the panel can show the resolved figure the instant a chip is tapped.
 *
 * The server stays the authority — this only decides what the operator sees between the tap and the
 * refetch. Everything is computed on whole cents: rounding a percentage on dollars is what made a
 * 50/50 split land a cent off in the service-line discount work.
 */
import { MAX_DISCOUNT_PERCENT, PosDiscountBearer, PosServiceDiscountType } from '../constants/posDiscount'

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

/** One service line as the technician-share preview sees it — add-ons included, since each carries
 *  its own price and its own technician eligibility. */
export interface OrderDiscountAllocationLine {
  lineTotal: number
  canAssignDiscountToStaff: boolean
}

/**
 * What the technicians on this ticket absorb of an order-level discount, mirroring
 * PosOrderDiscountResolver.ResolveStaffShareTotal: the chargeable lines' share of the GROSS
 * services total, then the bearer applied once.
 *
 * The bearer is applied to that one figure and not to each line's slice, which is what keeps
 * "Technician" on a fully chargeable ticket reading as the whole discount. Slicing first and
 * summing after leaked a cent per line to the salon — a $10 discount over $30 + $25 of services
 * showed $9.99, and a 50/50 showed $4.99 against the $5.00 owed. The backend spreads this total
 * back over the lines by largest remainder, so its per-line snapshot still adds up to what is
 * previewed here.
 */
export function resolveOrderDiscountStaffShare(
  serviceLines: OrderDiscountAllocationLine[],
  orderDiscountAmount: number,
  bearer: PosDiscountBearer,
): number {
  if (bearer === PosDiscountBearer.Salon || orderDiscountAmount <= 0) return 0

  const subtotalCents = serviceLines.reduce((sum, line) => sum + toCents(line.lineTotal), 0)
  if (subtotalCents <= 0) return 0

  const chargeableCents = serviceLines
    .filter((line) => line.canAssignDiscountToStaff && line.lineTotal > 0)
    .reduce((sum, line) => sum + toCents(line.lineTotal), 0)
  if (chargeableCents <= 0) return 0

  // Floored, matching the backend's MidpointRounding.ToZero: the technicians together never pay
  // more than their pro-rata part. Exact when every line is chargeable, since the ratio is then 1.
  const borneCents = Math.floor((toCents(orderDiscountAmount) * chargeableCents) / subtotalCents)
  const shareCents = bearer === PosDiscountBearer.Staff ? borneCents : Math.floor(borneCents / 2)

  return shareCents / CENTS
}
