/**
 * Auth header sync for homepage — used by HomePageBridgeProvider.
 * Plan CTA routing for pricing / consulting buttons.
 */
import type { AuthSession } from '../../types/auth'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

/** @deprecated Header auth UI is React-driven in HomePageHeaderSection. */
export function syncHomePageAuthHeader(
  _session: AuthSession | null,
  _status: AuthStatus,
  _navigate: (path: string) => void,
) {
  // no-op — logged-in header is rendered by React
}

export function navigateHomePagePlanCta(
  session: AuthSession | null,
  status: AuthStatus,
  navigate: (path: string) => void,
) {
  if (status === 'loading') return
  if (status === 'authenticated' && session) {
    navigate('/dashboard/support')
    return
  }
  navigate('/login')
}
