/**
 * reviewsRepository — API-only implementation.
 * TODO: Wire to real reviews API endpoints when available.
 */

import httpClient from '../../lib/httpClient'

export function createReviewsRepository(client = httpClient) {
  return {
    /** 
     * @param {object} filters
     * @param {number} [filters.rating]
     * @param {string} [filters.source]
     * @param {boolean} [filters.resolved]
     * @returns {Promise<Array>} 
     */
    async list(filters = {}) {
      const response = await client.get<LooseObject>('/api/v1/merchant/dashboard/reviews', { params: filters })
      return Array.isArray(response) ? response : ((response as any).data || [])
    },

    /**
     * Resolve a private feedback review.
     * @param {string} id
     * @param {object} dto
     * @returns {Promise<object>}
     */
    async resolve(id, dto = {}) {
      return client.put(`/api/v1/merchant/dashboard/reviews/${id}/resolve`, dto)
    },

    /**
     * @deprecated Customer touch point creates reviews, not merchant dashboard.
     */
    async add(review) {
      return review
    },

    /**
     * @deprecated
     */
    async update(id, patch) {
      // no-op
    },
  }
}

export const reviewsRepository = createReviewsRepository()
export default reviewsRepository
