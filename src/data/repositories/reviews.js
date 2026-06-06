/**
 * reviewsRepository — API-only implementation.
 * TODO: Wire to real reviews API endpoints when available.
 */

export function createReviewsRepository() {
  return {
    /** @returns {Promise<Array>} */
    async list() {
      // TODO: Wire to GET /api/v1/merchant/reviews
      return []
    },

    /**
     * @param {object} review
     * @returns {Promise<object>} the appended review
     */
    async add(review) {
      // TODO: Wire to POST /api/v1/merchant/reviews
      return review
    },

    /**
     * @param {string} id
     * @param {object} patch
     */
    async update(id, patch) {
      // TODO: Wire to PATCH /api/v1/merchant/reviews/:id
    },
  }
}

export const reviewsRepository = createReviewsRepository()
export default reviewsRepository
