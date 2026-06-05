/**
 * AuthProvider — wraps the app to provide auth state via React Context.
 *
 * Exposes via context:
 *   session  — null when anonymous, otherwise the session object from the adapter
 *   status   — 'loading' | 'authenticated' | 'anonymous'
 *   login(credentials) — calls adapter.login(); resolves or throws on failure
 *   logout()           — calls adapter.logout(); clears session
 *
 * The adapter is selected once at module load via VITE_DATA_SOURCE:
 *   storage (default) → mockAuthAdapter
 *   api               → apiAuthAdapter (stub; throws NotImplemented)
 *
 * Session shape (transport-agnostic — no password/token ever appears here):
 *   { id, email, accountType, flag, displayName, role, staffId,
 *     verificationStatus, ssoPrefillData, clearMerchantSetup?,
 *     clearProfileSettings?, routeToDashboard? }
 */
import React, { createContext, useState, useEffect, useCallback } from 'react'
import { authAdapter } from './adapters/index'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('loading')

  // On mount: restore session from the adapter (mirrors today's mount behavior)
  useEffect(() => {
    authAdapter.getSession().then((existing) => {
      setSession(existing || null)
      setStatus(existing ? 'authenticated' : 'anonymous')
    }).catch(() => {
      setSession(null)
      setStatus('anonymous')
    })
  }, [])

  const login = useCallback(async (credentials) => {
    const newSession = await authAdapter.login(credentials)
    setSession(newSession)
    setStatus('authenticated')
    return newSession
  }, [])

  const logout = useCallback(async () => {
    await authAdapter.logout()
    setSession(null)
    setStatus('anonymous')
  }, [])

  return (
    <AuthContext.Provider value={{ session, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
