import httpClient from '../../lib/httpClient'
import { payoutTypeToUiKey } from '../paymentMethodTypes'
import type {
  CreateDirectPaymentResult,
  PublicDirectPaymentMethod,
  PublicDirectPaymentPage,
} from '../../types/domain'

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
  }
}

export const publicDirectPaymentRepository = createPublicDirectPaymentRepository()
export default publicDirectPaymentRepository
