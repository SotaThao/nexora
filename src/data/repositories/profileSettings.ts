/**
 * profileSettingsRepository — API-only implementation.
 */

import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { UserProfile } from '../../types/domain'
import type { UpdateStaffProfileDto, UpdateUserProfileDto } from '../../types/repositories'
import { getUserProfileImageUrl } from '../../utils/userProfileImage'

type HttpClient = typeof httpClient

export type KybIframeInitializeCommand = {
  viewType?: 'NetworkTree' | 'Identity' | 'Profile' | 'Wallet'
  language?: string
}

/** POST /api/v1/UserProfile/iframe/initialize */
export type KybIframeInitializeResponse = {
  identityId?: string
  viewType?: string
  url?: string
}

/** POST /api/v1/UserProfile/kyb/initialize */
export type InitializeKybResponse = {
  url?: string
}

/** @deprecated Use InitializeKybResponse */
export type RegisterKybResponse = InitializeKybResponse

export function createProfileSettingsRepository(client: HttpClient = httpClient) {
  return {
    async get(): Promise<UserProfile | null> {
      try {
        const response = await client.get<UserProfile>('/api/v1/userprofile/me')
        if (!response) return null
        const profileImageUrl = getUserProfileImageUrl(response)
        return profileImageUrl
          ? { ...response, profileImageUrl }
          : response
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

    /** POST /api/v1/UserProfile/iframe/initialize — existing KYB iframe session. */
    async initializeKybIframe(
      command: KybIframeInitializeCommand = {},
    ): Promise<KybIframeInitializeResponse> {
      try {
        return await client.post<KybIframeInitializeResponse>(
          '/api/v1/userprofile/iframe/initialize',
          {
            viewType: command.viewType ?? 'Identity',
            language: command.language ?? 'en',
          },
        )
      } catch (err: unknown) {
        if (isApiError(err) && (err.status === 404 || err.errorCode === 'COMMON_NOT_FOUND')) {
          return {}
        }
        throw err
      }
    },

    /** KYC only — staff personal verification. */
    async initializeKyc(): Promise<{ url?: string }> {
      return client.post<{ url?: string }>('/api/v1/userprofile/kyc/initialize')
    },

    /** POST /api/v1/UserProfile/kyb/initialize — start or resume KYB iframe portal. */
    async initializeKyb(): Promise<InitializeKybResponse> {
      return client.post<InitializeKybResponse>('/api/v1/userprofile/kyb/initialize', {})
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
