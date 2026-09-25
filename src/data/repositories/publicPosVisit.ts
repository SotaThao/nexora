/**
 * publicPosVisitRepository — the page behind the visit link in a customer SMS. The token is the
 * only credential, so the call is anonymous.
 */
import httpClient from '../../lib/httpClient'
import type { PosVisitLandingApiDto } from '../../types/posSms'

type HttpClient = typeof httpClient

export function createPublicPosVisitRepository(client: HttpClient = httpClient) {
  return {
    async getVisit(token: string): Promise<PosVisitLandingApiDto> {
      return await client.get<PosVisitLandingApiDto>(
        `/api/v1/public/visit/${encodeURIComponent(token)}`,
        { anonymous: true },
      )
    },
  }
}

const publicPosVisitRepository = createPublicPosVisitRepository()
export default publicPosVisitRepository
