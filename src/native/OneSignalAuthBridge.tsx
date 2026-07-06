import { useEffect, useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { syncOneSignalUser } from './onesignal'

/**
 * Keeps OneSignal external user id in sync with the authenticated session.
 * Does NOT call OneSignal.logout() on cold-start anonymous state — that would
 * wipe the anonymous subscription created during initOneSignal().
 */
export default function OneSignalAuthBridge() {
  const { session, status } = useAuth()
  const resolvedUserIdRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (status === 'loading') return

    const nextUserId = status === 'authenticated' ? session?.id ?? null : null
    const previousUserId = resolvedUserIdRef.current

    if (previousUserId === undefined) {
      resolvedUserIdRef.current = nextUserId
      if (nextUserId) void syncOneSignalUser(nextUserId)
      return
    }

    if (previousUserId === nextUserId) return

    resolvedUserIdRef.current = nextUserId
    void syncOneSignalUser(nextUserId)
  }, [session?.id, status])

  return null
}
