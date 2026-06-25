/**
 * Auth header sync for homepage — used by HomePageBridgeProvider.
 * Plan CTA routing for pricing / consulting buttons.
 */
import { getStoredAppLanguage } from '../../utils/appLanguage'
import type { AuthSession } from '../../types/auth'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

function dashboardPathForSession(session: AuthSession): string {
  const isStaffSession =
    session.flag === '!personal' ||
    session.role === 'personal' ||
    session.role === 'staff'
  return isStaffSession ? '/staff' : '/dashboard'
}

export function syncHomePageAuthHeader(
  session: AuthSession | null,
  status: AuthStatus,
  navigate: (path: string) => void,
) {
  if (status === 'loading') return

  const authGroup = document.getElementById('header-auth-group')
  const userBadge = document.getElementById('header-user-badge')
  const userNameEl = document.getElementById('header-user-name')
  const isAuthenticated = status === 'authenticated' && session

  if (isAuthenticated) {
    userNameEl?.classList.add('hidden')

    const dashPath = dashboardPathForSession(session)
    let dashLink = document.getElementById('_nx_dashboard_link') as HTMLAnchorElement | null
    const actionsEl = document.getElementById('header-user-actions')

    if (!dashLink && (actionsEl || userBadge)) {
      dashLink = document.createElement('a')
      dashLink.id = '_nx_dashboard_link'
      dashLink.className = 'header-user-chip header-user-chip--primary'
      const logoutBtn = actionsEl?.querySelector('button') ?? userBadge?.querySelector('button')
      if (actionsEl && logoutBtn) actionsEl.insertBefore(dashLink, logoutBtn)
      else if (logoutBtn) logoutBtn.before(dashLink)
      else (actionsEl ?? userBadge)?.appendChild(dashLink)
    }

    if (dashLink) {
      const key = dashPath === '/staff' ? 'header-staff' : 'header-dashboard'
      const lang = getStoredAppLanguage()
      const labels: Record<string, Record<string, string>> = {
        en: { 'header-dashboard': 'Dashboard', 'header-staff': 'Staff' },
        vi: { 'header-dashboard': 'Tổng quan', 'header-staff': 'Cổng thợ' },
      }
      dashLink.textContent = labels[lang][key] ?? labels.en[key]
      dashLink.href = dashPath
      dashLink.onclick = (e) => {
        e.preventDefault()
        navigate(dashPath)
      }
    }

    authGroup?.classList.add('hidden')
    userBadge?.classList.remove('hidden')
  } else {
    authGroup?.classList.remove('hidden')
    userNameEl?.classList.remove('hidden')
    userBadge?.classList.add('hidden')
    userBadge?.style.removeProperty('display')
    document.getElementById('_nx_dashboard_link')?.remove()
  }
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
