/**
 * posTurnBoardRepository — POS Merchant Ops: Turn Board Assign & Break (US-13).
 * businessId is an explicit param on every call, same as posTicketsRepository —
 * a Staff caller may be linked to more than one business.
 */
import httpClient from '../../lib/httpClient'
import type { TurnBoardStationApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPosTurnBoardRepository(client: HttpClient = httpClient) {
  return {
    async getTurnBoard(businessId: string): Promise<TurnBoardStationApiDto[]> {
      const res = await client.get<TurnBoardStationApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/turn-board`,
      )
      return res ?? []
    },

    async setStaffBreakStatus(
      businessId: string,
      posStaffProfileId: string,
      isBreak: boolean,
    ): Promise<boolean> {
      return await client.put<boolean>(
        `/api/v1/merchant/pos/${businessId}/turn-board/${posStaffProfileId}/break-status`,
        { isBreak },
      )
    },
  }
}

export const posTurnBoardRepository = createPosTurnBoardRepository()
export default posTurnBoardRepository
