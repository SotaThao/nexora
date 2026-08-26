/**
 * mockAuthAdapter — Zero-Backend & Demo Account Authentication Adapter.
 */
import type { AuthAdapter, AuthSession, LoginCredentials } from '../../types/auth'

const DEMO_SESSION_KEY = 'nexora:demo:session'

export const DEMO_OWNER_SESSION: AuthSession = {
  id: 'demo_owner_1',
  email: 'demo@nexoratouch.com',
  accountType: 'business',
  flag: 'active',
  displayName: 'Luxury Nail & Spa Boutique',
  role: 'owner',
  verificationStatus: 'kyb_approved',
  hasCompletedOnboarding: true,
  hasStaffProfile: false,
}

export const mockAuthAdapter: AuthAdapter = {
  async getSession(): Promise<AuthSession | null> {
    try {
      const raw = localStorage.getItem(DEMO_SESSION_KEY)
      if (raw) {
        return JSON.parse(raw) as AuthSession
      }
    } catch {}
    return null
  },

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const session: AuthSession = {
      ...DEMO_OWNER_SESSION,
      email: credentials.email || DEMO_OWNER_SESSION.email,
    }
    try {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session))
    } catch {}
    return session
  },

  async logout(): Promise<void> {
    try {
      localStorage.removeItem(DEMO_SESSION_KEY)
    } catch {}
  },

  async refreshSession(): Promise<AuthSession | null> {
    return this.getSession()
  },
}

export default mockAuthAdapter