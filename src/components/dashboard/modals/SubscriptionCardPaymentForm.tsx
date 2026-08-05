import { useMemo, useState, type ChangeEvent } from 'react'
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
import { COUNTRY_CODES } from '../../CountryCodeSelect'

/** Stripe requires an ISO 3166-1 alpha-2 country code, not a full country name. */
function resolveCountryCode(input?: string): string | undefined {
  const trimmed = input?.trim()
  if (!trimmed) return undefined
  if (trimmed.length === 2) return trimmed.toUpperCase()
  const match = COUNTRY_CODES.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
  return match?.code
}

const CARD_ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: '14px',
      color: '#0f172a',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#dc2626' },
  },
}

export interface SubscriptionBillingDetails {
  name?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

function CardPaymentInner({
  clientSecret,
  billingDefaults,
  onCancel,
  onSuccess,
  onError,
}: {
  clientSecret: string
  billingDefaults?: SubscriptionBillingDetails
  onCancel: () => void
  onSuccess: () => void
  onError: (message: string) => void
}) {
  const { t } = useTranslation()
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [billing, setBilling] = useState<SubscriptionBillingDetails>({
    name: billingDefaults?.name ?? '',
    address: billingDefaults?.address ?? '',
    city: billingDefaults?.city ?? '',
    state: billingDefaults?.state ?? '',
    zipCode: billingDefaults?.zipCode ?? '',
    country: billingDefaults?.country ?? '',
  })

  const updateBilling = (field: keyof SubscriptionBillingDetails) => (
    e: ChangeEvent<HTMLInputElement>,
  ) => setBilling((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async () => {
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
            country: resolveCountryCode(billing.country),
          },
        },
      },
    })
    setIsSubmitting(false)

    if (result.error) {
      onError(result.error.message || t('dashboard.modals.subscription_card_payment_error'))
      return
    }

    const status = result.paymentIntent?.status
    if (status === 'succeeded' || status === 'processing') {
      onSuccess()
      return
    }

    onError(t('dashboard.modals.subscription_card_payment_error'))
  }

  return (
    <>
      <div className="mt-2 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-nexoraMuted">
              {t('dashboard.modals.subscription_cardholder_name_label')}
            </label>
            <input
              type="text"
              value={billing.name}
              onChange={updateBilling('name')}
              className="w-full rounded-xl border border-nexoraBorder p-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-nexoraMuted">
              {t('dashboard.modals.subscription_card_number_label')}
            </label>
            <div className="rounded-xl border border-nexoraBorder p-3">
              <CardNumberElement options={CARD_ELEMENT_STYLE} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-nexoraMuted">
              {t('dashboard.modals.subscription_card_expiry_label')}
            </label>
            <div className="rounded-xl border border-nexoraBorder p-3">
              <CardExpiryElement options={CARD_ELEMENT_STYLE} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-nexoraMuted">
              {t('dashboard.modals.subscription_card_cvc_label')}
            </label>
            <div className="rounded-xl border border-nexoraBorder p-3">
              <CardCvcElement options={CARD_ELEMENT_STYLE} />
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-nexoraMuted">
            {t('dashboard.modals.subscription_billing_address_label')}
          </label>
          <input
            type="text"
            value={billing.address}
            onChange={updateBilling('address')}
            className="w-full rounded-xl border border-nexoraBorder p-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-nexoraMuted">
              {t('dashboard.modals.subscription_billing_city_label')}
            </label>
            <input
              type="text"
              value={billing.city}
              onChange={updateBilling('city')}
              className="w-full rounded-xl border border-nexoraBorder p-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-nexoraMuted">
              {t('dashboard.modals.subscription_billing_state_label')}
            </label>
            <input
              type="text"
              value={billing.state}
              onChange={updateBilling('state')}
              className="w-full rounded-xl border border-nexoraBorder p-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-nexoraMuted">
              {t('dashboard.modals.subscription_billing_zip_code_label')}
            </label>
            <input
              type="text"
              value={billing.zipCode}
              onChange={updateBilling('zipCode')}
              className="w-full rounded-xl border border-nexoraBorder p-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-nexoraMuted">
              {t('dashboard.modals.subscription_billing_country_label')}
            </label>
            <input
              type="text"
              value={billing.country}
              onChange={updateBilling('country')}
              className="w-full rounded-xl border border-nexoraBorder p-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
        </div>
      </div>

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
          onClick={handleSubmit}
          disabled={!stripe || isSubmitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-sm font-bold text-white transition hover:bg-nexoraBrand/90 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t('dashboard.modals.subscription_confirm_payment')}
        </button>
      </div>
    </>
  )
}

export default function SubscriptionCardPaymentForm({
  clientSecret,
  publishableKey,
  billingDefaults,
  onCancel,
  onSuccess,
  onError,
}: {
  clientSecret: string
  publishableKey: string
  billingDefaults?: SubscriptionBillingDetails
  onCancel: () => void
  onSuccess: () => void
  onError: (message: string) => void
}) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey])

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CardPaymentInner
        clientSecret={clientSecret}
        billingDefaults={billingDefaults}
        onCancel={onCancel}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}
