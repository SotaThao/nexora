/**
 * profileSettingsRepository — API-only implementation.
 */

import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { UserProfile } from '../../types/domain'
import type { UpdateStaffProfileDto, UpdateUserProfileDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createProfileSettingsRepository(client: HttpClient = httpClient) {
  return {
    async get(): Promise<UserProfile | null> {
      try {
        const response = await client.get<UserProfile>('/api/v1/userprofile/me')
        return response || null
      } catch (err: unknown) {
        if (isApiError(err) && (err.errorCode === 'COMMON_NOT_FOUND' || err.status === 404)) {
          return null
        }
        throw err
      }
    },

    async getVerifiedStatus(): Promise<LooseObject> {
      return client.get<LooseObject>('/api/v1/userprofile/verified-status')
    },

    async initializeKyc(): Promise<{ url?: string }> {
      return client.post<{ url?: string }>('/api/v1/userprofile/kyc/initialize')
    },

    async updateUserProfile(dto: UpdateUserProfileDto): Promise<LooseObject> {
      return client.put<LooseObject>('/api/v1/userprofile/update', dto)
    },

    async updateStaffProfile(dto: UpdateStaffProfileDto): Promise<LooseObject> {
      return client.put<LooseObject>('/api/v1/staff/profile', dto)
    },

    async save(_settings: LooseObject): Promise<void> {
      // deprecated
    },

    async clear(): Promise<void> {
      // no-op
    },
  }
}

export const profileSettingsRepository = createProfileSettingsRepository()
export default profileSettingsRepository
