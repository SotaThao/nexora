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

export const VLINKPAY_COIN_NAME = {
  [VlinkpayCoin.Usdv]: 'USD VLINK',
  [VlinkpayCoin.Usdt]: 'USD Tether',
} as const

/** Shared input class for VLINKPAY wallet-address fields (mobile compact override in index.css). */
export const VLINKPAY_ADDRESS_INPUT_CLASS =
  'vlinkpay-address-input h-8 w-full rounded-lg border bg-white px-2.5 font-sans text-[11px] text-slate-800 outline-none transition placeholder:text-[11px] placeholder:text-slate-400 focus:border-[#3657db] focus:ring-2 focus:ring-[#3657db]/15 sm:h-9'

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
    name: VLINKPAY_COIN_NAME[VlinkpayCoin.Usdv],
    symbol: VLINKPAY_SYMBOL[VlinkpayCoin.Usdv],
    asset: VLINKPAY_COIN_ASSET[VlinkpayCoin.Usdv],
  },
  {
    key: VlinkpayCoin.Usdt,
    name: VLINKPAY_COIN_NAME[VlinkpayCoin.Usdt],
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
  imageUrl?: string | null
}

/** UI map of per-coin QR image preview (data/blob/remote URL, or '' when none). */
export type VlinkpayImages = {
  [VlinkpayCoin.Usdv]: string
  [VlinkpayCoin.Usdt]: string
}

/** Per-coin QR image pending upload — a picked File takes precedence over an existing url. */
export type VlinkpayImagePendingMap = Partial<
  Record<VlinkpayCoinKey, { file?: File | null; url?: string | null }>
>

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

const EMPTY_IMAGES: VlinkpayImages = {
  [VlinkpayCoin.Usdv]: '',
  [VlinkpayCoin.Usdt]: '',
}

export function emptyVlinkpayImages(): VlinkpayImages {
  return { ...EMPTY_IMAGES }
}

/** Wallet addresses are a single token — strip all whitespace (typed, pasted, or stored). */
export function stripVlinkpayWalletAddressInput(value?: string | null): string {
  return String(value || '').replace(/\s+/g, '')
}

/** Reject page URLs / empty junk that must never be treated as a crypto receive address. */
export function isPlausibleVlinkpayWalletAddress(value?: string | null): boolean {
  const raw = stripVlinkpayWalletAddressInput(value)
  if (!raw) return false
  if (/^https?:\/\//i.test(raw)) return false
  if (raw.length > VLINKPAY_ADDRESS_MAX_LENGTH) return false
  return true
}

function sanitizeAddress(value?: string | null): string {
  const raw = stripVlinkpayWalletAddressInput(value)
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

  // Display strings like "USDV 0xabc · USDT 0xdef" contain spaces by design.
  if (/^(USDV|USDT)\b/i.test(raw) || raw.includes('·')) return emptyVlinkpayAddresses()

  const address = sanitizeAddress(raw)
  if (!address) return emptyVlinkpayAddresses()
  return { [VlinkpayCoin.Usdv]: address, [VlinkpayCoin.Usdt]: '' }
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

/** Parse BE cryptoAddresses[] into a per-coin QR image URL map (no legacy fallback — new field). */
export function parseVlinkpayCryptoAddressImages(
  cryptoAddresses?: Array<{ symbol?: string; imageUrl?: string | null }> | null,
): VlinkpayImages {
  const next = emptyVlinkpayImages()
  if (!Array.isArray(cryptoAddresses)) return next

  for (const entry of cryptoAddresses) {
    const symbol = String(entry?.symbol || '').trim().toUpperCase()
    const coin = SYMBOL_TO_COIN[symbol]
    if (!coin) continue
    next[coin] = String(entry?.imageUrl || '').trim()
  }
  return next
}

export function parseVlinkpayImagesFromMethod(method?: {
  cryptoAddresses?: Array<{ symbol?: string; imageUrl?: string | null }> | null
} | null): VlinkpayImages {
  if (!method) return emptyVlinkpayImages()
  return parseVlinkpayCryptoAddressImages(method.cryptoAddresses)
}

/** Build the cryptoAddressImages payload (keyed by coin symbol) for the update mutation. */
export function toVlinkpayCryptoAddressImagesPayload(
  pending: VlinkpayImagePendingMap,
): Record<string, { file?: File | null; url?: string | null }> {
  const payload: Record<string, { file?: File | null; url?: string | null }> = {}
  for (const coin of VLINKPAY_COINS) {
    const entry = pending[coin.key]
    if (!entry) continue
    payload[coin.symbol] = entry
  }
  return payload
}

/** Build PUT body cryptoAddresses — only non-empty addresses. */
export function toVlinkpayCryptoAddressesPayload(
  addresses: VlinkpayAddresses,
): VlinkpayCryptoAddressDto[] {
  const payload: VlinkpayCryptoAddressDto[] = []
  for (const coin of VLINKPAY_COINS) {
    const address = sanitizeAddress(addresses[coin.key])
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
  if (!hasAtLeastOneVlinkpayAddress(addresses)) return ''
  return JSON.stringify({
    [VlinkpayCoin.Usdv]: sanitizeAddress(addresses[VlinkpayCoin.Usdv]),
    [VlinkpayCoin.Usdt]: sanitizeAddress(addresses[VlinkpayCoin.Usdt]),
  })
}

export function hasAtLeastOneVlinkpayAddress(addresses: VlinkpayAddresses): boolean {
  return Boolean(
    stripVlinkpayWalletAddressInput(addresses[VlinkpayCoin.Usdv])
    || stripVlinkpayWalletAddressInput(addresses[VlinkpayCoin.Usdt]),
  )
}

/** True when a draft/saved VlinkPay payout `value` string has at least one address. */
export function isVlinkpayPayoutValueConfigured(value?: string | null): boolean {
  const trimmed = String(value || '').trim()
  if (!trimmed) return false
  return hasAtLeastOneVlinkpayAddress(parseVlinkpayAddresses(trimmed))
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
    [VlinkpayCoin.Usdv]:
      sources.map((source) => sanitizeAddress(source[VlinkpayCoin.Usdv])).find(Boolean) || '',
    [VlinkpayCoin.Usdt]:
      sources.map((source) => sanitizeAddress(source[VlinkpayCoin.Usdt])).find(Boolean) || '',
  }
}

/** First source that has a QR image for each coin wins (US-1488). */
export function mergeVlinkpayImages(...sources: VlinkpayImages[]): VlinkpayImages {
  return {
    [VlinkpayCoin.Usdv]:
      sources.map((source) => String(source[VlinkpayCoin.Usdv] || '').trim()).find(Boolean) || '',
    [VlinkpayCoin.Usdt]:
      sources.map((source) => String(source[VlinkpayCoin.Usdt] || '').trim()).find(Boolean) || '',
  }
}

/**
 * Prefer the primary source when it has any address.
 * Useful for single-staff flows where staff config should override business fallback.
 */
export function resolvePreferredVlinkpayAddresses(
  primary: VlinkpayAddresses,
  ...fallbacks: VlinkpayAddresses[]
): VlinkpayAddresses {
  if (hasAtLeastOneVlinkpayAddress(primary)) return primary
  return mergeVlinkpayAddresses(...fallbacks)
}

export function firstAvailableVlinkpayCoin(addresses: VlinkpayAddresses): VlinkpayCoinKey | null {
  const coin = listAvailableVlinkpayCoins(addresses)[0]
  return coin?.key ?? null
}

export function listAvailableVlinkpayCoins(addresses: VlinkpayAddresses) {
  return VLINKPAY_COINS.filter((coin) => sanitizeAddress(addresses[coin.key]))
}

/** The sole configured coin when count === 1; otherwise null. */
export function getSingleConfiguredVlinkpayCoin(addresses: VlinkpayAddresses) {
  const coins = listAvailableVlinkpayCoins(addresses)
  return coins.length === 1 ? coins[0] : null
}

/** Normalize wire/UI crypto symbol to uppercase display form. */
export function normalizeVlinkpayCryptoSymbol(symbol?: string | null): string {
  return String(symbol || '').trim().toUpperCase()
}

export function getVlinkpayCoinBySymbol(symbol?: string | null) {
  const key = SYMBOL_TO_COIN[normalizeVlinkpayCryptoSymbol(symbol)]
  if (!key) return null
  return VLINKPAY_COINS.find((coin) => coin.key === key) ?? null
}

/** Merge crypto symbol onto a selected wallet object for success/VIA display. */
export function withWalletCryptoSymbol<T extends Record<string, unknown>>(
  wallet: T | null | undefined,
  cryptoSymbol?: string | null,
): T | null {
  if (!wallet) return null
  const normalized = normalizeVlinkpayCryptoSymbol(cryptoSymbol)
  if (!normalized) {
    const next = { ...wallet }
    delete (next as { cryptoSymbol?: string }).cryptoSymbol
    return next
  }
  return { ...wallet, cryptoSymbol: normalized }
}

/** Success-screen VIA label, e.g. `VLINKPAY · USDV (VRC20)`. */
export function formatVlinkpayViaLabel(symbol?: string | null): string {
  const normalized = normalizeVlinkpayCryptoSymbol(symbol)
  if (!normalized) return VLINKPAY_BRAND
  return `${VLINKPAY_BRAND} · ${normalized} (${VLINKPAY_NETWORK})`
}

export function formatVlinkpayAccountDisplay(value?: string | null): string {
  return formatVlinkpayAddressesDisplay(parseVlinkpayAddresses(value))
}

export function parsePaymentCryptoWallet(raw: unknown): VlinkpayCryptoAddressDto | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>
  const network = String(source.network ?? source.Network ?? '').trim()
  const symbol = String(source.symbol ?? source.Symbol ?? '').trim()
  const address = stripVlinkpayWalletAddressInput(source.address ?? source.Address)
  if (!network && !symbol && !address) return null
  return { network, symbol, address }
}

export function formatVlinkpayCryptoWalletDisplay(
  wallet?: Pick<VlinkpayCryptoAddressDto, 'symbol' | 'address'> | null,
): string {
  const address = stripVlinkpayWalletAddressInput(wallet?.address)
  if (!address) return ''
  const symbol = normalizeVlinkpayCryptoSymbol(wallet?.symbol)
  return symbol ? `${symbol} ${address}` : address
}

/** Account shown on payment detail: VlinkPay uses cryptoWallet; others use accountInfo. */
export function resolveDirectPaymentAccountDisplay(payment?: {
  accountInfo?: string | null
  cryptoWallet?: Pick<VlinkpayCryptoAddressDto, 'symbol' | 'address'> | null
} | null): string {
  return formatVlinkpayCryptoWalletDisplay(payment?.cryptoWallet) || String(payment?.accountInfo || '').trim()
}

export function formatVlinkpayAddressesDisplay(addresses: VlinkpayAddresses): string {
  const parts = VLINKPAY_COINS
    .map((coin) => {
      const address = sanitizeAddress(addresses[coin.key])
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

/** True when at least one USDV/USDT address is present. */
export function isVlinkpayMethodConfigured(method?: {
  isConfigured?: boolean
  accountInfo?: string | null
  cryptoAddresses?: Array<{ network?: string; symbol?: string; address?: string }> | null
} | null): boolean {
  if (!method) return false
  return hasAtLeastOneVlinkpayAddress(parseVlinkpayAddressesFromMethod(method))
}

/** Client-side address length guard matching BE max length. */
export function getVlinkpayAddressValidationError(
  addresses: VlinkpayAddresses,
): 'required' | 'vlinkpay_address_invalid' | '' {
  if (!hasAtLeastOneVlinkpayAddress(addresses)) return 'required'
  for (const coin of VLINKPAY_COINS) {
    const address = stripVlinkpayWalletAddressInput(addresses[coin.key])
    if (address && !isPlausibleVlinkpayWalletAddress(address)) {
      return 'vlinkpay_address_invalid'
    }
  }
  return ''
}
