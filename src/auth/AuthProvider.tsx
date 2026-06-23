/**
 * AuthProvider — wraps the app to provide auth state via React Context.
 *
 * Exposes via context:
 *   session  — null when anonymous, otherwise the session object from the adapter
 *   status   — 'loading' | 'authenticated' | 'anonymous'
 *   login(credentials) — calls adapter.login(); resolves or throws on failure
 *   logout()           — calls adapter.logout(); clears session
 *   refreshSession()   — re-fetches session from the adapter
 *
 * The adapter is apiAuthAdapter (API-only mode).
 *
 * Session shape (transport-agnostic — no password/token ever appears here):
 *   { id, email, accountType, flag, displayName, role, staffId,
 *     verificationStatus, ssoPrefillData }
 */
import React, { useState, useEffect, useCallback, type ReactNode } from 'react'
import { authAdapter } from './adapters'
import { tokenStore } from './tokenStore'
import { AuthContext } from './AuthContext'
import type { AuthSession, AuthStatus, LoginCredentials } from '../types/auth'

export { AuthContext } from './AuthContext'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  // Shared promise to deduplicate concurrent getSession() calls
  const sessionPromiseRef = React.useRef(null)

  const resolveSession = useCallback(() => {
    if (!sessionPromiseRef.current) {
      sessionPromiseRef.current = authAdapter.getSession()
        .then((existing) => {
          setSession(existing || null)
          setStatus(existing ? 'authenticated' : 'anonymous')
          return existing
        })
        .catch(() => {
          setSession(null)
          setStatus('anonymous')
          return null
        })
        .finally(() => {
          sessionPromiseRef.current = null
        })
    }
    return sessionPromiseRef.current
  }, [])

  // On mount: restore session from the adapter (single call)
  useEffect(() => {
    resolveSession()
  }, [resolveSession])

  // Subscribe to tokenStore updates — when tokens are cleared (e.g. 401
  // refresh failure), transition to anonymous without a page reload.
  useEffect(() => {
    const unsubscribe = tokenStore.subscribe((tokens) => {
      if (!tokens) {
        setSession(null)
        setStatus('anonymous')
      } else {
        // Only fetch session if we don't have one yet
        setSession((prev) => {
          if (!prev) resolveSession()
          return prev
        })
      }
    })

    return unsubscribe
  }, [resolveSession])

  const login = useCallback(async (credentials: LoginCredentials) => {
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

  const refreshSession = useCallback(async () => {
    try {
      const existing = await authAdapter.getSession()
      setSession(existing || null)
      setStatus(existing ? 'authenticated' : 'anonymous')
      return existing
    } catch (err) {
      setSession(null)
      setStatus('anonymous')
      throw err
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, status, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider

