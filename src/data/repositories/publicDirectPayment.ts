import httpClient from '../../lib/httpClient'
import { payoutTypeToUiKey } from '../paymentMethodTypes'
import type {
  CreateDirectPaymentResult,
  DirectPaymentStatusSnapshot,
  PublicDirectPaymentMethod,
  PublicDirectPaymentPage,
} from '../../types/domain'
import { PaymentType } from '../../types/domain'
import { normalizePaymentStatusValue } from '../../utils/directPaymentStatus'

type HttpClient = typeof httpClient

function readField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  return (raw[camel] ?? raw[pascal]) as T | undefined
}

function normalizePaymentMethod(raw: Record<string, unknown> | null | undefined): PublicDirectPaymentMethod | null {
  if (!raw) return null
  const id = readField<string>(raw, 'id', 'Id') ?? ''
  const type = readField<string>(raw, 'type', 'Type') ?? ''
  const accountInfo = readField<string>(raw, 'accountInfo', 'AccountInfo') ?? ''
  if (!id || !type || !accountInfo.trim()) return null

  return {
    id,
    type,
    uiKey: payoutTypeToUiKey(type),
    accountInfo,
    imageUrl: readField<string | null>(raw, 'imageUrl', 'ImageUrl') ?? null,
  }
}

function normalizePaymentPage(raw: Record<string, unknown> | null | undefined): PublicDirectPaymentPage {
  const source = raw ?? {}
  const methodsRaw = (source.paymentMethods ?? source.PaymentMethods ?? []) as Record<string, unknown>[]
  const paymentMethods = methodsRaw
    .map((item) => normalizePaymentMethod(item))
    .filter((item): item is PublicDirectPaymentMethod => Boolean(item))

  return {
    businessId: readField<string>(source, 'businessId', 'BusinessId') ?? '',
    businessName: readField<string>(source, 'businessName', 'BusinessName') ?? '',
    logoUrl: readField<string | null>(source, 'logoUrl', 'LogoUrl') ?? null,
    paymentUrl: readField<string>(source, 'paymentUrl', 'PaymentUrl') ?? '',
    paymentMethods,
  }
}

function normalizeCreatePaymentResult(raw: Record<string, unknown> | null | undefined): CreateDirectPaymentResult {
  const source = raw ?? {}
  const paymentMethodSource = (source.paymentMethod ?? source.PaymentMethod) as Record<string, unknown> | undefined
  const paymentMethod = normalizePaymentMethod(paymentMethodSource)

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
      imageUrl: null,
    },
  }
}

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
      payload: { businessPaymentMethodId: string; amount: number },
    ): Promise<CreateDirectPaymentResult> {
      const res = await client.post<Record<string, unknown>>(
        `/api/v1/public/merchant/${encodeURIComponent(businessId)}/payments`,
        {
          businessPaymentMethodId: payload.businessPaymentMethodId,
          amount: payload.amount,
        },
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
