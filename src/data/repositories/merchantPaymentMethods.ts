import httpClient from '../../lib/httpClient'
import type { PaymentMethodDto } from '../../types/domain'
import { PAYOUT_UI_LABELS, payoutTypeToUiKey } from '../paymentMethodTypes'

type HttpClient = typeof httpClient

interface UpdatePaymentMethodDto {
  accountInfo?: string | null
  imageUrl?: string | null
}

interface MerchantPaymentMethodApiDto {
  id?: string
  type?: string
  accountInfo?: string | null
  imageUrl?: string | null
  isActive?: boolean
  isConfigured?: boolean
  businessKybStatus?: string | null
  name?: string
}

function normalizeMerchantPaymentMethod(dto: MerchantPaymentMethodApiDto): PaymentMethodDto {
  const type = dto.type || ''
  const uiKey = payoutTypeToUiKey(type)
  return {
    id: dto.id,
    type,
    uiKey,
    name: PAYOUT_UI_LABELS[uiKey] || dto.name || type,
    accountInfo: dto.accountInfo ?? null,
    imageUrl: dto.imageUrl ?? null,
    isActive: Boolean(dto.isActive),
    isConfigured: Boolean(dto.isConfigured),
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
