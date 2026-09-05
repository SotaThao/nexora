/**
 * posBeepRepository — the salon side of the two-way beep.
 *
 * Kept out of posTimeClockRepository so that file needs no edit: sending a beep (and nudging one)
 * still goes through its existing `beepStaff()`, because the server treats a beep aimed at a tech
 * who already has an open call as a nudge on that same row. This file only adds what did not exist
 * before — reading the day's beeps and closing one.
 *
 * fromUtc/toUtc are supplied by the caller, same as the roster and day log: the board shows "today"
 * in the salon's local time, which only the device in the salon reliably knows.
 */
import httpClient from '../../lib/httpClient'
import type { PosBeepApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPosBeepRepository(client: HttpClient = httpClient) {
  return {
    async getBeepFeed(businessId: string, fromUtc: string, toUtc: string): Promise<PosBeepApiDto[]> {
      const res = await client.get<PosBeepApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/time-clock/beeps`,
        { params: { fromUtc, toUtc } },
      )
      return Array.isArray(res) ? res : []
    },

    async resolveBeep(businessId: string, beepId: string): Promise<void> {
      await client.post<void>(
        `/api/v1/merchant/pos/${businessId}/time-clock/beeps/${beepId}/resolve`,
      )
    },
  }
}

export const posBeepRepository = createPosBeepRepository()
export default posBeepRepository
