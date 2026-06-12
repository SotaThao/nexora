/**
 * reviewsRepository — API-only implementation.
 */

import httpClient from '../../lib/httpClient'
import type { ReviewRecord } from '../../types/domain'

type HttpClient = typeof httpClient

interface ReviewFilters {
  rating?: number
  source?: string
  resolved?: boolean
  [key: string]: string | number | boolean | undefined
}

interface ReviewsListResponse {
  data?: ReviewRecord[]
}

export function createReviewsRepository(client: HttpClient = httpClient) {
  return {
    async list(filters: ReviewFilters = {}): Promise<ReviewRecord[]> {
      const response = await client.get<ReviewRecord[] | ReviewsListResponse>(
        '/api/v1/merchant/dashboard/reviews',
        { params: filters },
      )
      return Array.isArray(response) ? response : (response.data || [])
    },

    async resolve(id: string, dto: LooseObject = {}): Promise<LooseObject> {
      return client.put<LooseObject>(`/api/v1/merchant/dashboard/reviews/${id}/resolve`, dto)
    },

    async add(review: ReviewRecord): Promise<ReviewRecord> {
      return review
    },

    async update(_id: string, _patch: LooseObject): Promise<void> {
      // deprecated
    },
  }
}

export const reviewsRepository = createReviewsRepository()
export default reviewsRepository
