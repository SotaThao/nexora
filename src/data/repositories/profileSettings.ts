/**
 * profileSettingsRepository — API-only implementation.
 */

import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { UserProfile, UserSubscription } from '../../types/domain'
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

function normalizeSubscription(raw: LooseObject | null | undefined): UserSubscription | null {
  const business = raw?.business as LooseObject | undefined
  const sub =
    raw?.subscription ??
    raw?.Subscription ??
    business?.subscription ??
    business?.Subscription
  if (!sub || typeof sub !== 'object') return null

  const plan = sub.plan ?? sub.Plan
  if (!plan) return null

  return {
    plan: String(plan),
    status: sub.status ?? sub.Status ? String(sub.status ?? sub.Status) : undefined,
    trialEndsAt: sub.trialEndsAt ?? sub.TrialEndsAt ?? null,
    currentPeriodEnd: sub.currentPeriodEnd ?? sub.CurrentPeriodEnd ?? null,
  }
}

function normalizeUserProfile(response: UserProfile): UserProfile {
  const subscription = normalizeSubscription(response as LooseObject)
  const profileImageUrl = getUserProfileImageUrl(response)

  return {
    ...response,
    ...(subscription ? { subscription } : {}),
    ...(profileImageUrl ? { profileImageUrl } : {}),
  }
}

export function createProfileSettingsRepository(client: HttpClient = httpClient) {
  return {
    async get(): Promise<UserProfile | null> {
      try {
        const response = await client.get<UserProfile>('/api/v1/userprofile/me')
        if (!response) return null
        return normalizeUserProfile(response)
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

    async updateBasicInfo(dto: { firstName: string; lastName?: string; phoneNumber?: string; dateOfBirth?: string }): Promise<void> {
      await client.put('/api/v1/userprofile/basic-info', dto)
    },

    async updateAddress(dto: { address?: string; city?: string; state?: string; zipCode?: string; country?: string }): Promise<void> {
      await client.put('/api/v1/userprofile/address', dto)
    },

    async updateAvatar(file: File): Promise<{ avatarUrl: string }> {
      const formData = new FormData()
      formData.append('avatar', file)
      return client.upload<{ avatarUrl: string }>('/api/v1/userprofile/avatar', formData, 'PUT')
    },

    async updateStaffProfile(dto: UpdateStaffProfileDto): Promise<LooseObject> {
      return client.put<LooseObject>('/api/v1/staff/profile', dto)
    },

    /** POST /api/v1/UserProfile/delete-account — permanently delete the authenticated user account. */
    async deleteAccount(): Promise<void> {
      await client.post('/api/v1/userprofile/delete-account', {})
    },
    async createStaffProfile(dto: UpdateStaffProfileDto): Promise<LooseObject> {
      return client.post<LooseObject>('/api/v1/staff/profile', dto)
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
