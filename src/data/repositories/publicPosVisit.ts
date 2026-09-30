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
