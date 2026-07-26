/**
 * posBookingSettingsRepository — POS Booking, Ticket 2 (Booking Settings). businessId
 * is an explicit param on every call, same as posOrdersRepository, because a Staff
 * caller may be linked to more than one business (access gated server-side via
 * IPosOperationsAccessService, same permission as Orders).
 */
import httpClient from '../../lib/httpClient'
import type { PosBookingSettingsApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPosBookingSettingsRepository(client: HttpClient = httpClient) {
  return {
    async getBookingSettings(businessId: string): Promise<PosBookingSettingsApiDto> {
      return await client.get<PosBookingSettingsApiDto>(
        `/api/v1/merchant/pos/${businessId}/booking-settings`,
      )
    },

    async updateBookingSettings(businessId: string, dto: PosBookingSettingsApiDto): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/booking-settings`,
        dto,
      )
    },
  }
}

export const posBookingSettingsRepository = createPosBookingSettingsRepository()
export default posBookingSettingsRepository
