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
 * PosOrderDiscountResolver.AllocateStaffShares: the amount is spread pro-rata over the GROSS line
 * totals, a line whose technician cannot be charged contributes nothing, and each slice is
 * truncated to the cent independently of the others — so this preview and the backend snapshot
 * agree without depending on the order the lines happen to arrive in.
 */
export function resolveOrderDiscountStaffShare(
  serviceLines: OrderDiscountAllocationLine[],
  orderDiscountAmount: number,
  bearer: PosDiscountBearer,
): number {
  if (bearer === PosDiscountBearer.Salon || orderDiscountAmount <= 0) return 0

  const subtotalCents = serviceLines.reduce((sum, line) => sum + toCents(line.lineTotal), 0)
  if (subtotalCents <= 0) return 0

  const amountCents = toCents(orderDiscountAmount)
  const shareCents = serviceLines
    .filter((line) => line.canAssignDiscountToStaff && line.lineTotal > 0)
    .reduce((sum, line) => {
      const allocated = Math.floor((amountCents * toCents(line.lineTotal)) / subtotalCents)
      return sum + (bearer === PosDiscountBearer.Staff ? allocated : Math.floor(allocated / 2))
    }, 0)

  return shareCents / CENTS
}
