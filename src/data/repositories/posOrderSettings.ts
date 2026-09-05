/**
 * posOrderSettingsRepository — salon-wide rules for the service-line lifecycle:
 * whether a technician must accept work assigned to them, and whether the front desk is
 * warned when a ticket action runs ahead of its lines. businessId is an explicit param on
 * every call, same as posOrdersRepository (a Staff caller may be linked to more than one
 * business; access is gated server-side via IPosOperationsAccessService).
 */
import httpClient from '../../lib/httpClient'
import type { PosOrderSettingsApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPosOrderSettingsRepository(client: HttpClient = httpClient) {
  return {
    async getOrderSettings(businessId: string): Promise<PosOrderSettingsApiDto> {
      return await client.get<PosOrderSettingsApiDto>(
        `/api/v1/merchant/pos/${businessId}/order-settings`,
      )
    },

    async updateOrderSettings(businessId: string, dto: PosOrderSettingsApiDto): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/order-settings`,
        dto,
      )
    },
  }
}

export const posOrderSettingsRepository = createPosOrderSettingsRepository()
export default posOrderSettingsRepository
