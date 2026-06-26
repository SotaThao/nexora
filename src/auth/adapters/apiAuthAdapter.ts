import { tokenStore } from '../tokenStore'
import httpClient from '../../lib/httpClient'
import { clearAuthQueryCache, seedAuthQueryCache } from '../../data/seedAuthQueryCache'
import profileSettingsRepository from '../../data/repositories/profileSettings'
import { logger } from '../../utils/logger'

import type {
  AuthSession,
  AuthTokens,
  LoginCredentials,
  SignupCredentials,
  SignupResponse,
} from '../../types/auth'
import type { StaffProfile, UserProfile } from '../../types/domain'
import { isApiError } from '../../types/domain'
import { mapUserVerifyStatusToKybStatus } from '../../utils/kybStatus'

export { mapUserVerifyStatusToKybStatus } from '../../utils/kybStatus'

// /api/v1/userprofile/me returns `userType`; /api/v1/userprofile/verified-status returns `profileType`.
// Both fields are checked so either endpoint's response shape is accepted.
const PROFILE_TYPE_MERCHANT = 'Merchant'

// KYB status sentinel returned when no explicit status is available.
const KYB_STATUS_BASIC = 'basic'

// Session account types and roles.
const ACCOUNT_TYPE = { PERSONAL: 'personal', BUSINESS: 'business' } as const
const ROLE = { STAFF: 'staff', OWNER: 'owner' } as const

type KybSource = Record<string, unknown> | string | number | null | undefined

function isBusinessProfile(profile: UserProfile | null | undefined): boolean {
  return (
    profile?.userType === PROFILE_TYPE_MERCHANT ||
    profile?.profileType === PROFILE_TYPE_MERCHANT
  )
}

function normalizeKybStatus(
  value: KybSource,
  { isExplicitKybField = false }: { isExplicitKybField?: boolean } = {},
): string | null {
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

function extractKybStatus(source: KybSource): string | null {
  if (source === undefined || source === null) return null
  if (typeof source !== 'object') return normalizeKybStatus(source)

  const record = source as Record<string, unknown>
  const profileType = String(record.profileType ?? record.userType ?? '').trim().toLowerCase()
  const isMerchant = profileType === PROFILE_TYPE_MERCHANT.toLowerCase()
  const status = String(record.status ?? '').trim().toLowerCase()

  if (
    isMerchant &&
    (record.isKycVerified === true ||
      record.isKYCVerified === true ||
      record.isKybVerified === true ||
      record.isKYBVerified === true)
  ) {
    return 'kyb_approved'
  }

  const explicitKybKeys = [
    'businessKybStatus',
    'kybStatus',
    'kybVerificationStatus',
    'businessVerificationStatus',
  ]

  for (const key of explicitKybKeys) {
    const status = normalizeKybStatus(record[key] as KybSource, { isExplicitKybField: true })
    if (status) return status
  }

  if (isMerchant) {
    const verifyStatus = mapUserVerifyStatusToKybStatus(record.status)
    if (verifyStatus) return verifyStatus
  }

  return (
    normalizeKybStatus(record.verificationStatus as KybSource) ||
    normalizeKybStatus(record.verifiedStatus as KybSource) ||
    normalizeKybStatus(record.status as KybSource)
  )
}

async function getBusinessKybStatus(profile: UserProfile): Promise<string> {
  const profileKybStatus = extractKybStatus(profile)
  if (profileKybStatus) return profileKybStatus

  try {
    const verifiedStatus = await httpClient.get<Record<string, unknown>>(
      '/api/v1/userprofile/verified-status',
    )
    return extractKybStatus(verifiedStatus) || KYB_STATUS_BASIC
  } catch (err) {
    logger.error('Failed to fetch business KYB status', err)
    return KYB_STATUS_BASIC
  }
}

/**
 * Check whether the authenticated merchant has already created a business
 * profile via POST /api/v1/merchant/business.
 *
 * Returns false only on an explicit 404 / 403 / BUSINESS_NOT_FOUND response,
 * which means the business profile does not exist yet (SSO first-login,
 * incomplete registration, etc.). For any other error we optimistically
 * return true so a transient network hiccup does not force the user back
 * into the onboarding wizard.
 */
async function checkBusinessProfileExists(): Promise<boolean> {
  try {
    const res = await httpClient.get<Record<string, unknown>>('/api/v1/merchant/business')
    return Boolean(res && (res as Record<string, unknown>).id)
  } catch (err: unknown) {
    if (
      isApiError(err) &&
      (err.status === 404 ||
        err.status === 403 ||
        (err as Record<string, unknown>).errorCode === 'BUSINESS_NOT_FOUND')
    ) {
      return false
    }
    logger.error('Failed to check business profile existence', err)
    return true
  }
}

/**
 * Fetch the authenticated user's own StaffProfile (live Swagger:
 * GET /api/v1/staff/profile → StaffProfileDto { staffCode, displayName, ... }).
 * Returns null when no StaffProfile is linked (404 STAFF_PROFILE_NOT_FOUND).
 */
let getStaffProfilePromise: Promise<StaffProfile | null> | null = null

async function fetchStaffProfile(): Promise<StaffProfile | null> {
  if (!getStaffProfilePromise) {
    getStaffProfilePromise = (async () => {
      try {
        return await httpClient.get<StaffProfile>('/api/v1/staff/profile')
      } catch (err: unknown) {
        if (!isApiError(err) || err.status !== 404) {
          logger.error('Failed to fetch staff profile', err)
        }
        return null
      }
    })().finally(() => {
      getStaffProfilePromise = null
    })
  }
  return getStaffProfilePromise
}

function mapProfileToSession(
  profile: UserProfile,
  kybStatus: string | null,
  staffProfile: StaffProfile | null = null,
  hasBusiness: boolean = true,
): AuthSession {
  let accountType: string = ACCOUNT_TYPE.PERSONAL
  let flag = `!${ACCOUNT_TYPE.PERSONAL}`
  let role: string = ROLE.STAFF

  if (isBusinessProfile(profile)) {
    accountType = ACCOUNT_TYPE.BUSINESS
    flag = `!${ACCOUNT_TYPE.BUSINESS}`
    role = ROLE.OWNER
  }

  const displayName =
    `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || (profile.email as string)
  const isBusiness = accountType === ACCOUNT_TYPE.BUSINESS
  const accountStatus = (profile.status as string | undefined) || null

  return {
    id: profile.id as string,
    email: profile.email as string,
    accountType,
    flag,
    displayName,
    role,
    staffId:
      staffProfile?.staffCode ||
      (profile.staffCode as string | undefined) ||
      (profile.staffProfileId as string | undefined) ||
      (profile.staffId as string | undefined) ||
      null,
    hasStaffProfile: Boolean(staffProfile),
    staffCode: staffProfile?.staffCode || null,
    accountStatus,
    // For business accounts, the business profile must exist before onboarding
    // can be considered complete. This ensures SSO users (and any merchant
    // whose profile was never created) are redirected to /onboarding rather
    // than landing on an empty dashboard.
    hasCompletedOnboarding: isBusiness
      ? hasBusiness &&
        (accountStatus === 'Active' ||
          kybStatus === 'kyb_approved' ||
          Boolean(profile.hasCompletedOnboarding))
      : Boolean(
          ((profile.firstName ?? '') as string).trim() ||
            ((profile.lastName ?? '') as string).trim(),
        ),
    verificationStatus: isBusiness
      ? kybStatus || KYB_STATUS_BASIC
      : (profile.status as string | undefined) || 'unverified',
    ssoPrefillData: null,
    hasBusiness: isBusiness ? hasBusiness : undefined,
  }
}

let getProfilePromise: Promise<UserProfile> | null = null
let getSessionPromise: Promise<AuthSession | null> | null = null

async function resolveAuthSession(): Promise<AuthSession | null> {
  const tokens = tokenStore.get()
  if (!tokens || !tokens.accessToken) {
    return null
  }

  if (!getProfilePromise) {
    getProfilePromise = profileSettingsRepository
      .get()
      .then((profile) => {
        if (!profile) {
          throw new Error('User profile not found')
        }
        return profile
      })
      .finally(() => {
        getProfilePromise = null
      })
  }
  const profile = await getProfilePromise
  const isBusiness = isBusinessProfile(profile)

  // For business accounts run both checks in parallel to avoid sequential latency.
  const [kybStatus, hasBusiness] = await Promise.all([
    isBusiness ? getBusinessKybStatus(profile) : Promise.resolve<string | null>(null),
    isBusiness ? checkBusinessProfileExists() : Promise.resolve(true),
  ])

  const staffProfile = isBusiness ? null : await fetchStaffProfile()
  seedAuthQueryCache({ userProfile: profile, staffProfile })
  return mapProfileToSession(profile, kybStatus, staffProfile, hasBusiness)
}

export const apiAuthAdapter = {
  async login({ email, password }: LoginCredentials): Promise<AuthSession | null> {
    const res = await httpClient.post<AuthTokens>(
      '/api/v1/authentication/signin',
      { email, password },
      { anonymous: true },
    )

    tokenStore.set({
      accessToken: (res as AuthTokens).accessToken,
      refreshToken: (res as AuthTokens).refreshToken,
      tokenType: (res as AuthTokens).tokenType,
      expiresIn: (res as AuthTokens).expiresIn,
    })

    return this.getSession()
  },

  async signInForInviteAccept({ email, password }: LoginCredentials): Promise<void> {
    const res = await httpClient.post<AuthTokens>(
      '/api/v1/authentication/signin',
      { email, password },
      { anonymous: true },
    )

    tokenStore.set(
      {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        tokenType: res.tokenType,
        expiresIn: res.expiresIn,
      },
      { silent: true },
    )
  },

  async getSession(): Promise<AuthSession | null> {
    if (!getSessionPromise) {
      getSessionPromise = (async () => {
        try {
          return await resolveAuthSession()
        } catch (err: unknown) {
          logger.error('Failed to get session profile', err)
          if (isApiError(err) && (err.status === 401 || err.status === 403)) {
            tokenStore.clear()
            return null
          }
          throw err
        }
      })().finally(() => {
        getSessionPromise = null
      })
    }
    return getSessionPromise
  },

  async refreshSession(): Promise<AuthSession | null> {
    const tokens = tokenStore.get()
    if (!tokens?.refreshToken) {
      return this.getSession()
    }
    const res = await httpClient.post<AuthTokens>(
      '/api/v1/authentication/refresh-token',
      { refreshToken: tokens.refreshToken },
      { anonymous: true },
    )
    tokenStore.set(res as any)
    return this.getSession()
  },

  async logout(): Promise<void> {
    tokenStore.clear()
    clearAuthQueryCache()
  },

  async signup(credentials: SignupCredentials): Promise<SignupResponse | null> {
    const { email, confirmEmail, password, confirmPassword, firstName, lastName, type, profileType, referralCode } =
      credentials
    const trimmedReferralCode = referralCode?.trim()
    return httpClient.post<SignupResponse>(
      '/api/v1/authentication/signup',
      {
        email,
        confirmEmail,
        password,
        confirmPassword,
        firstName,
        lastName,
        type: type || profileType,
        ...(trimmedReferralCode ? { referralCode: trimmedReferralCode } : {}),
      },
      { anonymous: true },
    )
  },

  async verifyEmail({ token, email }: { token: string; email: string }): Promise<unknown> {
    return httpClient.post(
      '/api/v1/authentication/verify-email',
      { token, email },
      { anonymous: true },
    )
  },

  async resendVerificationEmail({ email }: { email: string }): Promise<unknown> {
    return httpClient.post(
      '/api/v1/authentication/send-verification-email',
      { email },
      { anonymous: true },
    )
  },

  async forgotPassword({ email }: { email: string }): Promise<unknown> {
    return httpClient.post(
      '/api/v1/authentication/forgot-password',
      { email },
      { anonymous: true },
    )
  },

  async resetPassword({
    token,
    email,
    newPassword,
    confirmPassword,
  }: {
    token: string
    email: string
    newPassword: string
    confirmPassword: string
  }): Promise<unknown> {
    return httpClient.post(
      '/api/v1/authentication/reset-password',
      { token, email, newPassword, confirmPassword },
      { anonymous: true },
    )
  },
}

export default apiAuthAdapter
