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
  STRIPE_PAYMENT_INTENT_CONFIRMED_STATUSES,
  subscriptionModalKey,
} from './subscriptionPaymentConstants'

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

type BillingFormState = ReturnType<typeof buildSubscriptionBillingFormState>

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

    const cardNumberPlaceholder = t(`${placeholderTk}.cardNumberPlaceholder`)
    const cardExpiryPlaceholder = t(`${placeholderTk}.cardExpiryPlaceholder`)
    const cardCvcPlaceholder = t(`${placeholderTk}.cardCvcPlaceholder`)

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
    }, [billingDefaults])

    useEffect(() => {
      onSubmittingChange?.(isSubmitting)
    }, [isSubmitting, onSubmittingChange])

    const updateBilling = (field: keyof BillingFormState) => (e: ChangeEvent<HTMLInputElement>) =>
      setBilling((prev) => ({ ...prev, [field]: e.target.value }))

    const handleSubmit = useCallback(async () => {
      if (!stripe || !elements) return
      const cardNumberElement = elements.getElement(CardNumberElement)
      if (!cardNumberElement) return

      setIsSubmitting(true)
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

      if (result.error) {
        onError(result.error.message || t(subscriptionModalKey('cardPaymentError')))
        return
      }

      const status = result.paymentIntent?.status
      if (
        status
        && STRIPE_PAYMENT_INTENT_CONFIRMED_STATUSES.includes(
          status as (typeof STRIPE_PAYMENT_INTENT_CONFIRMED_STATUSES)[number],
        )
      ) {
        onSuccess()
        return
      }

      onError(t(subscriptionModalKey('cardPaymentError')))
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
    ])

    useImperativeHandle(ref, () => ({ submit: handleSubmit }), [handleSubmit])

    const placeholderLabel = (key: string) => t(`${placeholderTk}.${key}`)
    const modalLabel = (field: Parameters<typeof subscriptionModalKey>[0]) =>
      t(subscriptionModalKey(field))

    return (
      <>
        <div className="sms-credit-card-form">
          <div className="sms-credit-card-required-note">
            <strong>*</strong> {placeholderLabel('cardRequiredNote')}
          </div>
          <div className="sms-credit-card-fields">
            <div className="sms-credit-card-row">
              <label className="sms-credit-card-field">
                <span className="sms-credit-card-label">
                  {modalLabel('cardholderName')} <span>*</span>
                </span>
                <input
                  className="sms-credit-card-input"
                  type="text"
                  autoComplete="cc-name"
                  placeholder={placeholderLabel('cardNamePlaceholder')}
                  value={billing.name}
                  disabled={isSubmitting}
                  onChange={updateBilling('name')}
                />
              </label>
              <div className="sms-credit-card-field">
                <span className="sms-credit-card-label">
                  {modalLabel('cardNumber')} <span>*</span>
                </span>
                <div className="subscription-stripe-card-field">
                  <CardNumberElement options={cardNumberOptions} />
                </div>
              </div>
            </div>
            <div className="sms-credit-card-row">
              <div className="sms-credit-card-field">
                <span className="sms-credit-card-label">
                  {modalLabel('cardExpiry')} <span>*</span>
                </span>
                <div className="subscription-stripe-card-field">
                  <CardExpiryElement options={cardExpiryOptions} />
                </div>
              </div>
              <div className="sms-credit-card-field">
                <span className="sms-credit-card-label">
                  {modalLabel('cardCvc')} <span>*</span>
                </span>
                <div className="subscription-stripe-card-field">
                  <CardCvcElement options={cardCvcOptions} />
                </div>
              </div>
            </div>
            <label className="sms-credit-card-field">
              <span className="sms-credit-card-label">
                {modalLabel('billingAddress')} <span>*</span>
              </span>
              <input
                className="sms-credit-card-input"
                type="text"
                autoComplete="address-line1"
                placeholder={placeholderLabel('cardAddressPlaceholder')}
                value={billing.address}
                disabled={isSubmitting}
                onChange={updateBilling('address')}
              />
            </label>
            <div className="sms-credit-card-row">
              <label className="sms-credit-card-field">
                <span className="sms-credit-card-label">
                  {modalLabel('billingCity')} <span>*</span>
                </span>
                <input
                  className="sms-credit-card-input"
                  type="text"
                  autoComplete="address-level2"
                  placeholder={placeholderLabel('cardCityPlaceholder')}
                  value={billing.city}
                  disabled={isSubmitting}
                  onChange={updateBilling('city')}
                />
              </label>
              <label className="sms-credit-card-field">
                <span className="sms-credit-card-label">
                  {modalLabel('billingState')} <span>*</span>
                </span>
                <input
                  className="sms-credit-card-input"
                  type="text"
                  autoComplete="address-level1"
                  placeholder={placeholderLabel('cardStatePlaceholder')}
                  value={billing.state}
                  disabled={isSubmitting}
                  onChange={updateBilling('state')}
                />
              </label>
            </div>
            <label className="sms-credit-card-field">
              <span className="sms-credit-card-label">
                {modalLabel('billingZipCode')} <span>*</span>
              </span>
              <input
                className="sms-credit-card-input"
                type="text"
                autoComplete="postal-code"
                placeholder={placeholderLabel('cardZipPlaceholder')}
                value={billing.zipCode}
                disabled={isSubmitting}
                onChange={updateBilling('zipCode')}
              />
            </label>
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
      </>
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
