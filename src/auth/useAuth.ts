/**
 * useAuth — consume the AuthContext.
 * Exposes: { session, status, login, logout }
 *
 * status: 'loading' | 'authenticated' | 'anonymous'
 * session: null | { id, email, accountType, flag, displayName, role, staffId, verificationStatus, ssoPrefillData, ... }
 */
import { useContext } from 'react'
import { AuthContext } from './AuthProvider'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be called inside <AuthProvider>')
  }
  return ctx
}

export default useAuth
