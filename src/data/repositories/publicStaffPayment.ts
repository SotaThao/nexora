import httpClient from '../../lib/httpClient'
import { payoutTypeToUiKey } from '../paymentMethodTypes'
import type {
  CreateDirectPaymentResult,
  PublicDirectPaymentMethod,
  PublicStaffDirectPaymentPage,
} from '../../types/domain'
import publicDirectPaymentRepository from './publicDirectPayment'

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

function normalizeStaffPaymentPage(raw: Record<string, unknown> | null | undefined): PublicStaffDirectPaymentPage {
  const source = raw ?? {}
  const methodsRaw = (source.paymentMethods ?? source.PaymentMethods ?? []) as Record<string, unknown>[]
  const paymentMethods = methodsRaw
    .map((item) => normalizePaymentMethod(item))
    .filter((item): item is PublicDirectPaymentMethod => Boolean(item))

  return {
    staffProfileId: readField<string>(source, 'staffProfileId', 'StaffProfileId') ?? '',
    displayName: readField<string>(source, 'displayName', 'DisplayName') ?? '',
    photoUrl: readField<string | null>(source, 'photoUrl', 'PhotoUrl') ?? null,
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

export function createPublicStaffPaymentRepository(client: HttpClient = httpClient) {
  return {
    async getPaymentPage(staffProfileId: string): Promise<PublicStaffDirectPaymentPage> {
      const res = await client.get<Record<string, unknown>>(
        `/api/v1/public/staff/${encodeURIComponent(staffProfileId)}/payment`,
        { anonymous: true },
      )
      return normalizeStaffPaymentPage(res)
    },

    async createPayment(
      staffProfileId: string,
      payload: { staffPaymentMethodId: string; amount: number },
    ): Promise<CreateDirectPaymentResult> {
      const res = await client.post<Record<string, unknown>>(
        `/api/v1/public/staff/${encodeURIComponent(staffProfileId)}/payments`,
        {
          staffPaymentMethodId: payload.staffPaymentMethodId,
          amount: payload.amount,
        },
        { anonymous: true },
      )
      return normalizeCreatePaymentResult(res)
    },

    confirmPayment(paymentId: string): Promise<void> {
      return publicDirectPaymentRepository.confirmPayment(paymentId)
    },
  }
}

export const publicStaffPaymentRepository = createPublicStaffPaymentRepository()
export default publicStaffPaymentRepository
