/**
 * transactionsRepository — API-only implementation.
 * TODO: Wire to real transaction API endpoints when available.
 */

export function createTransactionsRepository() {
  return {
    /** @returns {Promise<Array>} */
    async list() {
      // TODO: Wire to GET /api/v1/merchant/transactions
      return []
    },

    /**
     * @param {object} tx
     * @returns {Promise<object>} the appended tx
     */
    async add(tx) {
      // TODO: Wire to POST /api/v1/merchant/transactions
      return tx
    },

    /**
     * @param {string} id
     * @param {object} patch
     * @returns {Promise<void>}
     */
    async update(id, patch) {
      // TODO: Wire to PATCH /api/v1/merchant/transactions/:id
    },
  }
}

export const transactionsRepository = createTransactionsRepository()
export default transactionsRepository
