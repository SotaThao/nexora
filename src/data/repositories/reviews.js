/**
 * reviewsRepository — customer reviews submitted via the review-token flow.
 * Key: nexora_reviews.
 */
import { adapter as defaultAdapter } from '../adapters'

const KEY = 'nexora_reviews'

export function createReviewsRepository(a = defaultAdapter) {
  return {
    /** @returns {Promise<Array>} */
    async list() {
      return (await a.get(KEY)) ?? []
    },

    /**
     * @param {object} review
     * @returns {Promise<object>} the appended review
     */
    async add(review) {
      const list = (await a.get(KEY)) ?? []
      const updated = [...list, review]
      await a.set(KEY, updated)
      return review
    },

    /**
     * Merge patch into the review with matching id.
     * @param {string} id
     * @param {object} patch
     */
    async update(id, patch) {
      const list = (await a.get(KEY)) ?? []
      const updated = list.map((r) =>
        r.id === id ? { ...r, ...patch } : r
      )
      await a.set(KEY, updated)
    },
  }
}

export const reviewsRepository = createReviewsRepository()
export default reviewsRepository
