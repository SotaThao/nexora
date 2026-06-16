/**
 * profileSettingsRepository — API-only implementation.
 */

import httpClient from '../../lib/httpClient'
import { UserKybStatus } from '../../constants/userVerifyStatus'
import { isApiError } from '../../types/domain'
import type { UserProfile } from '../../types/domain'
import type { UpdateStaffProfileDto, UpdateUserProfileDto } from '../../types/repositories'
import { getUserProfileImageUrl } from '../../utils/userProfileImage'

type HttpClient = typeof httpClient

const KYB_API_BASE = '/customers/customers/kyb'

export type KybProfileItem = {
  name: string
  value: string
  imageUrl: string | null
  status: number
}

/** Mirrors VLINKPAY KYBCustomerProfileResponse. */
export type KybCustomerProfileResponse = {
  status: number
  kybProfile: KybProfileItem[]
}

export type RegisterKybResponse = {
  url: string
}

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

    /** GET /customers/customers/kyb/{customerId} — VLINKPAY gateway. */
    async getKybInfo(customerId: string | number): Promise<KybCustomerProfileResponse> {
      try {
        const response = await client.get<LooseObject>(`${KYB_API_BASE}/${customerId}`)
        const status = Number(response?.status ?? UserKybStatus.None)
        const kybProfile = Array.isArray(response?.kybProfile)
          ? (response.kybProfile as KybProfileItem[])
          : []

        return { status, kybProfile }
      } catch (err: unknown) {
        if (isApiError(err) && (err.status === 404 || err.errorCode === 'COMMON_NOT_FOUND')) {
          return { status: UserKybStatus.None, kybProfile: [] }
        }
        throw err
      }
    },

    /** KYC only — staff personal verification. */
    async initializeKyc(): Promise<{ url?: string }> {
      return client.post<{ url?: string }>('/api/v1/userprofile/kyc/initialize')
    },

    /** POST /customers/customers/kyb/register — VLINKPAY gateway. */
    async registerKyb(): Promise<RegisterKybResponse> {
      return client.post<RegisterKybResponse>(`${KYB_API_BASE}/register`, {})
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
