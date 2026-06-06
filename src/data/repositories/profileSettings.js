/**
 * profileSettingsRepository — API-only implementation.
 * TODO: Wire to real profile settings API endpoints when available.
 */

import httpClient from '../../lib/httpClient'

export function createProfileSettingsRepository(client = httpClient) {
  return {
    /** @returns {Promise<object|null>} */
    async get() {
      // TODO: Wire to GET /api/v1/userprofile/me if needed
      return null
    },

    /** 
     * @param {object} dto 
     * @param {string} dto.firstName
     * @param {string} dto.lastName
     * @param {string} dto.phoneNumber
     * @param {string} [dto.profileImageUrl]
     * @param {string} [dto.city]
     */
    async updateUserProfile(dto) {
      return client.put('/api/v1/userprofile/update', dto)
    },

    /**
     * @param {object} dto
     * @param {string} dto.displayName
     * @param {string} [dto.position]
     * @param {string} [dto.bio]
     * @param {string} [dto.photoUrl]
     */
    async updateStaffProfile(dto) {
      return client.put('/api/v1/staff/profile', dto)
    },

    /** @deprecated Use updateUserProfile instead */
    async save(settings) {
      // no-op
    },

    async clear() {
      // no-op
    },
  }
}

export const profileSettingsRepository = createProfileSettingsRepository()
export default profileSettingsRepository
