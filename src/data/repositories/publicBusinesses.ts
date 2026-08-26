/**
 * publicBusinessesRepository — Public business API integration.
 */

import httpClient from '../../lib/httpClient'
import type { PaymentMethodDto } from '../../types/domain'
import type { CreateMultiStaffTipVars } from '../../types/hooks'
import {
  normalizePaymentMethodDto,
  type PaymentMethodApiDtoLike,
} from './paymentMethodDto'
import { toVlinkpayCryptoSymbolWire } from '../../components/payout/vlinkpayWallet'

type HttpClient = typeof httpClient

export function createPublicBusinessesRepository(client: HttpClient = httpClient) {
  return {
    async getPaymentMethods(businessId: string): Promise<PaymentMethodDto[]> {
      if (!businessId) {
        throw new Error('publicBusinessesRepository.getPaymentMethods: businessId is required')
      }
      const res = await client.get<PaymentMethodApiDtoLike[]>(
        `/api/v1/public/businesses/${encodeURIComponent(businessId)}/payment-methods`,
        { anonymous: true },
      )
      // Preserve BE array order — tip wallet pickers rely on this sequence.
      return Array.isArray(res) ? res.map(normalizePaymentMethodDto) : []
    },

    async getPaymentMethodById(businessId: string, paymentMethodId: string): Promise<PaymentMethodDto> {
      if (!businessId) {
        throw new Error('publicBusinessesRepository.getPaymentMethodById: businessId is required')
      }
      const res = await client.get<PaymentMethodApiDtoLike>(
        `/api/v1/public/businesses/${encodeURIComponent(businessId)}/payment-methods/${encodeURIComponent(paymentMethodId)}`,
        { anonymous: true },
      )
      return normalizePaymentMethodDto(res ?? {})
    },

    async createMultiStaffTip(args: CreateMultiStaffTipVars) {
      if (!args.businessId) {
        throw new Error('publicBusinessesRepository.createMultiStaffTip: businessId is required')
      }
      const body: Record<string, unknown> = {
        businessId: args.businessId,
        touchPointId: args.touchPointId,
        businessPaymentMethodId: args.businessPaymentMethodId,
        tipItems: args.tipItems,
      }
      if (Number.isFinite(args.minStaffCount)) body.minStaffCount = args.minStaffCount
      const symbol = toVlinkpayCryptoSymbolWire(args.cryptoSymbol)
      if (symbol) body.cryptoSymbol = symbol
      return client.post<LooseObject>(
        '/api/v1/tips/multi-staff',
        body,
        { anonymous: true },
      )
    },

    async confirmMultiStaffTip(tipId: string) {
      const confirmResult = await client.patch<LooseObject>(
        `/api/v1/tips/${encodeURIComponent(tipId)}/confirm`,
        {},
        { anonymous: true },
      )
      try {
        await client.post<LooseObject>(
          '/api/v1/tips/confirm-receipt',
          { tipIds: [tipId] },
          { anonymous: true },
        )
      } catch {
        // Best-effort sync; primary confirm already succeeded.
      }
      return confirmResult
    },
  }
}

export const publicBusinessesRepository = createPublicBusinessesRepository()
export default publicBusinessesRepository
