import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  buildSubscriptionBillingFormState,
  resolveStripeCountryCode,
} from '../../../utils/subscriptionBillingDefaults'
import { SMS_CAMPAIGN_TK } from '../views/smsCampaigns/constants'
import {
  STRIPE_CARD_ELEMENT_STYLE,
  SUBSCRIPTION_CARD_BILLING_REQUIRED_FIELDS,
  SUBSCRIPTION_CARD_FORM_CLASS,
  SUBSCRIPTION_CARD_STRIPE_REQUIRED_FIELDS,
  SubscriptionCardField,
  type SubscriptionCardFieldKey,
  isStripePaymentIntentConfirmed,
  readStripeConfirmPaymentIntentStatus,
  subscriptionModalKey,
} from './subscriptionPaymentConstants'
import '../views/booking-hub.css'

export interface SubscriptionBillingDetails {
  name?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

export type SubscriptionCardPaymentFormHandle = {
  submit: () => Promise<void>
}

function RequiredMark() {
  return <span>*</span>
}

type BillingFormState = ReturnType<typeof buildSubscriptionBillingFormState>

type FieldErrors = Partial<Record<SubscriptionCardFieldKey, string>>

type StripeCompleteState = {
  [SubscriptionCardField.CardNumber]: boolean
  [SubscriptionCardField.CardExpiry]: boolean
  [SubscriptionCardField.CardCvc]: boolean
}

const STRIPE_COMPLETE_EMPTY: StripeCompleteState = {
  [SubscriptionCardField.CardNumber]: false,
  [SubscriptionCardField.CardExpiry]: false,
  [SubscriptionCardField.CardCvc]: false,
}

type CardPaymentInnerProps = {
  clientSecret: string
  billingDefaults?: SubscriptionBillingDetails
  hideFooter?: boolean
  placeholderTk?: string
  onCancel: () => void
  onSuccess: () => void
  onError: (message: string) => void
  onSubmittingChange?: (isSubmitting: boolean) => void
}

const CardPaymentInner = forwardRef<SubscriptionCardPaymentFormHandle, CardPaymentInnerProps>(
  function CardPaymentInner(
    {
      clientSecret,
      billingDefaults,
      hideFooter = false,
      placeholderTk = SMS_CAMPAIGN_TK,
      onCancel,
      onSuccess,
      onError,
      onSubmittingChange,
    },
    ref,
  ) {
    const { t } = useTranslation()
    const stripe = useStripe()
    const elements = useElements()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [billing, setBilling] = useState<BillingFormState>(() =>
      buildSubscriptionBillingFormState(billingDefaults),
    )
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
    const [formError, setFormError] = useState('')
    const [stripeComplete, setStripeComplete] = useState<StripeCompleteState>(STRIPE_COMPLETE_EMPTY)

    const cardNumberPlaceholder = t(`${placeholderTk}.cardNumberPlaceholder`)
    const cardExpiryPlaceholder = t(`${placeholderTk}.cardExpiryPlaceholder`)
    const cardCvcPlaceholder = t(`${placeholderTk}.cardCvcPlaceholder`)
    const fieldRequiredMessage = t(subscriptionModalKey('cardFieldRequired'))

    const cardNumberOptions = useMemo(
      () => ({
        style: STRIPE_CARD_ELEMENT_STYLE,
        placeholder: cardNumberPlaceholder,
      }),
      [cardNumberPlaceholder],
    )

    const cardExpiryOptions = useMemo(
      () => ({
        style: STRIPE_CARD_ELEMENT_STYLE,
        placeholder: cardExpiryPlaceholder,
      }),
      [cardExpiryPlaceholder],
    )

    const cardCvcOptions = useMemo(
      () => ({
        style: STRIPE_CARD_ELEMENT_STYLE,
        placeholder: cardCvcPlaceholder,
      }),
      [cardCvcPlaceholder],
    )

    useEffect(() => {
      setBilling(buildSubscriptionBillingFormState(billingDefaults))
      setFieldErrors({})
      setFormError('')
      setStripeComplete(STRIPE_COMPLETE_EMPTY)
    }, [billingDefaults])

    useEffect(() => {
      onSubmittingChange?.(isSubmitting)
    }, [isSubmitting, onSubmittingChange])

    const clearFieldError = useCallback((field: SubscriptionCardFieldKey) => {
      setFieldErrors((prev) => {
        if (!prev[field]) return prev
        const next = { ...prev }
        delete next[field]
        return next
      })
      setFormError('')
    }, [])

    const updateBilling = (field: keyof BillingFormState) => (e: ChangeEvent<HTMLInputElement>) => {
      setBilling((prev) => ({ ...prev, [field]: e.target.value }))
      clearFieldError(field as SubscriptionCardFieldKey)
    }

    const onStripeNumberChange = useCallback(
      (event: { complete: boolean }) => {
        setStripeComplete((prev) => ({
          ...prev,
          [SubscriptionCardField.CardNumber]: event.complete,
        }))
        clearFieldError(SubscriptionCardField.CardNumber)
      },
      [clearFieldError],
    )

    const onStripeExpiryChange = useCallback(
      (event: { complete: boolean }) => {
        setStripeComplete((prev) => ({
          ...prev,
          [SubscriptionCardField.CardExpiry]: event.complete,
        }))
        clearFieldError(SubscriptionCardField.CardExpiry)
      },
      [clearFieldError],
    )

    const onStripeCvcChange = useCallback(
      (event: { complete: boolean }) => {
        setStripeComplete((prev) => ({
          ...prev,
          [SubscriptionCardField.CardCvc]: event.complete,
        }))
        clearFieldError(SubscriptionCardField.CardCvc)
      },
      [clearFieldError],
    )

    const validateBeforeSubmit = useCallback((): boolean => {
      const nextErrors: FieldErrors = {}

      for (const field of SUBSCRIPTION_CARD_BILLING_REQUIRED_FIELDS) {
        if (!billing[field]?.trim()) {
          nextErrors[field] = fieldRequiredMessage
        }
      }

      for (const field of SUBSCRIPTION_CARD_STRIPE_REQUIRED_FIELDS) {
        if (!stripeComplete[field]) {
          nextErrors[field] = fieldRequiredMessage
        }
      }

      setFieldErrors(nextErrors)
      setFormError('')
      return Object.keys(nextErrors).length === 0
    }, [billing, fieldRequiredMessage, stripeComplete])

    const handleSubmit = useCallback(async () => {
      if (!stripe || !elements) return
      if (!validateBeforeSubmit()) return

      const cardNumberElement = elements.getElement(CardNumberElement)
      if (!cardNumberElement) return

      setIsSubmitting(true)
      setFormError('')
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: billing.name || undefined,
            email: billingDefaults?.email || undefined,
            address: {
              line1: billing.address || undefined,
              city: billing.city || undefined,
              state: billing.state || undefined,
              postal_code: billing.zipCode || undefined,
              country: resolveStripeCountryCode(billingDefaults?.country),
            },
          },
        },
      })
      setIsSubmitting(false)

      // Stripe may return an error object even when the PaymentIntent already
      // moved to succeeded/processing (e.g. network blip after bank confirm).
      const status = readStripeConfirmPaymentIntentStatus(result)
      if (isStripePaymentIntentConfirmed(status)) {
        onSuccess()
        return
      }

      if (result.error) {
        const message = result.error.message || t(subscriptionModalKey('cardPaymentError'))
        setFormError(message)
        // Still ask parent to verify via purchase-history — webhook may have paid.
        onError(message)
        return
      }

      const fallback = t(subscriptionModalKey('cardPaymentError'))
      setFormError(fallback)
      onError(fallback)
    }, [
      stripe,
      elements,
      clientSecret,
      billing,
      billingDefaults?.email,
      billingDefaults?.country,
      onError,
      onSuccess,
      t,
      validateBeforeSubmit,
    ])

    useImperativeHandle(ref, () => ({ submit: handleSubmit }), [handleSubmit])

    const placeholderLabel = (key: string) => t(`${placeholderTk}.${key}`)
    const modalLabel = (field: Parameters<typeof subscriptionModalKey>[0]) =>
      t(subscriptionModalKey(field))

    const fieldError = (field: SubscriptionCardFieldKey) => fieldErrors[field]
    const isInvalid = (field: SubscriptionCardFieldKey) => Boolean(fieldErrors[field]) || undefined

    return (
      <div className={SUBSCRIPTION_CARD_FORM_CLASS.root}>
        <div
          className={[
            SUBSCRIPTION_CARD_FORM_CLASS.form,
            SUBSCRIPTION_CARD_FORM_CLASS.checkoutVariant,
          ].join(' ')}
        >
          <div className="sms-credit-card-required-note">
            <strong>*</strong> {modalLabel('cardRequiredNote')}
          </div>
          <div className="sms-credit-card-fields">
            <div className="sms-credit-card-row">
              <label className="sms-credit-card-field">
                <span className="sms-credit-card-label">
                  {modalLabel('cardholderName')} <RequiredMark />
                </span>
                <input
                  className="sms-credit-card-input"
                  type="text"
                  autoComplete="cc-name"
                  placeholder={placeholderLabel('cardNamePlaceholder')}
                  value={billing.name}
                  disabled={isSubmitting}
                  aria-invalid={isInvalid(SubscriptionCardField.Name)}
                  onChange={updateBilling('name')}
                />
                {fieldError(SubscriptionCardField.Name) ? (
                  <span className="sms-credit-card-field-error" role="alert">
                    {fieldError(SubscriptionCardField.Name)}
                  </span>
                ) : null}
              </label>
              <div className="sms-credit-card-field">
                <span className="sms-credit-card-label">
                  {modalLabel('cardNumber')} <RequiredMark />
                </span>
                <div
                  className={[
                    'subscription-stripe-card-field',
                    isInvalid(SubscriptionCardField.CardNumber) ? 'is-invalid' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <CardNumberElement
                    options={cardNumberOptions}
                    onChange={onStripeNumberChange}
                  />
                </div>
                {fieldError(SubscriptionCardField.CardNumber) ? (
                  <span className="sms-credit-card-field-error" role="alert">
                    {fieldError(SubscriptionCardField.CardNumber)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="sms-credit-card-row">
              <div className="sms-credit-card-field">
                <span className="sms-credit-card-label">
                  {modalLabel('cardExpiry')} <RequiredMark />
                </span>
                <div
                  className={[
                    'subscription-stripe-card-field',
                    isInvalid(SubscriptionCardField.CardExpiry) ? 'is-invalid' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <CardExpiryElement
                    options={cardExpiryOptions}
                    onChange={onStripeExpiryChange}
                  />
                </div>
                {fieldError(SubscriptionCardField.CardExpiry) ? (
                  <span className="sms-credit-card-field-error" role="alert">
                    {fieldError(SubscriptionCardField.CardExpiry)}
                  </span>
                ) : null}
              </div>
              <div className="sms-credit-card-field">
                <span className="sms-credit-card-label">
                  {modalLabel('cardCvc')} <RequiredMark />
                </span>
                <div
                  className={[
                    'subscription-stripe-card-field',
                    isInvalid(SubscriptionCardField.CardCvc) ? 'is-invalid' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <CardCvcElement options={cardCvcOptions} onChange={onStripeCvcChange} />
                </div>
                {fieldError(SubscriptionCardField.CardCvc) ? (
                  <span className="sms-credit-card-field-error" role="alert">
                    {fieldError(SubscriptionCardField.CardCvc)}
                  </span>
                ) : null}
              </div>
            </div>
            <label className="sms-credit-card-field">
              <span className="sms-credit-card-label">
                {modalLabel('billingAddress')} <RequiredMark />
              </span>
              <input
                className="sms-credit-card-input"
                type="text"
                autoComplete="address-line1"
                placeholder={placeholderLabel('cardAddressPlaceholder')}
                value={billing.address}
                disabled={isSubmitting}
                aria-invalid={isInvalid(SubscriptionCardField.Address)}
                onChange={updateBilling('address')}
              />
              {fieldError(SubscriptionCardField.Address) ? (
                <span className="sms-credit-card-field-error" role="alert">
                  {fieldError(SubscriptionCardField.Address)}
                </span>
              ) : null}
            </label>
            <div className="sms-credit-card-row">
              <label className="sms-credit-card-field">
                <span className="sms-credit-card-label">
                  {modalLabel('billingCity')} <RequiredMark />
                </span>
                <input
                  className="sms-credit-card-input"
                  type="text"
                  autoComplete="address-level2"
                  placeholder={placeholderLabel('cardCityPlaceholder')}
                  value={billing.city}
                  disabled={isSubmitting}
                  aria-invalid={isInvalid(SubscriptionCardField.City)}
                  onChange={updateBilling('city')}
                />
                {fieldError(SubscriptionCardField.City) ? (
                  <span className="sms-credit-card-field-error" role="alert">
                    {fieldError(SubscriptionCardField.City)}
                  </span>
                ) : null}
              </label>
              <label className="sms-credit-card-field">
                <span className="sms-credit-card-label">
                  {modalLabel('billingState')} <RequiredMark />
                </span>
                <input
                  className="sms-credit-card-input"
                  type="text"
                  autoComplete="address-level1"
                  placeholder={placeholderLabel('cardStatePlaceholder')}
                  value={billing.state}
                  disabled={isSubmitting}
                  aria-invalid={isInvalid(SubscriptionCardField.State)}
                  onChange={updateBilling('state')}
                />
                {fieldError(SubscriptionCardField.State) ? (
                  <span className="sms-credit-card-field-error" role="alert">
                    {fieldError(SubscriptionCardField.State)}
                  </span>
                ) : null}
              </label>
            </div>
            <label className="sms-credit-card-field">
              <span className="sms-credit-card-label">
                {modalLabel('billingZipCode')} <RequiredMark />
              </span>
              <input
                className="sms-credit-card-input"
                type="text"
                autoComplete="postal-code"
                placeholder={placeholderLabel('cardZipPlaceholder')}
                value={billing.zipCode}
                disabled={isSubmitting}
                aria-invalid={isInvalid(SubscriptionCardField.ZipCode)}
                onChange={updateBilling('zipCode')}
              />
              {fieldError(SubscriptionCardField.ZipCode) ? (
                <span className="sms-credit-card-field-error" role="alert">
                  {fieldError(SubscriptionCardField.ZipCode)}
                </span>
              ) : null}
            </label>
            <div className="sms-credit-card-error" role="alert" aria-live="polite">
              {formError}
            </div>
          </div>
        </div>

        {!hideFooter ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-nexoraBorder bg-white px-4 text-sm font-bold text-nexoraMuted transition hover:bg-slate-50 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!stripe || isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-sm font-bold text-white transition hover:bg-nexoraBrand/90 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {modalLabel('confirmPayment')}
            </button>
          </div>
        ) : null}
      </div>
    )
  },
)

type SubscriptionCardPaymentFormProps = {
  clientSecret: string
  publishableKey: string
  billingDefaults?: SubscriptionBillingDetails
  hideFooter?: boolean
  placeholderTk?: string
  onCancel: () => void
  onSuccess: () => void
  onError: (message: string) => void
  onSubmittingChange?: (isSubmitting: boolean) => void
}

const SubscriptionCardPaymentForm = forwardRef<
  SubscriptionCardPaymentFormHandle,
  SubscriptionCardPaymentFormProps
>(function SubscriptionCardPaymentForm(
  {
    clientSecret,
    publishableKey,
    billingDefaults,
    hideFooter,
    placeholderTk,
    onCancel,
    onSuccess,
    onError,
    onSubmittingChange,
  },
  ref,
) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey])

  return (
    <Elements stripe={stripePromise}>
      <CardPaymentInner
        ref={ref}
        clientSecret={clientSecret}
        billingDefaults={billingDefaults}
        hideFooter={hideFooter}
        placeholderTk={placeholderTk}
        onCancel={onCancel}
        onSuccess={onSuccess}
        onError={onError}
        onSubmittingChange={onSubmittingChange}
      />
    </Elements>
  )
})

export default SubscriptionCardPaymentForm
