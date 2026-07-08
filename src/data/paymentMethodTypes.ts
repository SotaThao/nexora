/** Maps backend payment-method `type` strings to UI keys used in payout components. */
export const PAYOUT_TYPE_TO_UI_KEY: Record<string, string> = {
  Zelle: 'zelle',
  BankWire: 'bankwire',
  PayPal: 'paypal',
  Venmo: 'venmo',
  CashApp: 'cashapp',
  AppleCash: 'applecash',
  VlinkPay: 'vlinkpay',
  Crypto: 'crypto',
}

export const PAYOUT_UI_LABELS: Record<string, string> = {
  zelle: 'Zelle',
  paypal: 'PayPal',
  venmo: 'Venmo',
  cashapp: 'Cash App',
  applecash: 'Apple Cash',
  vlinkpay: 'VLINKPAY Wallet',
  bankwire: 'Bank Wire',
  crypto: 'Crypto Wallet',
}

export const PAYOUT_UI_DISPLAY_ORDER = [
  'zelle',
  'paypal',
  'venmo',
  'cashapp',
  'applecash',
  'vlinkpay',
  'bankwire',
  'crypto',
] as const

export function payoutTypeToUiKey(type = ''): string {
  return PAYOUT_TYPE_TO_UI_KEY[type] || type.toLowerCase().replace(/\s+/g, '')
}

/** Hide catch-all "Other" payout type from merchant/staff configuration UIs. */
export function isHiddenPayoutConfigType(method: { type?: string; uiKey?: string }): boolean {
  const uiKey = method.uiKey || payoutTypeToUiKey(method.type || '')
  return uiKey === 'other'
}

export function sortPaymentMethodsByUiOrder<T extends { uiKey?: string }>(methods: T[]): T[] {
  return [...methods].sort((a, b) => {
    const ai = PAYOUT_UI_DISPLAY_ORDER.indexOf((a.uiKey || '') as typeof PAYOUT_UI_DISPLAY_ORDER[number])
    const bi = PAYOUT_UI_DISPLAY_ORDER.indexOf((b.uiKey || '') as typeof PAYOUT_UI_DISPLAY_ORDER[number])
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
}

/** UI keys whose payment flow routes directly P2P (no platform processing fee). */
export const DIRECT_P2P_UI_KEYS = new Set([
  'zelle',
  'venmo',
  'cashapp',
  'applecash',
  'vlinkpay',
])

/**
 * Returns true when the given raw API paymentMethod string (e.g. "CashApp",
 * "Venmo") maps to a direct P2P method.
 */
export function isDirectP2pMethod(apiType: string): boolean {
  return DIRECT_P2P_UI_KEYS.has(payoutTypeToUiKey(apiType))
}

/**
 * Returns the human-readable display label for a raw API paymentMethod
 * string. Falls back to the original string when there is no mapping.
 */
export function getPaymentMethodDisplayName(apiType: string): string {
  const uiKey = payoutTypeToUiKey(apiType)
  return PAYOUT_UI_LABELS[uiKey] ?? apiType
}
