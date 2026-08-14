import httpClient from '../../lib/httpClient'
import type { PaymentMethodCryptoAddressDto, PaymentMethodDto } from '../../types/domain'
import { normalizePaymentMethodDto, type UpdatePaymentMethodDto } from './paymentMethodDto'

type HttpClient = typeof httpClient

interface MerchantPaymentMethodApiDto {
  id?: string
  type?: string
  accountInfo?: string | null
  accountName?: string | null
  imageUrl?: string | null
  isActive?: boolean
  isConfigured?: boolean
  businessKybStatus?: string | null
  name?: string
  cryptoAddresses?: PaymentMethodCryptoAddressDto[] | null
}

function normalizeMerchantPaymentMethod(dto: MerchantPaymentMethodApiDto): PaymentMethodDto {
  return {
    ...normalizePaymentMethodDto(dto),
    isActive: Boolean(dto.isActive),
    businessKybStatus: dto.businessKybStatus ?? null,
  }
}

export function createMerchantPaymentMethodsRepository(client: HttpClient = httpClient) {
  return {
    async getAll(): Promise<PaymentMethodDto[]> {
      const res = await client.get<MerchantPaymentMethodApiDto[]>('/api/v1/merchant/payment-methods')
      // Preserve BE array order — UI lists rely on this sequence.
      return Array.isArray(res) ? res.map(normalizeMerchantPaymentMethod) : []
    },

    async update(id: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethodDto> {
      const res = await client.put<MerchantPaymentMethodApiDto>(`/api/v1/merchant/payment-methods/${id}`, dto)
      return normalizeMerchantPaymentMethod(res)
    },

    async toggle(id: string): Promise<PaymentMethodDto> {
      const res = await client.patch<MerchantPaymentMethodApiDto>(`/api/v1/merchant/payment-methods/${id}/toggle`)
      return normalizeMerchantPaymentMethod(res)
    },
  }
}

export const merchantPaymentMethodsRepository = createMerchantPaymentMethodsRepository()
export default merchantPaymentMethodsRepository
