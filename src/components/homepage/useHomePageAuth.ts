/**
 * Auth header sync for homepage — used by HomePageBridgeProvider.
 * Plan CTA routing for pricing / consulting buttons.
 */
import type { AuthSession } from '../../types/auth'
import { buildDashboardMenuPath, DASHBOARD_MENU_ID } from '../dashboard/constants'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

const SELF_SERVICE_PAID_PLAN_IDS = new Set(['starter', 'pro'])

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
  planId?: string,
) {
  if (status === 'loading') return
  if (status === 'authenticated' && session) {
    if (planId && SELF_SERVICE_PAID_PLAN_IDS.has(planId)) {
      navigate(`${buildDashboardMenuPath(DASHBOARD_MENU_ID.subscriptions)}?plan=${planId}`)
      return
    }
    navigate('/dashboard/support')
    return
  }
  navigate('/login')
}
