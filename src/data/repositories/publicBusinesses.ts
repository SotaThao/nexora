/**
 * publicBusinessesRepository — Public business API integration.
 */

import httpClient from '../../lib/httpClient'
import type { PaymentMethodDto } from '../../types/domain'
import type { CreateMultiStaffTipVars } from '../../types/hooks'

type HttpClient = typeof httpClient

export function createPublicBusinessesRepository(client: HttpClient = httpClient) {
  return {
    async getPaymentMethods(businessId: string): Promise<PaymentMethodDto[]> {
      if (!businessId) {
        throw new Error('publicBusinessesRepository.getPaymentMethods: businessId is required')
      }
      return client.get<PaymentMethodDto[]>(
        `/api/v1/public/businesses/${encodeURIComponent(businessId)}/payment-methods`,
        { anonymous: true },
      )
    },

    async getPaymentMethodById(businessId: string, paymentMethodId: string): Promise<PaymentMethodDto> {
      if (!businessId) {
        throw new Error('publicBusinessesRepository.getPaymentMethodById: businessId is required')
      }
      return client.get<PaymentMethodDto>(
        `/api/v1/public/businesses/${encodeURIComponent(businessId)}/payment-methods/${encodeURIComponent(paymentMethodId)}`,
        { anonymous: true },
      )
    },

    async createMultiStaffTip(args: CreateMultiStaffTipVars) {
      if (!args.businessId) {
        throw new Error('publicBusinessesRepository.createMultiStaffTip: businessId is required')
      }
      return client.post<LooseObject>(
        '/api/v1/tips/multi-staff',
        args,
        { anonymous: true },
      )
    },

    async confirmMultiStaffTip(tipId: string) {
      return client.patch<LooseObject>(
        `/api/v1/tips/${encodeURIComponent(tipId)}/confirm`,
        {},
        { anonymous: true },
      )
    },
  }
}

export const publicBusinessesRepository = createPublicBusinessesRepository()
export default publicBusinessesRepository
