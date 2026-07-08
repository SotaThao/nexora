/**
 * Auth header sync for homepage — used by HomePageBridgeProvider.
 * Plan CTA routing for pricing / consulting buttons.
 */
import type { AuthSession } from '../../types/auth'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export function syncHomePageAuthHeader(
  session: AuthSession | null,
  status: AuthStatus,
  navigate: (path: string) => void,
) {
  if (status === 'loading' || status === 'authenticated') return

  const authGroup = document.getElementById('header-auth-group')
  const userBadge = document.getElementById('header-user-badge')
  const userNameEl = document.getElementById('header-user-name')

  authGroup?.classList.remove('hidden')
  userNameEl?.classList.remove('hidden')
  userBadge?.classList.add('hidden')
  userBadge?.style.removeProperty('display')
  document.getElementById('_nx_dashboard_link')?.remove()
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
