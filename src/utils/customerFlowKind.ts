const PAYMENT_INTENT_VALUES = new Set(['payment', 'direct_payment', 'pay'])

function normalizeIntent(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

export function isTouchPaymentIntent(
  searchParams: URLSearchParams | null | undefined,
  touchPageData?: LooseObject | null,
): boolean {
  const intent = normalizeIntent(searchParams?.get('intent') ?? searchParams?.get('flow'))
  if (PAYMENT_INTENT_VALUES.has(intent)) return true

  const touchPoint = touchPageData?.touchPoint as LooseObject | undefined
  const purpose = normalizeIntent(
    touchPoint?.purpose
    ?? touchPoint?.qrPurpose
    ?? touchPoint?.QrPurpose
    ?? touchPoint?.category,
  )
  return purpose === 'payment' || purpose === 'directpayment'
}

export function resolveTouchpointRedirectUrl(
  touchPageData?: LooseObject | null,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
): string | null {
  const rawUrl = touchPageData?.touchPoint?.url
  if (!rawUrl || typeof rawUrl !== 'string') return null

  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `${origin}${rawUrl}`)
    if (parsed.pathname.startsWith('/pay/')) {
      return `${parsed.pathname}${parsed.search}`
    }
  } catch {
    return null
  }

  return null
}

export type PaymentCopyScope = 'merchant' | 'staff'

export function resolvePaymentCopyScope(
  isPaymentFlow: boolean,
  selectedStaffCount: number,
): PaymentCopyScope | null {
  if (!isPaymentFlow) return null
  return selectedStaffCount === 1 ? 'staff' : 'merchant'
}
