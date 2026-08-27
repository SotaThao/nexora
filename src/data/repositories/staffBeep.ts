/**
 * staffBeepRepository — the tech's own side of the beep.
 *
 * Separate from posTimeClockRepository because it is a different route family (`/api/v1/staff/...`)
 * and because the staff shell should not have to import a merchant-POS repository just to answer a
 * beep. `listActive` takes no businessId: the token scopes it, so a tech working two salons gets
 * both front desks' calls in one poll.
 */
import httpClient from '../../lib/httpClient'
import type {
  ActiveStaffBeepsApiDto,
  RespondToBeepRequest,
  StaffBeepResponseResultApiDto,
} from '../../types/repositories'

type HttpClient = typeof httpClient

const EMPTY_ACTIVE_BEEPS: ActiveStaffBeepsApiDto = { allowedDelayMinutes: [], beeps: [] }

export function createStaffBeepRepository(client: HttpClient = httpClient) {
  return {
    async listActive(): Promise<ActiveStaffBeepsApiDto> {
      const res = await client.get<ActiveStaffBeepsApiDto>('/api/v1/staff/beeps/active')
      if (!res || !Array.isArray(res.beeps)) return EMPTY_ACTIVE_BEEPS
      return res
    },

    async respond(beepId: string, body: RespondToBeepRequest): Promise<StaffBeepResponseResultApiDto> {
      return client.post<StaffBeepResponseResultApiDto>(
        `/api/v1/staff/beeps/${beepId}/respond`,
        body,
      )
    },
  }
}

export const staffBeepRepository = createStaffBeepRepository()
export default staffBeepRepository
