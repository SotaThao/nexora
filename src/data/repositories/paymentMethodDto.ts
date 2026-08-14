import type { PaymentMethodCryptoAddressDto, PaymentMethodDto } from '../../types/domain'
import { PAYOUT_UI_LABELS, isPaymentMethodConfigured, payoutTypeToUiKey } from '../paymentMethodTypes'

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
  cryptoAddresses?: Array<{ network?: string; symbol?: string; address?: string }> | null
}

export function normalizeCryptoAddresses(
  raw?: Array<{ network?: string; symbol?: string; address?: string }> | null,
): PaymentMethodCryptoAddressDto[] | null {
  if (!Array.isArray(raw)) return null
  return raw
    .map((entry) => ({
      network: String(entry?.network || '').trim(),
      symbol: String(entry?.symbol || '').trim().toUpperCase(),
      address: String(entry?.address || '').trim(),
    }))
    .filter((entry) => entry.network && entry.symbol && entry.address)
}

/** Normalize merchant/staff/public payment-method rows, including US-98 cryptoAddresses. */
export function normalizePaymentMethodDto(dto: PaymentMethodApiDtoLike): PaymentMethodDto {
  const type = dto.type || ''
  const uiKey = payoutTypeToUiKey(type)
  const cryptoAddresses = normalizeCryptoAddresses(
    dto.cryptoAddresses ??
      (dto as PaymentMethodApiDtoLike & { CryptoAddresses?: PaymentMethodApiDtoLike['cryptoAddresses'] })
        .CryptoAddresses,
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
  if (!normalized.isConfigured) {
    normalized.isConfigured = isPaymentMethodConfigured(normalized)
  }
  return normalized
}
