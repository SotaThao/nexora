/**
 * staffAccountsRepository — per-staff account blobs stored as a single object
 * keyed by staffId.  Key: nexora_staff_account.
 *
 * Storage shape: { [staffId]: { ...staffAccountData } }
 */
import { adapter as defaultAdapter } from '../adapters'

const KEY = 'nexora_staff_account'

export function createStaffAccountsRepository(a = defaultAdapter) {
  return {
    /**
     * Return the full accounts map.
     * @returns {Promise<object>} — keyed by staffId, or {} if absent
     */
    async getAll() {
      return (await a.get(KEY)) ?? {}
    },

    /**
     * Return a single staff account by id, or null.
     * @param {string} staffId
     * @returns {Promise<object|null>}
     */
    async get(staffId) {
      const all = (await a.get(KEY)) ?? {}
      return all[staffId] ?? null
    },

    /**
     * Merge data into the account blob for staffId and persist.
     * @param {string} staffId
     * @param {object} data
     */
    async save(staffId, data) {
      const all = (await a.get(KEY)) ?? {}
      const updated = { ...all, [staffId]: { ...(all[staffId] ?? {}), ...data } }
      await a.set(KEY, updated)
    },
  }
}

export const staffAccountsRepository = createStaffAccountsRepository()
export default staffAccountsRepository
