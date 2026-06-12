import httpClient from '../../lib/httpClient'
import type { PaymentMethodDto } from '../../types/domain'

type HttpClient = typeof httpClient

interface UpdatePaymentMethodDto {
  accountInfo?: string | null
  imageUrl?: string | null
}

export function createMerchantPaymentMethodsRepository(client: HttpClient = httpClient) {
  return {
    async getAll(): Promise<PaymentMethodDto[]> {
      return client.get<PaymentMethodDto[]>('/api/v1/merchant/payment-methods')
    },

    async update(id: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethodDto> {
      return client.put<PaymentMethodDto>(`/api/v1/merchant/payment-methods/${id}`, dto)
    },

    async toggle(id: string): Promise<PaymentMethodDto> {
      return client.patch<PaymentMethodDto>(`/api/v1/merchant/payment-methods/${id}/toggle`)
    },
  }
}

export const merchantPaymentMethodsRepository = createMerchantPaymentMethodsRepository()
export default merchantPaymentMethodsRepository
