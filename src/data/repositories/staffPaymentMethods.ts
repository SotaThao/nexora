import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { PaymentMethodCryptoAddressDto, PaymentMethodDto } from '../../types/domain'
import { normalizePaymentMethodDto, type UpdatePaymentMethodDto } from './paymentMethodDto'

type HttpClient = typeof httpClient

interface StaffPaymentMethodApiDto {
  id?: string
  type?: string
  accountInfo?: string | null
  accountName?: string | null
  imageUrl?: string | null
  isActive?: boolean
  isConfigured?: boolean
  cryptoAddresses?: PaymentMethodCryptoAddressDto[] | null
}

function normalizeStaffPaymentMethod(dto: StaffPaymentMethodApiDto): PaymentMethodDto {
  return {
    ...normalizePaymentMethodDto(dto),
    isActive: Boolean(dto.isActive),
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
