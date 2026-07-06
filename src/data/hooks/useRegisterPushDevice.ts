import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { registerPushDeviceOnDashboardVisit } from '../../native/onesignal'
import { pushDeviceTrace } from '../../native/pushDeviceTrace'

/**
 * Registers the OneSignal player id with BE each time the user visits dashboard.
 * Owner: /dashboard/* — Staff: /staff/*
 */
export function useRegisterPushDeviceOnVisit() {
  const { session, status } = useAuth()
  const location = useLocation()

  useEffect(() => {
    pushDeviceTrace('hook.effect', {
      pathname: location.pathname,
      status,
      userId: session?.id ?? null,
    })

    if (status !== 'authenticated' || !session?.id) {
      pushDeviceTrace('hook.skip', { reason: 'not-authenticated' })
      return
    }

    const isDashboardRoute = location.pathname.startsWith('/dashboard')
      || location.pathname.startsWith('/staff')
    if (!isDashboardRoute) {
      pushDeviceTrace('hook.skip', { reason: 'not-dashboard-route', pathname: location.pathname })
      return
    }

    void registerPushDeviceOnDashboardVisit(session.id)
  }, [location.pathname, session?.id, status])
}

export default useRegisterPushDeviceOnVisit
