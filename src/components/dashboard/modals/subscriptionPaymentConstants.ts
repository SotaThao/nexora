import { SubscriptionPaymentStatus } from '../../../data/repositories/subscriptionPayments'
import type { PurchaseSubscriptionResult } from '../../../data/repositories/subscriptionPayments'
import { TipPlatformUiPlanId } from '../views/packageManagement/constants'

/** Shared i18n namespace for subscription checkout modals (`dashboard.modals.*`). */
export const SUBSCRIPTION_PAYMENT_MODAL_TK = 'dashboard.modals' as const

/** TipPlatform plan name copy lives under `manage_plan.plans.<id>.name`. */
export const TIP_PLATFORM_PLAN_I18N_TK = 'manage_plan.plans' as const

/** Merchant store-setup wizard route (dashboard SetupGuideBanner destination). */
export const STORE_SETUP_ONBOARDING_PATH = '/onboarding' as const

export const ORDER_STATUS_POLL_TIMEOUT_MS = 30_000

/** CSS hooks for card form layout (see booking-hub.css). */
export const SUBSCRIPTION_CARD_FORM_CLASS = {
  /** Scopes SMS-campaign card styles outside AI Hub. */
  root: 'nx-campaign-root',
  form: 'sms-credit-card-form',
  /** Package Payment variant — no orange frame, denser fields. */
  checkoutVariant: 'is-subscription-checkout',
} as const

/** Stable DOM ids for Package Payment dialog a11y hooks. */
export const SUBSCRIPTION_PAYMENT_DOM_ID = {
  title: 'subscription-payment-title',
  description: 'subscription-payment-description',
  methodTitle: 'subscription-payment-method-title',
  invoiceTitle: 'subscription-payment-invoice-title',
} as const

/** Stable DOM ids for the pre-checkout store-setup gate dialog. */
export const STORE_SETUP_GATE_DOM_ID = {
  title: 'store-setup-gate-title',
  description: 'store-setup-gate-desc',
} as const

/** Purchasable TipPlatform plan → `manage_plan.plans.*` i18n segment. */
export const PURCHASABLE_PLAN_I18N_ID: Record<
  'Starter' | 'Pro',
  typeof TipPlatformUiPlanId.Starter | typeof TipPlatformUiPlanId.Pro
> = {
  Starter: TipPlatformUiPlanId.Starter,
  Pro: TipPlatformUiPlanId.Pro,
}

export function tipPlatformPlanNameI18nKey(
  plan: keyof typeof PURCHASABLE_PLAN_I18N_ID,
): string {
  return `${TIP_PLATFORM_PLAN_I18N_TK}.${PURCHASABLE_PLAN_I18N_ID[plan]}.name`
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

/** All `dashboard.modals.subscription_*` keys used by checkout / gate UI. */
export const SUBSCRIPTION_MODAL_I18N = {
  paymentTitle: 'subscription_payment_title',
  paymentSubtitle: 'subscription_payment_subtitle',
  paymentMethodLabel: 'subscription_payment_method_label',
  paymentMethodsLoading: 'subscription_payment_methods_loading',
  paymentMethodsError: 'subscription_payment_methods_error',
  paymentMethodsRetry: 'subscription_payment_methods_retry',
  paymentMethodsEmpty: 'subscription_payment_methods_empty',
  invoiceSummary: 'subscription_invoice_summary',
  servicePlan: 'subscription_service_plan',
  invoicePayment: 'subscription_invoice_payment',
  planPrice: 'subscription_plan_price',
  totalDue: 'subscription_total_due',
  priceNoteMonth: 'subscription_price_note_month',
  priceNoteYear: 'subscription_price_note_year',
  forfeitWarning: 'subscription_forfeit_warning',
  upgradeCreditEstimate: 'subscription_upgrade_credit_estimate',
  upgradeCreditApplied: 'subscription_upgrade_credit_applied',
  cardMethodLabel: 'subscription_card_method_label',
  cardFormTitle: 'subscription_card_form_title',
  cardRequiredNote: 'subscription_card_required_note',
  cardFieldRequired: 'subscription_card_field_required',
  purchaseNeedsStoreSetupTitle: 'subscription_purchase_needs_store_setup_title',
  purchaseNeedsStoreSetupBody: 'subscription_purchase_needs_store_setup_body',
  purchaseNeedsStoreSetupCta: 'subscription_purchase_needs_store_setup_cta',
  cardholderName: 'subscription_cardholder_name_label',
  cardNamePlaceholder: 'subscription_card_name_placeholder',
  cardNumber: 'subscription_card_number_label',
  cardNumberPlaceholder: 'subscription_card_number_placeholder',
  cardExpiry: 'subscription_card_expiry_label',
  cardExpiryPlaceholder: 'subscription_card_expiry_placeholder',
  cardCvc: 'subscription_card_cvc_label',
  cardCvcPlaceholder: 'subscription_card_cvc_placeholder',
  billingAddress: 'subscription_billing_address_label',
  cardAddressPlaceholder: 'subscription_card_address_placeholder',
  billingCity: 'subscription_billing_city_label',
  cardCityPlaceholder: 'subscription_card_city_placeholder',
  billingState: 'subscription_billing_state_label',
  cardStatePlaceholder: 'subscription_card_state_placeholder',
  billingZipCode: 'subscription_billing_zip_code_label',
  cardZipPlaceholder: 'subscription_card_zip_placeholder',
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
  field: keyof typeof SUBSCRIPTION_MODAL_I18N,
): string {
  return `${SUBSCRIPTION_PAYMENT_MODAL_TK}.${SUBSCRIPTION_MODAL_I18N[field]}`
}

type CheckoutPaymentMethodLike = {
  name?: string
  symbol: string
}

/** Invoice / status label for the selected wallet row or card method. */
export function resolveCheckoutPaymentLabel(args: {
  isCardPayment: boolean
  cardPaymentLabel: string
  selectedPayment: CheckoutPaymentMethodLike | null
  emptyLabel: string
}): string {
  if (args.isCardPayment) return args.cardPaymentLabel
  if (args.selectedPayment) {
    return args.selectedPayment.name || args.selectedPayment.symbol
  }
  return args.emptyLabel
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
