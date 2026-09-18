import type { PaymentMethodCryptoAddressDto, PaymentMethodDto } from '../../types/domain'
import { PAYOUT_UI_LABELS, isPaymentMethodConfigured, payoutTypeToUiKey } from '../paymentMethodTypes'
import { VLINKPAY_NETWORK } from '../../components/payout/vlinkpayWallet'

/** Shared PUT body for merchant / staff / local-staff payment-methods. */
export interface UpdatePaymentMethodDto {
  accountInfo?: string | null
  accountName?: string | null
  imageUrl?: string | null
  /** VlinkPay only (US-98). */
  cryptoAddresses?: PaymentMethodCryptoAddressDto[] | null
}

export type PaymentMethodApiDtoLike = {
  id?: string
  type?: string
  accountInfo?: string | null
  accountName?: string | null
  imageUrl?: string | null
  isActive?: boolean
  isConfigured?: boolean
  businessKybStatus?: string | null
  name?: string
  cryptoAddresses?: Array<{ network?: string; symbol?: string; address?: string; imageUrl?: string | null }> | null
}

type CryptoAddressRaw = {
  network?: string
  symbol?: string
  address?: string
  imageUrl?: string | null
  cryptoNetwork?: string
  cryptoSymbol?: string
  cryptoAddress?: string
  CryptoNetwork?: string
  CryptoSymbol?: string
  CryptoAddress?: string
  ImageUrl?: string | null
}

/** Keep address+symbol even when BE omits network (defaults to VRC20). */
export function normalizeCryptoAddresses(
  raw?: Array<CryptoAddressRaw> | CryptoAddressRaw | null,
): PaymentMethodCryptoAddressDto[] | null {
  const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : null
  if (!list) return null
  const mapped = list
    .map((entry) => {
      const network = String(
        entry?.network || entry?.cryptoNetwork || entry?.CryptoNetwork || VLINKPAY_NETWORK,
      ).trim()
      const symbol = String(
        entry?.symbol || entry?.cryptoSymbol || entry?.CryptoSymbol || '',
      )
        .trim()
        .toUpperCase()
      const address = String(
        entry?.address || entry?.cryptoAddress || entry?.CryptoAddress || '',
      ).trim()
      const imageUrl = String(entry?.imageUrl || entry?.ImageUrl || '').trim() || null
      return { network, symbol, address, imageUrl }
    })
    .filter((entry) => entry.symbol && entry.address)
  return mapped.length ? mapped : null
}

/** Normalize merchant/staff/public payment-method rows, including US-98 cryptoAddresses. */
export function normalizePaymentMethodDto(dto: PaymentMethodApiDtoLike): PaymentMethodDto {
  const type = dto.type || ''
  const uiKey = payoutTypeToUiKey(type)
  const dtoWithAliases = dto as PaymentMethodApiDtoLike & {
    CryptoAddresses?: PaymentMethodApiDtoLike['cryptoAddresses']
    cryptoAddress?: string
    cryptoSymbol?: string
    cryptoNetwork?: string
  }
  const nestedList = dtoWithAliases.cryptoAddresses ?? dtoWithAliases.CryptoAddresses
  const topLevelAddress = dtoWithAliases.cryptoAddress
  const topLevelSymbol = dtoWithAliases.cryptoSymbol
  const cryptoAddresses = normalizeCryptoAddresses(
    Array.isArray(nestedList) && nestedList.length
      ? nestedList
      : topLevelAddress && topLevelSymbol
        ? [{
            network: dtoWithAliases.cryptoNetwork,
            symbol: topLevelSymbol,
            address: topLevelAddress,
          }]
        : nestedList,
  )
  const normalized: PaymentMethodDto = {
    id: dto.id,
    type,
    uiKey,
    name: PAYOUT_UI_LABELS[uiKey] || dto.name || type,
    accountInfo: dto.accountInfo ?? null,
    accountName: dto.accountName ?? null,
    imageUrl: dto.imageUrl ?? null,
    cryptoAddresses,
    // Public payment-method payloads often omit isActive — treat missing as active.
    isActive: dto.isActive !== false,
    isConfigured: Boolean(dto.isConfigured),
    businessKybStatus: dto.businessKybStatus ?? null,
  }
  normalized.isConfigured = isPaymentMethodConfigured(normalized)
  return normalized
}
