import {
  SMS_CREDIT_PAYMENTS_MOCK,
  SmsCreditPaymentId,
} from '../smsCampaigns/constants'

/** Paid service plans that open the payment checkout modal (HTML Starter / Elite). */
export type PaidServicePlanId = 'Starter' | 'Elite'

export const SERVICE_PLAN_MONTHLY_PRICE: Record<PaidServicePlanId, number> = {
  Starter: 99,
  Elite: 349,
}

/** i18n key under BookingHubView.plans for modal title / CTA. */
export const PAID_SERVICE_PLAN_TITLE_KEY: Record<PaidServicePlanId, string> = {
  Starter: 'selectStarter',
  Elite: 'selectElite',
}

export const PLAN_PAYMENT_METHODS = SMS_CREDIT_PAYMENTS_MOCK

export const PLAN_PAYMENT_DEFAULT_METHOD_ID = SmsCreditPaymentId.Usdv

export function isPaidServicePlanId(value: string): value is PaidServicePlanId {
  return value in SERVICE_PLAN_MONTHLY_PRICE
}

export function formatPlanMonthlyTotal(price: number): string {
  return `$${price}/mo`
}
