/**
 * profileSettingsRepository — merchant profile/account settings.
 * Key: nexora_profile_settings.
 */
import { adapter as defaultAdapter } from '../adapters'

const KEY = 'nexora_profile_settings'

export function createProfileSettingsRepository(a = defaultAdapter) {
  return {
    /** @returns {Promise<object|null>} */
    async get() {
      return a.get(KEY)
    },

    /** @param {object} settings */
    async save(settings) {
      await a.set(KEY, settings)
    },

    async clear() {
      await a.remove(KEY)
    },
  }
}

export const profileSettingsRepository = createProfileSettingsRepository()
export default profileSettingsRepository
