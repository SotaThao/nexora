import { SubscriptionPaymentStatus } from '../../../data/repositories/subscriptionPayments'
import type { PurchaseSubscriptionResult } from '../../../data/repositories/subscriptionPayments'
import { TipPlatformUiPlanId } from '../views/packageManagement/constants'

/** Shared i18n namespace for subscription checkout modals (`dashboard.modals.*`). */
export const SUBSCRIPTION_PAYMENT_MODAL_TK = 'dashboard.modals' as const

export const ORDER_STATUS_POLL_TIMEOUT_MS = 30_000

/** CSS hooks for card form layout (see booking-hub.css). */
export const SUBSCRIPTION_CARD_FORM_CLASS = {
  /** Scopes SMS-campaign card styles outside AI Hub. */
  root: 'nx-campaign-root',
  form: 'sms-credit-card-form',
  /** Package Payment variant — no orange frame, denser fields. */
  checkoutVariant: 'is-subscription-checkout',
} as const

export const SubscriptionPaymentTab = {
  Wallet: 'wallet',
  Card: 'card',
} as const

export type SubscriptionPaymentTabValue =
  (typeof SubscriptionPaymentTab)[keyof typeof SubscriptionPaymentTab]

/** Same dialog width for Wallet + Card tabs so switching tabs does not resize. */
export const SUBSCRIPTION_PAYMENT_DIALOG_MAX_WIDTH_CLASS = 'max-w-lg' as const

/** Purchasable TipPlatform plan → `manage_plan.plans.*` i18n segment. */
export const PURCHASABLE_PLAN_I18N_ID: Record<
  'Starter' | 'Pro',
  typeof TipPlatformUiPlanId.Starter | typeof TipPlatformUiPlanId.Pro
> = {
  Starter: TipPlatformUiPlanId.Starter,
  Pro: TipPlatformUiPlanId.Pro,
}

/** Stripe Elements style — matches `.sms-credit-card-input` in booking-hub.css. */
export const STRIPE_CARD_ELEMENT_STYLE = {
  base: {
    fontSize: '12px',
    lineHeight: '20px',
    color: '#0f172a',
    '::placeholder': { color: '#94a3b8' },
  },
  invalid: { color: '#dc2626' },
} as const

export const STRIPE_PAYMENT_INTENT_CONFIRMED_STATUSES = ['succeeded', 'processing'] as const

const STRIPE_CONFIRMED_STATUS_SET = new Set<string>(STRIPE_PAYMENT_INTENT_CONFIRMED_STATUSES)

export function isStripePaymentIntentConfirmed(status?: string | null): boolean {
  return Boolean(status && STRIPE_CONFIRMED_STATUS_SET.has(status))
}

type StripeConfirmLike = {
  paymentIntent?: { status?: string } | null
  error?: {
    message?: string
    payment_intent?: { status?: string }
  } | null
}

/** Prefer PI on success; fall back to PI nested under Stripe error (post-auth network blip). */
export function readStripeConfirmPaymentIntentStatus(
  result: StripeConfirmLike,
): string | undefined {
  return result.paymentIntent?.status ?? result.error?.payment_intent?.status
}

export const SUBSCRIPTION_CARD_FIELD_I18N = {
  cardFormTitle: 'subscription_card_form_title',
  cardRequiredNote: 'subscription_card_required_note',
  cardFieldRequired: 'subscription_card_field_required',
  cardholderName: 'subscription_cardholder_name_label',
  cardNumber: 'subscription_card_number_label',
  cardExpiry: 'subscription_card_expiry_label',
  cardCvc: 'subscription_card_cvc_label',
  billingAddress: 'subscription_billing_address_label',
  billingCity: 'subscription_billing_city_label',
  billingState: 'subscription_billing_state_label',
  billingZipCode: 'subscription_billing_zip_code_label',
  cardPaymentError: 'subscription_card_payment_error',
  paymentFailed: 'subscription_payment_failed',
  confirmPayment: 'subscription_confirm_payment',
  cardInitError: 'subscription_card_init_error',
  cardPaymentProcessing: 'subscription_card_payment_processing',
  cardPaymentProcessingTimeout: 'subscription_card_payment_processing_timeout',
  paymentSuccess: 'subscription_payment_success',
  walletBalance: 'subscription_wallet_balance_label',
} as const

/** Billing + Stripe fields validated before confirmCardPayment. */
export const SubscriptionCardField = {
  Name: 'name',
  CardNumber: 'cardNumber',
  CardExpiry: 'cardExpiry',
  CardCvc: 'cardCvc',
  Address: 'address',
  City: 'city',
  State: 'state',
  ZipCode: 'zipCode',
} as const

export type SubscriptionCardFieldKey =
  (typeof SubscriptionCardField)[keyof typeof SubscriptionCardField]

export const SUBSCRIPTION_CARD_BILLING_REQUIRED_FIELDS = [
  SubscriptionCardField.Name,
  SubscriptionCardField.Address,
  SubscriptionCardField.City,
  SubscriptionCardField.State,
  SubscriptionCardField.ZipCode,
] as const

export const SUBSCRIPTION_CARD_STRIPE_REQUIRED_FIELDS = [
  SubscriptionCardField.CardNumber,
  SubscriptionCardField.CardExpiry,
  SubscriptionCardField.CardCvc,
] as const

export function subscriptionModalKey(
  field: keyof typeof SUBSCRIPTION_CARD_FIELD_I18N,
): string {
  return `${SUBSCRIPTION_PAYMENT_MODAL_TK}.${SUBSCRIPTION_CARD_FIELD_I18N[field]}`
}

/** Next UI step after a wallet/crypto purchase response settles. */
export const WalletPurchaseNextStep = {
  Failed: 'failed',
  PollOrder: 'poll_order',
  Succeeded: 'succeeded',
} as const

export type WalletPurchaseNextStepValue =
  (typeof WalletPurchaseNextStep)[keyof typeof WalletPurchaseNextStep]

export function resolveWalletPurchaseNextStep(
  result: Pick<PurchaseSubscriptionResult, 'paymentStatus' | 'orderId'>,
): WalletPurchaseNextStepValue {
  if (result.paymentStatus === SubscriptionPaymentStatus.Failed) {
    return WalletPurchaseNextStep.Failed
  }
  if (
    result.paymentStatus === SubscriptionPaymentStatus.Pending
    && result.orderId
  ) {
    return WalletPurchaseNextStep.PollOrder
  }
  return WalletPurchaseNextStep.Succeeded
}

/** Start purchase-history polling when an order id is available. */
export function tryBeginOrderStatusPolling(
  orderId: string | null | undefined,
  beginPolling: (orderId: string) => void,
): boolean {
  if (!orderId) return false
  beginPolling(orderId)
  return true
}
