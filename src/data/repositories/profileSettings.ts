/**
 * profileSettingsRepository — API-only implementation.
 */

import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { LooseObject, UserProfile, UserSubscription } from '../../types/domain'
import type { UpdateStaffProfileDto, UpdateUserProfileDto } from '../../types/repositories'
import { getUserProfileImageUrl } from '../../utils/userProfileImage'
import {
  getTipPlatformSubscription,
} from '../../utils/subscriptionDisplay'

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

function readStringField(raw: LooseObject, camel: string, pascal: string): string | undefined {
  const value = raw[camel] ?? raw[pascal]
  if (value == null || value === '') return undefined
  return String(value)
}

function normalizeOneSubscription(raw: LooseObject | null | undefined): UserSubscription | null {
  if (!raw || typeof raw !== 'object') return null
  const packageCode = readStringField(raw, 'packageCode', 'PackageCode')
  if (!packageCode) return null

  return {
    packageType: readStringField(raw, 'packageType', 'PackageType'),
    packageCode,
    name: readStringField(raw, 'name', 'Name'),
    status: readStringField(raw, 'status', 'Status'),
    trialEndsAt: (raw.trialEndsAt ?? raw.TrialEndsAt ?? null) as string | null,
    currentPeriodEnd: (raw.currentPeriodEnd ?? raw.CurrentPeriodEnd ?? null) as string | null,
  }
}

/**
 * Prefer `business.subscriptions[]` from /userprofile/me.
 * Falls back to legacy single `subscription` / `business.subscription`.
 */
function normalizeSubscriptions(raw: LooseObject | null | undefined): UserSubscription[] {
  const business = raw?.business as LooseObject | undefined
  const list = business?.subscriptions ?? business?.Subscriptions ?? raw?.subscriptions ?? raw?.Subscriptions

  if (Array.isArray(list)) {
    return list
      .map((item) => normalizeOneSubscription(item as LooseObject))
      .filter((item): item is UserSubscription => item != null)
  }

  const legacy =
    normalizeOneSubscription(
      (raw?.subscription ??
        raw?.Subscription ??
        business?.subscription ??
        business?.Subscription) as LooseObject | undefined,
    )
  return legacy ? [legacy] : []
}

/** Sidebar / Touch default: TipPlatform only — never VoiceAI (AI Hub plans). */
function pickDefaultSubscription(subscriptions: UserSubscription[]): UserSubscription | null {
  return getTipPlatformSubscription({ subscriptions })
}

function normalizeUserProfile(response: UserProfile): UserProfile {
  const subscriptions = normalizeSubscriptions(response as LooseObject)
  const subscription = pickDefaultSubscription(subscriptions)
  const profileImageUrl = getUserProfileImageUrl(response)
  const raw = response as LooseObject
  const createdAt =
    (typeof raw.createdAt === 'string' && raw.createdAt) ||
    (typeof raw.CreatedAt === 'string' && raw.CreatedAt) ||
    null

  // Keep business.subscriptions aligned with normalized rows for callers that read nested shape.
  const business = response.business
    ? {
        ...response.business,
        subscriptions,
      }
    : response.business

  return {
    ...response,
    business,
    subscriptions,
    ...(subscription ? { subscription } : { subscription: null }),
    ...(profileImageUrl ? { profileImageUrl } : {}),
    createdAt,
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
