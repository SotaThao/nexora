/** Shared i18n namespace for subscription checkout modals (`dashboard.modals.*`). */
export const SUBSCRIPTION_PAYMENT_MODAL_TK = 'dashboard.modals' as const

export const ORDER_STATUS_POLL_TIMEOUT_MS = 30_000

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

export const SUBSCRIPTION_CARD_FIELD_I18N = {
  cardholderName: 'subscription_cardholder_name_label',
  cardNumber: 'subscription_card_number_label',
  cardExpiry: 'subscription_card_expiry_label',
  cardCvc: 'subscription_card_cvc_label',
  billingAddress: 'subscription_billing_address_label',
  billingCity: 'subscription_billing_city_label',
  billingState: 'subscription_billing_state_label',
  billingZipCode: 'subscription_billing_zip_code_label',
  cardPaymentError: 'subscription_card_payment_error',
  confirmPayment: 'subscription_confirm_payment',
  cardInitError: 'subscription_card_init_error',
  cardPaymentProcessing: 'subscription_card_payment_processing',
  cardPaymentProcessingTimeout: 'subscription_card_payment_processing_timeout',
  paymentSuccess: 'subscription_payment_success',
  walletBalance: 'subscription_wallet_balance_label',
} as const

export function subscriptionModalKey(
  field: keyof typeof SUBSCRIPTION_CARD_FIELD_I18N,
): string {
  return `${SUBSCRIPTION_PAYMENT_MODAL_TK}.${SUBSCRIPTION_CARD_FIELD_I18N[field]}`
}
