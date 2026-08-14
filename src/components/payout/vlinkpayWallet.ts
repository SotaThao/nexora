import { PayoutUiKey } from '../../data/payoutUiKeys'

export const VLINKPAY_BRAND = 'VLINKPAY' as const
export const VLINKPAY_WALLET_LABEL = 'VLINKPAY Wallet' as const
export const VLINKPAY_UI_KEY = PayoutUiKey.VlinkPay

export const VlinkpayCoin = {
  Usdv: 'usdv',
  Usdt: 'usdt',
} as const

export type VlinkpayCoinKey = (typeof VlinkpayCoin)[keyof typeof VlinkpayCoin]

export const VLINKPAY_NETWORK = 'VRC20' as const

/** BE crypto address max length (US-98 / CryptoPaymentConstants.ADDRESS_MAX_LENGTH). */
export const VLINKPAY_ADDRESS_MAX_LENGTH = 128

export const VLINKPAY_SYMBOL = {
  [VlinkpayCoin.Usdv]: 'USDV',
  [VlinkpayCoin.Usdt]: 'USDT',
} as const

/** Wire value for create-payment / tip `cryptoSymbol` (BE example: "usdv"). */
export function toVlinkpayCryptoSymbolWire(symbol?: string | null): string {
  return String(symbol || '').trim().toLowerCase()
}

export const VLINKPAY_COIN_ASSET = {
  [VlinkpayCoin.Usdv]: '/assets/sms-credits/usdv.png',
  [VlinkpayCoin.Usdt]: '/assets/sms-credits/usdt.png',
} as const

export const VLINKPAY_COINS = [
  {
    key: VlinkpayCoin.Usdv,
    name: 'USD VLINK',
    symbol: VLINKPAY_SYMBOL[VlinkpayCoin.Usdv],
    asset: VLINKPAY_COIN_ASSET[VlinkpayCoin.Usdv],
  },
  {
    key: VlinkpayCoin.Usdt,
    name: 'Tether USD',
    symbol: VLINKPAY_SYMBOL[VlinkpayCoin.Usdt],
    asset: VLINKPAY_COIN_ASSET[VlinkpayCoin.Usdt],
  },
] as const

export type VlinkpayAddresses = {
  [VlinkpayCoin.Usdv]: string
  [VlinkpayCoin.Usdt]: string
}

/** Wire shape for PUT/GET payment-methods cryptoAddresses (US-98). */
export type VlinkpayCryptoAddressDto = {
  network: string
  symbol: string
  address: string
}

const EMPTY_ADDRESSES: VlinkpayAddresses = {
  [VlinkpayCoin.Usdv]: '',
  [VlinkpayCoin.Usdt]: '',
}

const SYMBOL_TO_COIN: Record<string, VlinkpayCoinKey> = {
  [VLINKPAY_SYMBOL[VlinkpayCoin.Usdv]]: VlinkpayCoin.Usdv,
  [VLINKPAY_SYMBOL[VlinkpayCoin.Usdt]]: VlinkpayCoin.Usdt,
}

export function emptyVlinkpayAddresses(): VlinkpayAddresses {
  return { ...EMPTY_ADDRESSES }
}

/** Reject page URLs / empty junk that must never be treated as a crypto receive address. */
export function isPlausibleVlinkpayWalletAddress(value?: string | null): boolean {
  const raw = String(value || '').trim()
  if (!raw) return false
  if (/^https?:\/\//i.test(raw)) return false
  if (/\s/.test(raw)) return false
  if (raw.length > VLINKPAY_ADDRESS_MAX_LENGTH) return false
  return true
}

function sanitizeAddress(value?: string | null): string {
  const raw = String(value || '').trim()
  return isPlausibleVlinkpayWalletAddress(raw) ? raw : ''
}

/** Parse legacy FE accountInfo JSON / plain string into UI address map. */
export function parseVlinkpayAddresses(value?: string | null): VlinkpayAddresses {
  const raw = String(value || '').trim()
  if (!raw) return emptyVlinkpayAddresses()

  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        [VlinkpayCoin.Usdv]: sanitizeAddress(parsed[VlinkpayCoin.Usdv]),
        [VlinkpayCoin.Usdt]: sanitizeAddress(parsed[VlinkpayCoin.Usdt]),
      }
    }
  } catch {
    // Legacy single-string accountInfo — keep it on USDV when it looks like a wallet address.
  }

  if (!isPlausibleVlinkpayWalletAddress(raw)) return emptyVlinkpayAddresses()
  return { [VlinkpayCoin.Usdv]: raw, [VlinkpayCoin.Usdt]: '' }
}

/** Parse BE cryptoAddresses[] into UI address map. */
export function parseVlinkpayCryptoAddresses(
  cryptoAddresses?: Array<{ network?: string; symbol?: string; address?: string }> | null,
): VlinkpayAddresses {
  const next = emptyVlinkpayAddresses()
  if (!Array.isArray(cryptoAddresses)) return next

  for (const entry of cryptoAddresses) {
    const symbol = String(entry?.symbol || '').trim().toUpperCase()
    const coin = SYMBOL_TO_COIN[symbol]
    if (!coin) continue
    const address = sanitizeAddress(entry?.address)
    if (!address) continue
    next[coin] = address
  }
  return next
}

/**
 * Prefer cryptoAddresses from API; fall back to legacy accountInfo JSON/string
 * so older rows / drafts still open correctly in the editor.
 */
export function parseVlinkpayAddressesFromMethod(method?: {
  accountInfo?: string | null
  cryptoAddresses?: Array<{ network?: string; symbol?: string; address?: string }> | null
} | null): VlinkpayAddresses {
  if (!method) return emptyVlinkpayAddresses()
  if (Array.isArray(method.cryptoAddresses) && method.cryptoAddresses.length > 0) {
    return parseVlinkpayCryptoAddresses(method.cryptoAddresses)
  }
  return parseVlinkpayAddresses(method.accountInfo)
}

/** Build PUT body cryptoAddresses — only non-empty addresses. */
export function toVlinkpayCryptoAddressesPayload(
  addresses: VlinkpayAddresses,
): VlinkpayCryptoAddressDto[] {
  const payload: VlinkpayCryptoAddressDto[] = []
  for (const coin of VLINKPAY_COINS) {
    const address = addresses[coin.key].trim()
    if (!address) continue
    payload.push({
      network: VLINKPAY_NETWORK,
      symbol: coin.symbol,
      address,
    })
  }
  return payload
}

/** @deprecated Prefer toVlinkpayCryptoAddressesPayload for API writes. */
export function serializeVlinkpayAddresses(addresses: VlinkpayAddresses): string {
  return JSON.stringify({
    [VlinkpayCoin.Usdv]: addresses[VlinkpayCoin.Usdv].trim(),
    [VlinkpayCoin.Usdt]: addresses[VlinkpayCoin.Usdt].trim(),
  })
}

export function hasAtLeastOneVlinkpayAddress(addresses: VlinkpayAddresses): boolean {
  return Boolean(addresses[VlinkpayCoin.Usdv].trim() || addresses[VlinkpayCoin.Usdt].trim())
}

/**
 * Parse flattened display strings like "USDV 0xabc · USDT 0xdef"
 * (used when only paymentAccounts display text is available).
 */
export function parseVlinkpayFormattedDisplay(value?: string | null): VlinkpayAddresses {
  const next = emptyVlinkpayAddresses()
  const raw = String(value || '').trim()
  if (!raw) return next

  const re = /(USDV|USDT)\s+([^\s·]+)/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(raw)) !== null) {
    const coin = SYMBOL_TO_COIN[match[1].toUpperCase()]
    if (!coin) continue
    const address = sanitizeAddress(match[2])
    if (!address) continue
    next[coin] = address
  }
  return next
}

/** Prefer cryptoAddresses → JSON accountInfo → flattened display string. */
export function resolveVlinkpayAddresses(methodOrValue?: {
  accountInfo?: string | null
  cryptoAddresses?: VlinkpayCryptoAddressDto[] | null
} | string | null): VlinkpayAddresses {
  if (typeof methodOrValue === 'string') {
    const fromJson = parseVlinkpayAddresses(methodOrValue)
    if (hasAtLeastOneVlinkpayAddress(fromJson) && methodOrValue.trim().startsWith('{')) {
      return fromJson
    }
    const fromDisplay = parseVlinkpayFormattedDisplay(methodOrValue)
    if (hasAtLeastOneVlinkpayAddress(fromDisplay)) return fromDisplay
    return fromJson
  }
  const fromMethod = parseVlinkpayAddressesFromMethod(methodOrValue)
  if (hasAtLeastOneVlinkpayAddress(fromMethod)) return fromMethod
  return parseVlinkpayFormattedDisplay(methodOrValue?.accountInfo)
}

/** First source that has an address for each coin wins. */
export function mergeVlinkpayAddresses(...sources: VlinkpayAddresses[]): VlinkpayAddresses {
  return {
    [VlinkpayCoin.Usdv]: sources.map((source) => source[VlinkpayCoin.Usdv].trim()).find(Boolean) || '',
    [VlinkpayCoin.Usdt]: sources.map((source) => source[VlinkpayCoin.Usdt].trim()).find(Boolean) || '',
  }
}

export function firstAvailableVlinkpayCoin(addresses: VlinkpayAddresses): VlinkpayCoinKey | null {
  const coin = VLINKPAY_COINS.find((item) => addresses[item.key].trim())
  return coin?.key ?? null
}

export function formatVlinkpayAccountDisplay(value?: string | null): string {
  return formatVlinkpayAddressesDisplay(parseVlinkpayAddresses(value))
}

export function formatVlinkpayAddressesDisplay(addresses: VlinkpayAddresses): string {
  const parts = VLINKPAY_COINS
    .map((coin) => {
      const address = addresses[coin.key].trim()
      return address ? `${coin.symbol} ${address}` : ''
    })
    .filter(Boolean)
  return parts.join(' · ')
}

export function formatVlinkpayMethodDisplay(method?: {
  accountInfo?: string | null
  cryptoAddresses?: VlinkpayCryptoAddressDto[] | null
} | null): string {
  return formatVlinkpayAddressesDisplay(parseVlinkpayAddressesFromMethod(method))
}

/** True when BE marks configured OR at least one crypto address is present. */
export function isVlinkpayMethodConfigured(method?: {
  isConfigured?: boolean
  accountInfo?: string | null
  cryptoAddresses?: VlinkpayCryptoAddressDto[] | null
} | null): boolean {
  if (!method) return false
  if (method.isConfigured) return true
  return hasAtLeastOneVlinkpayAddress(parseVlinkpayAddressesFromMethod(method))
}

/** Client-side address length guard matching BE max length. */
export function getVlinkpayAddressValidationError(
  addresses: VlinkpayAddresses,
): 'required' | 'vlinkpay_address_invalid' | '' {
  if (!hasAtLeastOneVlinkpayAddress(addresses)) return 'required'
  for (const coin of VLINKPAY_COINS) {
    const address = addresses[coin.key].trim()
    if (address && address.length > VLINKPAY_ADDRESS_MAX_LENGTH) {
      return 'vlinkpay_address_invalid'
    }
  }
  return ''
}
