/**
 * storageAdapter — the ONLY place domain JSON.parse / JSON.stringify lives.
 */
import { storage } from '../../utils/storage'
import { logger } from '../../utils/logger'

export const storageAdapter = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = storage.getItem(key)
    if (raw === null || raw === undefined) return null
    try {
      return JSON.parse(raw) as T
    } catch (err) {
      logger.error('[storageAdapter] JSON.parse failed for key:', key, err)
      return null
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    storage.setItem(key, JSON.stringify(value))
  },

  async remove(key: string): Promise<void> {
    storage.removeItem(key)
  },
}
