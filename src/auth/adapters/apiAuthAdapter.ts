import { tokenStore } from '../tokenStore'
import httpClient from '../../lib/httpClient'
import { logger } from '../../utils/logger'
import profileSettingsRepository from '../../data/repositories/profileSettings'
import type { AuthSession, AuthTokens, UserProfile } from '../../types/domain'
import { isApiError } from '../../types/domain'

// /api/v1/userprofile/me returns `userType`; /api/v1/userprofile/verified-status returns `profileType`.
// Both fields are checked so either endpoint's response shape is accepted.
const PROFILE_TYPE_MERCHANT = 'Merchant'

// KYB status sentinel returned when no explicit status is available.
const KYB_STATUS_BASIC = 'basic'

// Session account types and roles.
const ACCOUNT_TYPE = { PERSONAL: 'personal', BUSINESS: 'business' }
const ROLE = { STAFF: 'staff', OWNER: 'owner' }

function isBusinessProfile(profile) {
  return (
    profile?.userType === PROFILE_TYPE_MERCHANT ||
    profile?.profileType === PROFILE_TYPE_MERCHANT
  )
}

function normalizeKybStatus(value, { isExplicitKybField = false } = {}) {
  if (value === undefined || value === null) return null

  const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (!normalized) return null

  if (
    normalized === 'kyb_approved' ||
    normalized === 'business_kyb_approved' ||
    normalized === 'verified_pro'
  ) {
    return 'kyb_approved'
  }

  if (normalized === 'verified_lite' || normalized === 'lite_pending' || normalized === 'pro_pending') {
    return normalized
  }

  if (isExplicitKybField) {
    if (normalized === 'approved') return 'kyb_approved'
    if (normalized === 'pending') return 'kyb_pending'
    if (normalized === 'rejected' || normalized === 'declined') return 'kyb_rejected'
  }

  if (normalized.startsWith('kyb_')) return normalized

  return null
}

function extractKybStatus(source) {
  if (source === undefined || source === null) return null
  if (typeof source !== 'object') return normalizeKybStatus(source)

  const explicitKybKeys = [
    'businessKybStatus',
    'kybStatus',
    'kybVerificationStatus',
    'businessVerificationStatus'
  ]

  for (const key of explicitKybKeys) {
    const status = normalizeKybStatus(source[key], { isExplicitKybField: true })
    if (status) return status
  }

  return (
    normalizeKybStatus(source.verificationStatus) ||
    normalizeKybStatus(source.verifiedStatus) ||
    normalizeKybStatus(source.status)
  )
}

async function getBusinessKybStatus(profile) {
  const profileKybStatus = extractKybStatus(profile)
  if (profileKybStatus) return profileKybStatus

  try {
    const verifiedStatus = await profileSettingsRepository.getVerifiedStatus()
    return extractKybStatus(verifiedStatus) || KYB_STATUS_BASIC
  } catch (err) {
    logger.error('Failed to fetch business KYB status', err)
    return KYB_STATUS_BASIC
  }
}

/**
 * Fetch the authenticated user's own StaffProfile (live Swagger:
 * GET /api/v1/staff/profile → StaffProfileDto { staffCode, displayName, ... }).
 * Returns null when no StaffProfile is linked (404 STAFF_PROFILE_NOT_FOUND).
 */
async function fetchStaffProfile(): Promise<UserProfile | null> {
  try {
    return await httpClient.get('/api/v1/staff/profile')
  } catch (err) {
    if (!(isApiError(err) && err.status === 404)) {
      logger.error('Failed to fetch staff profile', err)
    }
    return null
  }
}

function mapProfileToSession(profile, kybStatus, staffProfile = null) {
  if (!profile) return null

  let accountType = ACCOUNT_TYPE.PERSONAL
  let flag = `!${ACCOUNT_TYPE.PERSONAL}`
  let role = ROLE.STAFF

  // Backend currently returns userType: 'User' for both Merchant and Staff.
  // As a fallback for dev/testing, if the email contains 'biz' or 'merchant', we treat them as Merchant.
  if (isBusinessProfile(profile)) {
    accountType = ACCOUNT_TYPE.BUSINESS
    flag = `!${ACCOUNT_TYPE.BUSINESS}`
    role = ROLE.OWNER
  }

  const displayName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || profile.email
  const isBusiness = accountType === ACCOUNT_TYPE.BUSINESS
  const accountStatus = profile.status || null

  return {
    id: profile.id,
    email: profile.email,
    accountType,
    flag,
    displayName,
    role,
    staffId: staffProfile?.staffCode || profile.staffCode || profile.staffProfileId || profile.staffId || null,
    hasStaffProfile: Boolean(staffProfile),
    staffCode: staffProfile?.staffCode || null,
    accountStatus,
    hasCompletedOnboarding: isBusiness
      ? accountStatus === 'Active' || kybStatus === 'kyb_approved' || !!profile.hasCompletedOnboarding
      // Personal/staff: onboarding counts as completed only when the personal
      // data was actually persisted to the backend (PUT /userprofile/update
      // during the invite wizard / register flow).
      : Boolean(((profile.firstName ?? '').trim() || (profile.lastName ?? '').trim())),
    verificationStatus: isBusiness ? (kybStatus || KYB_STATUS_BASIC) : (profile.status || 'unverified'),
    ssoPrefillData: null,
  }
}


export const apiAuthAdapter = {
  async login({ email, password }: { email: string; password: string }): Promise<AuthSession | null> {
    const res = await httpClient.post(
      '/api/v1/authentication/signin',
      { email, password },
      { anonymous: true }
    )

    tokenStore.set({
      accessToken: (res as AuthTokens).accessToken,
      refreshToken: (res as AuthTokens).refreshToken,
      tokenType: (res as AuthTokens).tokenType,
      expiresIn: (res as AuthTokens).expiresIn,
    })

    return this.getSession()
  },

  async getSession(): Promise<AuthSession | null> {
    const tokens = tokenStore.get()
    if (!tokens || !tokens.accessToken) {
      return null
    }

    try {
      const profile = await profileSettingsRepository.get()
      const isBusiness = isBusinessProfile(profile)
      const kybStatus = isBusiness ? await getBusinessKybStatus(profile) : null
      const staffProfile = isBusiness ? null : await fetchStaffProfile()
      return mapProfileToSession(profile, kybStatus, staffProfile)
    } catch (err) {
      logger.error('Failed to get session profile', err)
      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        tokenStore.clear()
        return null
      }
      throw err
    }
  },

  // Force a token refresh, then return the freshly resolved session.
  // Use this after an action that changes the user's server-side claims
  // (e.g. accepting a staff invite links a Staff Profile): the access token
  // minted at login predates those claims, so staff-scoped endpoints would
  // otherwise 404 (STAFF_PROFILE_NOT_FOUND) until the token is reissued.
  async refreshSession(): Promise<AuthSession | null> {
    const tokens = tokenStore.get()
    if (!tokens?.refreshToken) {
      return this.getSession()
    }
    const res = await httpClient.post(
      '/api/v1/authentication/refresh-token',
      { refreshToken: tokens.refreshToken },
      { anonymous: true }
    )
    tokenStore.set(res as any)
    return this.getSession()
  },

  async logout(): Promise<void> {
    tokenStore.clear()
  },

  async signup({ email, confirmEmail, password, confirmPassword, firstName, lastName, type, profileType }) {
    return httpClient.post(
      '/api/v1/authentication/signup',
      { email, confirmEmail, password, confirmPassword, firstName, lastName, type: type || profileType },
      { anonymous: true }
    )
  },

  async verifyEmail({ token, email }) {
    return httpClient.post(
      '/api/v1/authentication/verify-email',
      { token, email },
      { anonymous: true }
    )
  },

  async resendVerificationEmail({ email }) {
    return httpClient.post(
      '/api/v1/authentication/send-verification-email',
      { email },
      { anonymous: true }
    )
  },

  async forgotPassword({ email }) {
    return httpClient.post(
      '/api/v1/authentication/forgot-password',
      { email },
      { anonymous: true }
    )
  },

  async resetPassword({ token, email, newPassword, confirmPassword }) {
    return httpClient.post(
      '/api/v1/authentication/reset-password',
      { token, email, newPassword, confirmPassword },
      { anonymous: true }
    )
  },
}

export default apiAuthAdapter
