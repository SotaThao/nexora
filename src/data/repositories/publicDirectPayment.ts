import httpClient from '../../lib/httpClient'
import { payoutTypeToUiKey } from '../paymentMethodTypes'
import { VLINKPAY_NETWORK, toVlinkpayCryptoSymbolWire } from '../../components/payout/vlinkpayWallet'
import type {
  CreateDirectPaymentResult,
  DirectPaymentStatusSnapshot,
  PublicDirectPaymentMethod,
  PublicDirectPaymentPage,
} from '../../types/domain'
import { PaymentType } from '../../types/domain'
import { normalizePaymentStatusValue } from '../../utils/directPaymentStatus'
import { normalizeCryptoAddresses } from './paymentMethodDto'
import { toTipConstraints, toTipStaffList } from './tipStaffDto'

type HttpClient = typeof httpClient

function readField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  return (raw[camel] ?? raw[pascal]) as T | undefined
}

export function normalizePublicPaymentMethod(
  raw: Record<string, unknown> | null | undefined,
): PublicDirectPaymentMethod | null {
  if (!raw) return null
  const id = readField<string>(raw, 'id', 'Id') ?? ''
  const type = readField<string>(raw, 'type', 'Type') ?? ''
  const accountInfo = readField<string>(raw, 'accountInfo', 'AccountInfo') ?? ''
  const listedAddresses = normalizeCryptoAddresses(
    (raw.cryptoAddresses ?? raw.CryptoAddresses) as
      | Array<{ network?: string; symbol?: string; address?: string }>
      | null
      | undefined,
  )
  const selectedAddress = String(
    readField<string>(raw, 'cryptoAddress', 'CryptoAddress') || '',
  ).trim()
  const selectedSymbol = String(
    readField<string>(raw, 'cryptoSymbol', 'CryptoSymbol') || '',
  ).trim()
  const selectedNetwork = String(
    readField<string>(raw, 'cryptoNetwork', 'CryptoNetwork') || '',
  ).trim() || VLINKPAY_NETWORK
  const selectedRow = selectedAddress && selectedSymbol
    ? normalizeCryptoAddresses([{
        network: selectedNetwork,
        symbol: selectedSymbol,
        address: selectedAddress,
      }])
    : null
  const cryptoAddresses = selectedRow?.length ? selectedRow : listedAddresses
  const hasCrypto = Boolean(cryptoAddresses?.length)
  if (!id || !type || (!accountInfo.trim() && !hasCrypto)) return null

  return {
    id,
    type,
    uiKey: payoutTypeToUiKey(type),
    accountInfo,
    accountName: readField<string | null>(raw, 'accountName', 'AccountName') ?? null,
    imageUrl: readField<string | null>(raw, 'imageUrl', 'ImageUrl') ?? null,
    cryptoAddresses,
  }
}

function normalizePaymentPage(raw: Record<string, unknown> | null | undefined): PublicDirectPaymentPage {
  const source = raw ?? {}
  const methodsRaw = (source.paymentMethods ?? source.PaymentMethods ?? []) as Record<string, unknown>[]
  const paymentMethods = methodsRaw
    .map((item) => normalizePublicPaymentMethod(item))
    .filter((item): item is PublicDirectPaymentMethod => Boolean(item))

  const touchPoint = (source.touchPoint ?? source.TouchPoint) as Record<string, unknown> | undefined

  return {
    businessId: readField<string>(source, 'businessId', 'BusinessId') ?? '',
    businessName: readField<string>(source, 'businessName', 'BusinessName') ?? '',
    logoUrl: readField<string | null>(source, 'logoUrl', 'LogoUrl') ?? null,
    paymentUrl: readField<string>(source, 'paymentUrl', 'PaymentUrl') ?? '',
    paymentMethods,
    // Tip block — present once BE extends the payment page DTO (US-045).
    touchPointId: (touchPoint ? readField<string>(touchPoint, 'id', 'Id') : undefined)
      ?? readField<string>(source, 'touchPointId', 'TouchPointId')
      ?? null,
    // Slugs let the page load staff from the touch endpoint without a QR redirect.
    businessSlug: readField<string>(source, 'businessSlug', 'BusinessSlug') ?? null,
    touchPointSlug: (touchPoint ? readField<string>(touchPoint, 'slug', 'Slug') : undefined)
      ?? readField<string>(source, 'touchPointSlug', 'TouchPointSlug')
      ?? null,
    staff: toTipStaffList(source),
    tipConstraints: toTipConstraints(source),
  }
}

function normalizeCreatePaymentResult(raw: Record<string, unknown> | null | undefined): CreateDirectPaymentResult {
  const source = raw ?? {}
  const paymentMethodSource = (source.paymentMethod ?? source.PaymentMethod) as Record<string, unknown> | undefined
  const paymentMethod = normalizePublicPaymentMethod(paymentMethodSource)

  return {
    paymentId: readField<string>(source, 'paymentId', 'PaymentId')
      ?? readField<string>(source, 'id', 'Id')
      ?? '',
    amount: Number(readField<number>(source, 'amount', 'Amount') ?? 0),
    type: Number(readField<number>(source, 'type', 'Type') ?? 0),
    paymentMethod: paymentMethod || {
      id: '',
      type: '',
      accountInfo: '',
      accountName: null,
      imageUrl: null,
      cryptoAddresses: null,
    },
  }
}

export { normalizeCreatePaymentResult }

function normalizePaymentType(value: unknown): number {
  if (value === 'StaffDirectPayment' || value === 1 || value === '1') return PaymentType.StaffDirectPayment
  if (value === 'DirectPayment' || value === 0 || value === '0') return PaymentType.DirectPayment
  const num = Number(value)
  if (num === PaymentType.StaffDirectPayment || num === PaymentType.DirectPayment) return num
  return PaymentType.DirectPayment
}

function normalizePaymentStatusSnapshot(
  raw: Record<string, unknown> | null | undefined,
): DirectPaymentStatusSnapshot | null {
  if (!raw) return null
  const paymentId = readField<string>(raw, 'paymentId', 'PaymentId') ?? readField<string>(raw, 'id', 'Id') ?? ''
  if (!paymentId) return null

  return {
    paymentId,
    status: normalizePaymentStatusValue(readField<number | string>(raw, 'status', 'Status')),
    type: normalizePaymentType(readField<number | string>(raw, 'type', 'Type')),
    amount: Number(readField<number>(raw, 'amount', 'Amount') ?? 0),
    createdAt: readField<string>(raw, 'createdAt', 'CreatedAt') ?? '',
    customerConfirmedAt: readField<string | null>(raw, 'customerConfirmedAt', 'CustomerConfirmedAt') ?? null,
    merchantConfirmedAt: readField<string | null>(raw, 'merchantConfirmedAt', 'MerchantConfirmedAt') ?? null,
  }
}

export function createPublicDirectPaymentRepository(client: HttpClient = httpClient) {
  return {
    async getPaymentPage(businessId: string): Promise<PublicDirectPaymentPage> {
      const res = await client.get<Record<string, unknown>>(
        `/api/v1/public/merchant/${encodeURIComponent(businessId)}/payment`,
        { anonymous: true },
      )
      return normalizePaymentPage(res)
    },

    async createPayment(
      businessId: string,
      payload: { businessPaymentMethodId: string; amount: number; cryptoSymbol?: string },
    ): Promise<CreateDirectPaymentResult> {
      const body: Record<string, unknown> = {
        businessPaymentMethodId: payload.businessPaymentMethodId,
        amount: payload.amount,
      }
      const cryptoSymbol = toVlinkpayCryptoSymbolWire(payload.cryptoSymbol)
      if (cryptoSymbol) body.cryptoSymbol = cryptoSymbol
      const res = await client.post<Record<string, unknown>>(
        `/api/v1/public/merchant/${encodeURIComponent(businessId)}/payments`,
        body,
        { anonymous: true },
      )
      return normalizeCreatePaymentResult(res)
    },

    async confirmPayment(paymentId: string): Promise<void> {
      await client.patch<void>(
        `/api/v1/public/payments/${encodeURIComponent(paymentId)}/confirm`,
        {},
        { anonymous: true },
      )
    },

    async getPaymentStatus(paymentId: string): Promise<DirectPaymentStatusSnapshot> {
      const res = await client.get<Record<string, unknown>>(
        `/api/v1/public/payments/${encodeURIComponent(paymentId)}/status`,
        { anonymous: true },
      )
      const snapshot = normalizePaymentStatusSnapshot(res)
      if (!snapshot) {
        throw new Error('PAYMENT_NOT_FOUND')
      }
      return snapshot
    },
  }
}

export const publicDirectPaymentRepository = createPublicDirectPaymentRepository()
export default publicDirectPaymentRepository
