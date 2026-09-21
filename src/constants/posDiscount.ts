/**
 * Service-line discount — matches backend Nexora.Domain.Enums.Pos.PosServiceDiscountType and
 * PosDiscountBearer.
 *
 * The bearer is not cosmetic: commission is calculated on the original price and the borne share is
 * deducted afterwards, so a $20 discount on a $100 service at 60% commission pays the technician
 * $60 (Salon), $40 (Staff) or $50 (Split).
 */
export enum PosServiceDiscountType {
  Percent = 'Percent',
  Amount = 'Amount',
}

export enum PosDiscountBearer {
  Salon = 'Salon',
  Staff = 'Staff',
  Split = 'Split',
}

export const POS_DISCOUNT_BEARER_OPTIONS = [
  PosDiscountBearer.Salon,
  PosDiscountBearer.Staff,
  PosDiscountBearer.Split,
] as const

// Staff and Split are only offered when the assigned technician earns commission — deducting a
// business cost from an hourly or salaried employee's wages is a compliance risk.
export const POS_DISCOUNT_BEARERS_REQUIRING_COMMISSION = [
  PosDiscountBearer.Staff,
  PosDiscountBearer.Split,
] as const

export const MAX_DISCOUNT_PERCENT = 100

/** Hard ceiling for Amount-type promotion discounts — keeps the banner preview readable. */
export const MAX_DISCOUNT_AMOUNT = 99_999.99

/**
 * Quick-pick values in the "Discount all services" panel. Fixed by the system rather than
 * configurable: the Custom box covers anything else, and the promotion catalog is where a salon
 * declares the figures it actually runs.
 */
export const ORDER_DISCOUNT_AMOUNT_CHIPS = [5, 10, 15, 20] as const
export const ORDER_DISCOUNT_PERCENT_CHIPS = [5, 10, 15, 20] as const
