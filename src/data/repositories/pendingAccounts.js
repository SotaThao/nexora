/**
 * pendingAccountsRepository — registration queue (transitional; in the API
 * phase registration becomes a server endpoint and this key disappears).
 * Key: nexora_pending_accounts.
 *
 * Storage shape: Array of account objects, each with at minimum { email }.
 */
import { adapter as defaultAdapter } from '../adapters'

const KEY = 'nexora_pending_accounts'

export function createPendingAccountsRepository(a = defaultAdapter) {
  return {
    /** @returns {Promise<Array>} */
    async list() {
      return (await a.get(KEY)) ?? []
    },

    /**
     * @param {object} account
     * @returns {Promise<object>} the appended account
     */
    async add(account) {
      const list = (await a.get(KEY)) ?? []
      const updated = [...list, account]
      await a.set(KEY, updated)
      return account
    },

    /**
     * Find the first account whose email matches (case-insensitive).
     * @param {string} email
     * @returns {Promise<object|null>}
     */
    async findByEmail(email) {
      const list = (await a.get(KEY)) ?? []
      const lower = email.toLowerCase()
      return list.find((acc) => acc.email?.toLowerCase() === lower) ?? null
    },

    /**
     * Replace the entire pending-accounts list.
     * @param {Array} list
     */
    async replaceAll(list) {
      await a.set(KEY, list)
    },
  }
}

export const pendingAccountsRepository = createPendingAccountsRepository()
export default pendingAccountsRepository
