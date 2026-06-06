import { tokenStore } from '../tokenStore'
import httpClient from '../../lib/httpClient'

function mapProfileToSession(profile) {
  if (!profile) return null

  let accountType = 'personal'
  let flag = '!personal'
  let role = 'staff'

  if (profile.profileType === 'Merchant') {
    accountType = 'business'
    flag = '!business'
    role = 'owner'
  }

  const displayName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || profile.email

  return {
    id: profile.id,
    email: profile.email,
    accountType,
    flag,
    displayName,
    role,
    staffId: null,
    verificationStatus: profile.status,
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
      return mapProfileToSession(profile)
    } catch (err) {
      console.error('Failed to get session profile:', err)
      tokenStore.clear()
      return null
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
