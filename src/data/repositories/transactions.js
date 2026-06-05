/**
 * transactionsRepository — D8: the integrity choke point for all tip/money
 * reads and writes. No JSON / storage logic lives here; everything delegates
 * to the injected adapter.
 *
 * Export shape:
 *   createTransactionsRepository(adapter?) → repository instance
 *   default export → pre-built instance using the resolved adapter singleton
 *
 * The factory overload (createTransactionsRepository) exists for testability:
 * unit tests inject a fake in-memory adapter without touching module globals.
 */
import { adapter as defaultAdapter } from '../adapters'

const KEY = 'nexora_transactions'

export function createTransactionsRepository(a = defaultAdapter) {
  return {
    /** @returns {Promise<Array>} */
    async list() {
      return (await a.get(KEY)) ?? []
    },

    /**
     * Append a transaction and persist the updated list.
     * @param {object} tx
     * @returns {Promise<object>} the appended tx
     */
    async add(tx) {
      const list = (await a.get(KEY)) ?? []
      const updated = [...list, tx]
      await a.set(KEY, updated)
      return tx
    },

    /**
     * Merge patch into the transaction with matching id.
     * Silently no-ops if the id is not found.
     * @param {string} id
     * @param {object} patch
     * @returns {Promise<void>}
     */
    async update(id, patch) {
      const list = (await a.get(KEY)) ?? []
      const updated = list.map((tx) =>
        tx.id === id ? { ...tx, ...patch } : tx
      )
      await a.set(KEY, updated)
    },
  }
}

export const transactionsRepository = createTransactionsRepository()
export default transactionsRepository
