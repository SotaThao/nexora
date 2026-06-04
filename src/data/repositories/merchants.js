/**
 * merchantsRepository — setup object for the merchant (business info, staff
 * list, touch-points, etc.).  Key: nexora_merchant_setup.
 */
import { adapter as defaultAdapter } from '../adapters'

const KEY = 'nexora_merchant_setup'

export function createMerchantsRepository(a = defaultAdapter) {
  return {
    /** @returns {Promise<object|null>} full setup blob or null */
    async getSetup() {
      return a.get(KEY)
    },

    /** @param {object} setup — replaces the full blob */
    async saveSetup(setup) {
      await a.set(KEY, setup)
    },

    /**
     * Convenience: read just the staffList array.
     * @returns {Promise<Array>}
     */
    async getStaffList() {
      const setup = await a.get(KEY)
      return setup?.staffList ?? []
    },

    /**
     * Convenience: merge a new staffList into the existing setup blob and
     * persist.  Creates a minimal setup object if none exists yet.
     * @param {Array} list
     */
    async saveStaffList(list) {
      const setup = (await a.get(KEY)) ?? {}
      await a.set(KEY, { ...setup, staffList: list })
    },
  }
}

export const merchantsRepository = createMerchantsRepository()
export default merchantsRepository
