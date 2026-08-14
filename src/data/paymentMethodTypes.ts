import { PayoutApiType, PayoutUiKey } from './payoutUiKeys'
import { VLINKPAY_WALLET_LABEL, hasAtLeastOneVlinkpayAddress, parseVlinkpayAddressesFromMethod } from '../components/payout/vlinkpayWallet'

/** Maps backend payment-method `type` strings to UI keys used in payout components. */
export const PAYOUT_TYPE_TO_UI_KEY: Record<string, string> = {
  [PayoutApiType.Zelle]: PayoutUiKey.Zelle,
  [PayoutApiType.BankWire]: PayoutUiKey.BankWire,
  [PayoutApiType.PayPal]: PayoutUiKey.PayPal,
  [PayoutApiType.Venmo]: PayoutUiKey.Venmo,
  [PayoutApiType.CashApp]: PayoutUiKey.CashApp,
  [PayoutApiType.AppleCash]: PayoutUiKey.AppleCash,
  [PayoutApiType.VlinkPay]: PayoutUiKey.VlinkPay,
  [PayoutApiType.Crypto]: PayoutUiKey.Crypto,
}

export const PAYOUT_UI_KEY_TO_API_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(PAYOUT_TYPE_TO_UI_KEY).map(([apiType, uiKey]) => [uiKey, apiType]),
)

export const PAYOUT_UI_LABELS: Record<string, string> = {
  [PayoutUiKey.Zelle]: 'Zelle',
  [PayoutUiKey.PayPal]: 'PayPal',
  [PayoutUiKey.Venmo]: 'Venmo',
  [PayoutUiKey.CashApp]: 'Cash App',
  [PayoutUiKey.AppleCash]: 'Apple Cash',
  [PayoutUiKey.VlinkPay]: VLINKPAY_WALLET_LABEL,
  [PayoutUiKey.BankWire]: 'Bank Wire',
  [PayoutUiKey.Crypto]: 'Crypto Wallet',
}

type PaymentLabelTranslator = (key: string, variables?: Record<string, string>) => string

const PAYOUT_ACCOUNT_FIELD_TRANSLATION_KEYS: Record<string, string> = {
  zelle: 'components.dashboard.modals.PayoutSetupModal.fieldEmailPhone',
  paypal: 'components.dashboard.modals.PayoutSetupModal.fieldEmail',
  venmo: 'components.dashboard.modals.PayoutSetupModal.fieldVenmoHandle',
  cashapp: 'components.dashboard.modals.PayoutSetupModal.fieldCashAppIdentifier',
  applecash: 'components.dashboard.modals.PayoutSetupModal.fieldEmailPhone',
}

const PAYOUT_ACCOUNT_FIELD_LABELS: Record<string, string> = {
  bankwire: 'details',
  vlinkpay: 'VLINKPAY ID',
  crypto: 'BTC/USDT Address',
}

const PAYOUT_ACCOUNT_DISPLAY_FIELD_TRANSLATION_KEYS: Record<string, string> = {
  zelle: 'components.customer_flow.steps.WalletDetails.emailPhone',
  paypal: 'components.customer_flow.steps.WalletDetails.paypalEmailPhone',
  venmo: 'components.customer_flow.steps.WalletDetails.venmoUsername',
  cashapp: 'components.customer_flow.steps.WalletDetails.cashTag',
  applecash: 'components.customer_flow.steps.WalletDetails.emailPhone',
  bankwire: 'components.customer_flow.steps.WalletDetails.bankDetails',
}

const PAYOUT_ACCOUNT_DISPLAY_FIELD_LABELS: Record<string, string> = {
  vlinkpay: 'VLINKPAY ID',
  crypto: 'Wallet BTC/USDT Address',
}

export function getPayoutWalletDisplayName(uiKey = ''): string {
  return PAYOUT_UI_LABELS[uiKey] ?? uiKey
}

function getPayoutAccountFieldLabel(
  uiKey: string,
  t: PaymentLabelTranslator,
): string {
  const fieldTranslationKey = PAYOUT_ACCOUNT_FIELD_TRANSLATION_KEYS[uiKey]
  return fieldTranslationKey
    ? t(fieldTranslationKey)
    : PAYOUT_ACCOUNT_FIELD_LABELS[uiKey]
      ?? t('components.dashboard.modals.PayoutSetupModal.accountIdentifier').replace(/\s*\*$/, '')
}

export function getPayoutAccountIdentifierLabel(
  uiKey = '',
  t: PaymentLabelTranslator,
): string {
  const normalizedKey = uiKey.toLowerCase()
  const walletName = getPayoutWalletDisplayName(normalizedKey)
  const fieldLabel = getPayoutAccountFieldLabel(normalizedKey, t)

  return t('components.dashboard.modals.PayoutSetupModal.accountIdentifierForMethod', {
    wallet: walletName.toUpperCase(),
    field: String(fieldLabel || '').toUpperCase(),
  })
}

export function getPayoutAccountDisplayLabel(
  uiKey = '',
  t: PaymentLabelTranslator,
): string {
  const normalizedKey = uiKey.toLowerCase()
  const displayFieldTranslationKey = PAYOUT_ACCOUNT_DISPLAY_FIELD_TRANSLATION_KEYS[normalizedKey]
  const fieldLabel = displayFieldTranslationKey
    ? t(displayFieldTranslationKey)
    : PAYOUT_ACCOUNT_DISPLAY_FIELD_LABELS[normalizedKey]
      ?? t('components.customer_flow.steps.WalletDetails.account')

  return String(fieldLabel || '').toUpperCase()
}

export function getPayoutAccountHolderDisplayLabel(
  uiKey = '',
  t: PaymentLabelTranslator,
): string {
  const normalizedKey = uiKey.toLowerCase()
  const walletName = getPayoutWalletDisplayName(normalizedKey)

  return t('components.customer_flow.steps.WalletDetails.accountHolder', {
    wallet: walletName,
  }).toUpperCase()
}

export const PAYOUT_UI_DISPLAY_ORDER = [
  PayoutUiKey.Zelle,
  PayoutUiKey.PayPal,
  PayoutUiKey.Venmo,
  PayoutUiKey.CashApp,
  PayoutUiKey.AppleCash,
  PayoutUiKey.VlinkPay,
  PayoutUiKey.BankWire,
  PayoutUiKey.Crypto,
] as const

/** Staff create/edit surfaces — excludes bankwire/crypto (not configured on staff wallets). */
export const STAFF_CONFIGURABLE_PAYOUT_UI_KEYS = [
  PayoutUiKey.Zelle,
  PayoutUiKey.PayPal,
  PayoutUiKey.Venmo,
  PayoutUiKey.CashApp,
  PayoutUiKey.AppleCash,
  PayoutUiKey.VlinkPay,
] as const

export type StaffConfigurablePayoutUiKey = (typeof STAFF_CONFIGURABLE_PAYOUT_UI_KEYS)[number]

/**
 * Preserve API array order for payout UI keys. Known methods missing from the
 * response are appended in fallback order so the form still shows a full list.
 */
export function orderedPayoutUiKeysFromMethods(
  methods: Array<{ type?: string; uiKey?: string }> | null | undefined,
  allowedKeys: readonly string[] = STAFF_CONFIGURABLE_PAYOUT_UI_KEYS,
  fallbackOrder: readonly string[] = allowedKeys,
): string[] {
  const allowed = new Set(allowedKeys)
  const seen = new Set<string>()
  const ordered: string[] = []

  for (const method of methods ?? []) {
    const key = method.uiKey || payoutTypeToUiKey(method.type || '')
    if (!key || !allowed.has(key) || seen.has(key)) continue
    seen.add(key)
    ordered.push(key)
  }

  for (const key of fallbackOrder) {
    if (!allowed.has(key) || seen.has(key)) continue
    seen.add(key)
    ordered.push(key)
  }

  return ordered
}

/**
 * Staff manual-add: order payout keys from GET /payment-methods/supported only,
 * ascending by `sortOrder` (no hardcoded fallback reorder).
 */
export function orderedStaffPayoutUiKeysFromSupported(
  methods: Array<{ type?: string; uiKey?: string; sortOrder?: number }> | null | undefined,
  allowedKeys: readonly string[] = STAFF_CONFIGURABLE_PAYOUT_UI_KEYS,
): string[] {
  const allowed = new Set(allowedKeys)
  const seen = new Set<string>()
  const sorted = [...(methods ?? [])].sort(
    (a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0),
  )
  const ordered: string[] = []

  for (const method of sorted) {
    const key = method.uiKey || payoutTypeToUiKey(method.type || '')
    if (!key || !allowed.has(key) || seen.has(key)) continue
    seen.add(key)
    ordered.push(key)
  }

  return ordered
}

export function payoutTypeToUiKey(type = ''): string {
  return PAYOUT_TYPE_TO_UI_KEY[type] || type.toLowerCase().replace(/\s+/g, '')
}

/** Hide catch-all "Other" payout type from merchant/staff configuration UIs. */
export function isHiddenPayoutConfigType(method: { type?: string; uiKey?: string }): boolean {
  const uiKey = method.uiKey || payoutTypeToUiKey(method.type || '')
  return uiKey === PayoutUiKey.Other
}

export function sortPaymentMethodsByUiOrder<T extends { uiKey?: string }>(methods: T[]): T[] {
  return [...methods].sort((a, b) => {
    const ai = PAYOUT_UI_DISPLAY_ORDER.indexOf((a.uiKey || '') as typeof PAYOUT_UI_DISPLAY_ORDER[number])
    const bi = PAYOUT_UI_DISPLAY_ORDER.indexOf((b.uiKey || '') as typeof PAYOUT_UI_DISPLAY_ORDER[number])
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
}

/** UI keys whose payment flow routes directly P2P (no platform processing fee). */
export const DIRECT_P2P_UI_KEYS = new Set<string>([
  PayoutUiKey.Zelle,
  PayoutUiKey.Venmo,
  PayoutUiKey.CashApp,
  PayoutUiKey.AppleCash,
  PayoutUiKey.VlinkPay,
])

/**
 * Returns true when the given raw API paymentMethod string (e.g. "CashApp",
 * "Venmo") maps to a direct P2P method.
 */
export function isDirectP2pMethod(apiType: string): boolean {
  return DIRECT_P2P_UI_KEYS.has(payoutTypeToUiKey(apiType))
}

/** UI keys whose PUT payment-methods payload carries an editable accountName. */
export const ACCOUNT_NAME_UI_KEYS = new Set<string>([
  PayoutUiKey.Zelle,
  PayoutUiKey.Venmo,
  PayoutUiKey.CashApp,
  PayoutUiKey.PayPal,
  PayoutUiKey.AppleCash,
])

export function supportsPayoutAccountName(uiKey = ''): boolean {
  return ACCOUNT_NAME_UI_KEYS.has(uiKey)
}

/**
 * Builds the accountName value for a PUT payment-methods payload.
 * Unsupported methods return undefined so the key is omitted from the JSON
 * body entirely; supported methods always send a trimmed name or null (clear).
 */
export function toPayoutAccountNameDto(
  uiKey: string,
  raw?: string | null,
): string | null | undefined {
  if (!supportsPayoutAccountName(uiKey)) return undefined
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  return trimmed || null
}

/**
 * Returns the human-readable display label for a raw API paymentMethod
 * string. Falls back to the original string when there is no mapping.
 */
export function getPaymentMethodDisplayName(apiType: string): string {
  const uiKey = payoutTypeToUiKey(apiType)
  return PAYOUT_UI_LABELS[uiKey] ?? apiType
}

/**
 * Whether a payment method has enough account data to be considered set up.
 * Prefer BE `isConfigured`; for VlinkPay also accept cryptoAddresses (US-98).
 */
export function isPaymentMethodConfigured(method?: {
  uiKey?: string
  type?: string
  isConfigured?: boolean
  accountInfo?: string | null
  cryptoAddresses?: Array<{ network?: string; symbol?: string; address?: string }> | null
} | null): boolean {
  if (!method) return false
  if (method.isConfigured) return true

  const uiKey = method.uiKey || payoutTypeToUiKey(method.type || '')
  if (uiKey === PayoutUiKey.VlinkPay) {
    return hasAtLeastOneVlinkpayAddress(parseVlinkpayAddressesFromMethod(method))
  }

  return Boolean(String(method.accountInfo || '').trim())
}
