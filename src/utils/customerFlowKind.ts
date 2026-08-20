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
  const normalizedPurpose = purpose.replace(/[_-]/g, '')
  return normalizedPurpose === 'payment' || normalizedPurpose === 'directpayment'
}

/** Touch context forwarded onto /pay so the payment page can load tippable staff. */
export interface TouchRedirectContext {
  businessSlug?: string | null
  touchPointSlug?: string | null
  sessionId?: string | null
}

export function resolveTouchpointRedirectUrl(
  touchPageData?: LooseObject | null,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
  context?: TouchRedirectContext | null,
): string | null {
  const rawUrl = touchPageData?.touchPoint?.url
  if (!rawUrl || typeof rawUrl !== 'string') return null

  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `${origin}${rawUrl}`)
    if (!parsed.pathname.startsWith('/pay/')) return null

    // Params already configured on the touchpoint URL win over the route-derived ones.
    const contextParams: Array<[string, string | null | undefined]> = [
      ['businessSlug', context?.businessSlug],
      ['touchPointSlug', context?.touchPointSlug],
      ['sessionId', context?.sessionId],
    ]
    contextParams.forEach(([key, value]) => {
      if (value && !parsed.searchParams.get(key)) parsed.searchParams.set(key, value)
    })

    return `${parsed.pathname}${parsed.search}`
  } catch {
    return null
  }
}

export type PaymentCopyScope = 'merchant' | 'staff'

export function resolvePaymentCopyScope(
  isPaymentFlow: boolean,
  selectedStaffCount: number,
): PaymentCopyScope | null {
  if (!isPaymentFlow) return null
  return selectedStaffCount === 1 ? 'staff' : 'merchant'
}
