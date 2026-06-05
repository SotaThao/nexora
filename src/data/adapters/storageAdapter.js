/**
 * storageAdapter — the ONLY place domain JSON.parse / JSON.stringify lives.
 * Wraps src/utils/storage.js; repositories use this, not storage directly.
 */
import { storage } from '../../utils/storage'
import { logger } from '../../utils/logger'

export const storageAdapter = {
  /**
   * Read a domain key and return the parsed JS value, or null when absent /
   * unparseable.
   * @param {string} key  One of the nexora_* DYNAMIC_KEYS
   * @returns {Promise<object|Array|null>}
   */
  async get(key) {
    const raw = storage.getItem(key)
    if (raw === null || raw === undefined) return null
    try {
      return JSON.parse(raw)
    } catch (err) {
      logger.error('[storageAdapter] JSON.parse failed for key:', key, err)
      return null
    }
  },

  /**
   * Serialize and persist a value under the given key.
   * @param {string} key
   * @param {object|Array} value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    storage.setItem(key, JSON.stringify(value))
  },

  /**
   * Remove the entry for the given key.
   * @param {string} key
   * @returns {Promise<void>}
   */
  async remove(key) {
    storage.removeItem(key)
  },
}
