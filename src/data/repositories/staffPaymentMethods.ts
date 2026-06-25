import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { PaymentMethodDto } from '../../types/domain'
import {
  PAYOUT_UI_LABELS,
  payoutTypeToUiKey,
} from '../paymentMethodTypes'

type HttpClient = typeof httpClient

interface UpdatePaymentMethodDto {
  accountInfo?: string | null
  imageUrl?: string | null
}

interface StaffPaymentMethodApiDto {
  id?: string
  type?: string
  accountInfo?: string | null
  imageUrl?: string | null
  isActive?: boolean
  isConfigured?: boolean
}

function normalizeStaffPaymentMethod(dto: StaffPaymentMethodApiDto): PaymentMethodDto {
  const type = dto.type || ''
  const uiKey = payoutTypeToUiKey(type)
  return {
    id: dto.id,
    type,
    uiKey,
    name: PAYOUT_UI_LABELS[uiKey] || type,
    accountInfo: dto.accountInfo ?? null,
    imageUrl: dto.imageUrl ?? null,
    isActive: Boolean(dto.isActive),
    isConfigured: Boolean(dto.isConfigured),
  }
}

export function createStaffPaymentMethodsRepository(client: HttpClient = httpClient) {
  return {
    async getAll(): Promise<PaymentMethodDto[]> {
      try {
        const res = await client.get<StaffPaymentMethodApiDto[]>('/api/v1/staff/payment-methods')
        return Array.isArray(res) ? res.map(normalizeStaffPaymentMethod) : []
      } catch (err: unknown) {
        if (isApiError(err) && err.status === 404) return []
        throw err
      }
    },

    async update(id: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethodDto> {
      const res = await client.put<StaffPaymentMethodApiDto>(`/api/v1/staff/payment-methods/${id}`, dto)
      return normalizeStaffPaymentMethod(res)
    },

    async toggle(id: string): Promise<PaymentMethodDto> {
      const res = await client.patch<StaffPaymentMethodApiDto>(`/api/v1/staff/payment-methods/${id}/toggle`)
      return normalizeStaffPaymentMethod(res)
    },
  }
}

export const staffPaymentMethodsRepository = createStaffPaymentMethodsRepository()
export default staffPaymentMethodsRepository
