/**
 * useAuth — consume the AuthContext.
 * Exposes: { session, status, login, logout }
 *
 * status: 'loading' | 'authenticated' | 'anonymous'
 * session: null | { id, email, accountType, flag, displayName, role, staffId, verificationStatus, ssoPrefillData, ... }
 */
import { useContext } from 'react'
import { AuthContext } from './AuthProvider'
import type { AuthSession } from '../types/domain'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  session: AuthSession | null
  status: AuthStatus
  login: (credentials: { email: string; password: string }) => Promise<AuthSession | null>
  logout: () => Promise<void>
  refreshSession: () => Promise<AuthSession | null>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be called inside <AuthProvider>')
  }
  return ctx
}

export default useAuth
