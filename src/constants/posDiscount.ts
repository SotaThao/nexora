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
