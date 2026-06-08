import { tokenStore } from '../tokenStore'
import httpClient from '../../lib/httpClient'
import { logger } from '../../utils/logger'

function isBusinessProfile(profile) {
  // TODO(backend-bug B1): the email-keyword fallback below is a temporary workaround for the
  // backend not persisting `profileType` on signup (every account comes back as `User`).
  // Remove `isMerchantEmail` and rely solely on `profile.profileType === 'Merchant'` once the
  // backend returns the real profileType from /api/v1/userprofile/me. See API/backend-api-gaps.md.
  const isMerchantEmail = profile?.email?.toLowerCase().includes('biz') || profile?.email?.toLowerCase().includes('merchant')
  return profile?.profileType === 'Merchant' || isMerchantEmail
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
    const verifiedStatus = await httpClient.get('/api/v1/userprofile/verified-status')
    return extractKybStatus(verifiedStatus) || 'basic'
  } catch (err) {
    logger.error('Failed to fetch business KYB status', err)
    return 'basic'
  }
}

function mapProfileToSession(profile, kybStatus) {
  if (!profile) return null

  let accountType = 'personal'
  let flag = '!personal'
  let role = 'staff'

  // Backend currently returns userType: 'User' for both Merchant and Staff.
  // As a fallback for dev/testing, if the email contains 'biz' or 'merchant', we treat them as Merchant.
  if (isBusinessProfile(profile)) {
    accountType = 'business'
    flag = '!business'
    role = 'owner'
  }

  const displayName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || profile.email
  const isBusiness = accountType === 'business'
  const accountStatus = profile.status || null

  return {
    id: profile.id,
    email: profile.email,
    accountType,
    flag,
    displayName,
    role,
    staffId: null,
    accountStatus,
    hasCompletedOnboarding: isBusiness
      ? accountStatus === 'Active' || kybStatus === 'kyb_approved' || !!profile.hasCompletedOnboarding
      : undefined,
    verificationStatus: isBusiness ? (kybStatus || 'basic') : (profile.status || 'unverified'),
    ssoPrefillData: null,
  }
}

let getProfilePromise = null

export const apiAuthAdapter = {
  async login({ email, password }) {
    const res = await httpClient.post(
      '/api/v1/authentication/signin',
      { email, password },
      { anonymous: true }
    )

    tokenStore.set({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      tokenType: res.tokenType,
      expiresIn: res.expiresIn,
    })

    return this.getSession()
  },

  async getSession() {
    const tokens = tokenStore.get()
    if (!tokens || !tokens.accessToken) {
      return null
    }

    try {
      if (!getProfilePromise) {
        getProfilePromise = httpClient.get('/api/v1/userprofile/me').finally(() => {
          getProfilePromise = null
        })
      }
      const profile = await getProfilePromise
      const isBusiness = isBusinessProfile(profile)
      const kybStatus = isBusiness ? await getBusinessKybStatus(profile) : null
      return mapProfileToSession(profile, kybStatus)
    } catch (err) {
      logger.error('Failed to get session profile', err)
      if (err?.status === 401 || err?.status === 403) {
        tokenStore.clear()
        return null
      }
      throw err
    }
  },

  async logout() {
    tokenStore.clear()
  },

  async signup({ email, confirmEmail, password, confirmPassword, firstName, lastName, profileType }) {
    return httpClient.post(
      '/api/v1/authentication/signup',
      { email, confirmEmail, password, confirmPassword, firstName, lastName, profileType },
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
