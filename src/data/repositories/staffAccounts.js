/**
 * staffAccountsRepository — API-only implementation.
 * TODO: Wire to real staff accounts API endpoints when available.
 */

export function createStaffAccountsRepository() {
  return {
    /**
     * @returns {Promise<object>} — keyed by staffId, or {} if absent
     */
    async getAll() {
      // TODO: Wire to GET /api/v1/merchant/staff-accounts
      return {}
    },

    /**
     * @param {string} staffId
     * @returns {Promise<object|null>}
     */
    async get(staffId) {
      // TODO: Wire to GET /api/v1/merchant/staff-accounts/:staffId
      return null
    },

    /**
     * @param {string} staffId
     * @param {object} data
     */
    async save(staffId, data) {
      // TODO: Wire to PUT /api/v1/merchant/staff-accounts/:staffId
    },
  }
}

export const staffAccountsRepository = createStaffAccountsRepository()
export default staffAccountsRepository
