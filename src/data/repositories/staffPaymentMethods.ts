import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { PaymentMethodDto } from '../../types/domain'

type HttpClient = typeof httpClient

interface UpdatePaymentMethodDto {
  accountInfo?: string | null
  imageUrl?: string | null
}

export function createStaffPaymentMethodsRepository(client: HttpClient = httpClient) {
  return {
    async getAll(): Promise<PaymentMethodDto[]> {
      try {
        return await client.get<PaymentMethodDto[]>('/api/v1/staff/payment-methods')
      } catch (err: unknown) {
        if (isApiError(err) && err.status === 404) return []
        throw err
      }
    },

    async update(id: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethodDto> {
      return client.put<PaymentMethodDto>(`/api/v1/staff/payment-methods/${id}`, dto)
    },

    async toggle(id: string): Promise<PaymentMethodDto> {
      return client.patch<PaymentMethodDto>(`/api/v1/staff/payment-methods/${id}/toggle`)
    },
  }
}

export const staffPaymentMethodsRepository = createStaffPaymentMethodsRepository()
export default staffPaymentMethodsRepository
