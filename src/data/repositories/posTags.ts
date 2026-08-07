/**
 * posTagsRepository — POS Owner Setup: Tag catalog for Service/Product autocomplete (US-017).
 */
import httpClient from '../../lib/httpClient'
import type { PosTagApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPosTagsRepository(client: HttpClient = httpClient) {
  return {
    async getPosTags(): Promise<PosTagApiDto[]> {
      const res = await client.get<PosTagApiDto[]>('/api/v1/merchant/pos/tags')
      return res ?? []
    },
  }
}

export const posTagsRepository = createPosTagsRepository()
export default posTagsRepository
