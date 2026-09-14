/**
 * posTurnSettingsRepository — how the salon converts the value of a service into turns on the
 * Turn Board: a turn credit per service-value band, plus the default booking turn credit shared
 * with the Bookings calendar. businessId is an explicit param on every call, same as
 * posOrderSettingsRepository (access is gated server-side via IPosOperationsAccessService;
 * saving additionally needs the manage_turn_rules permission).
 */
import httpClient from '../../lib/httpClient'
import type { PosTurnSettingsApiDto, PosTurnSettingsUpdateApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPosTurnSettingsRepository(client: HttpClient = httpClient) {
  return {
    async getTurnSettings(businessId: string): Promise<PosTurnSettingsApiDto> {
      return await client.get<PosTurnSettingsApiDto>(
        `/api/v1/merchant/pos/${businessId}/turn-settings`,
      )
    },

    async updateTurnSettings(
      businessId: string,
      dto: PosTurnSettingsUpdateApiDto,
    ): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/turn-settings`,
        dto,
      )
    },
  }
}

export const posTurnSettingsRepository = createPosTurnSettingsRepository()
export default posTurnSettingsRepository
