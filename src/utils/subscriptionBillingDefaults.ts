import type { SubscriptionBillingDetails } from '../components/dashboard/modals/SubscriptionCardPaymentForm'
import type { UserProfile } from '../types/domain'
import { COUNTRY_CODES } from '../constants/countries'

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

/** Stripe requires an ISO 3166-1 alpha-2 country code, not a full country name. */
export function resolveStripeCountryCode(input?: string): string | undefined {
  const trimmed = input?.trim()
  if (!trimmed) return undefined
  if (trimmed.length === 2) return trimmed.toUpperCase()
  const match = COUNTRY_CODES.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
  return match?.code
}

export function buildSubscriptionBillingFormState(
  billingDefaults?: SubscriptionBillingDetails,
): Omit<SubscriptionBillingDetails, 'country' | 'email'> {
  return {
    name: billingDefaults?.name ?? '',
    address: billingDefaults?.address ?? '',
    city: billingDefaults?.city ?? '',
    state: billingDefaults?.state ?? '',
    zipCode: billingDefaults?.zipCode ?? '',
  }
}

export function buildSubscriptionBillingDefaultsFromProfile(
  profile?: UserProfile | null,
): SubscriptionBillingDetails | undefined {
  if (!profile) return undefined

  const raw = profile as Record<string, unknown>
  const business = profile.business as Record<string, unknown> | null | undefined

  const name =
    pickString(profile.fullName)
    || pickString([profile.firstName, profile.lastName].filter(Boolean).join(' '))

  return {
    name,
    email: pickString(profile.email),
    address: pickString(raw.address, business?.address),
    city: pickString(raw.city, business?.city),
    state: pickString(raw.state, business?.state),
    zipCode: pickString(raw.zipCode, raw.zip, business?.zipCode),
    country: pickString(raw.country, business?.country),
  }
}
