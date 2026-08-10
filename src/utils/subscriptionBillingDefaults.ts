import type { SubscriptionBillingDetails } from '../components/dashboard/modals/SubscriptionCardPaymentForm'
import type { UserProfile } from '../types/domain'
import { COUNTRY_CODES } from '../constants/countries'

const BILLING_DETAIL_FIELDS = [
  'name',
  'email',
  'address',
  'city',
  'state',
  'zipCode',
  'country',
] as const satisfies ReadonlyArray<keyof SubscriptionBillingDetails>

type BillingDetailField = (typeof BILLING_DETAIL_FIELDS)[number]

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
  const contactInfo = raw.contactInfo as Record<string, unknown> | null | undefined

  const name =
    pickString(profile.fullName)
    || pickString([profile.firstName, profile.lastName].filter(Boolean).join(' '))
    || pickString(contactInfo?.name)

  const fromProfile: SubscriptionBillingDetails = {
    name,
    email: pickString(profile.email, contactInfo?.email),
    address: pickString(raw.address, contactInfo?.address, business?.address),
    city: pickString(raw.city, contactInfo?.city, business?.city),
    state: pickString(raw.state, contactInfo?.state, business?.state),
    zipCode: pickString(
      raw.zipCode,
      raw.zip,
      contactInfo?.zipCode,
      business?.zipCode,
    ),
    country: pickString(raw.country, contactInfo?.country, business?.country),
  }

  const hasAny = BILLING_DETAIL_FIELDS.some((field) => Boolean(fromProfile[field]))
  return hasAny ? fromProfile : undefined
}

/** Prefer explicit prop fields, then fill gaps from GET /userprofile/me. */
export function resolveSubscriptionBillingDefaults(
  billingDefaults?: SubscriptionBillingDetails,
  profile?: UserProfile | null,
): SubscriptionBillingDetails | undefined {
  const fromProfile = buildSubscriptionBillingDefaultsFromProfile(profile)
  if (!billingDefaults && !fromProfile) return undefined

  const merged = {} as SubscriptionBillingDetails
  for (const field of BILLING_DETAIL_FIELDS) {
    merged[field] = pickString(billingDefaults?.[field], fromProfile?.[field])
  }

  const hasAny = BILLING_DETAIL_FIELDS.some((field: BillingDetailField) => Boolean(merged[field]))
  return hasAny ? merged : undefined
}
