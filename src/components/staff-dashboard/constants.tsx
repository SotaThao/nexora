// Staff dashboard navigation constants.
import {
  LayoutDashboard,
  QrCode,
  CircleDollarSign,
  Star,
  ReceiptText,
  BarChart3,
  Settings,
  Briefcase,
} from 'lucide-react'

// Bottom-nav / sidebar items. Icons align with merchant dashboard MENU_ITEMS.
export const STAFF_MENU_ITEMS = [
  { id: 'home', icon: LayoutDashboard, labelKey: 'staff_dashboard.nav.home' },
  { id: 'tips', icon: CircleDollarSign, labelKey: 'staff_dashboard.nav.tips' },
  { id: 'payments', icon: ReceiptText, labelKey: 'staff_dashboard.nav.payments' },
  { id: 'pay', icon: BarChart3, labelKey: 'staff_dashboard.nav.pay' },
  { id: 'profile', icon: Settings, labelKey: 'staff_dashboard.nav.profile' },
]

export const STAFF_WORKSPACE_MENU_ITEM = {
  id: 'workspace',
  icon: Briefcase,
  labelKey: 'staff_dashboard.nav.my_workspace',
}

export const STAFF_WORKSPACE_SUBMENU = [
  {
    id: 'my_qr',
    screen: 'qr',
    labelKey: 'staff_dashboard.nav.my_qr_menu',
    params: { tab: 'personal' },
  },
  {
    id: 'my_earnings',
    screen: 'payments',
    labelKey: 'staff_dashboard.nav.my_earnings',
    params: { tab: 'tips' },
  },
  {
    id: 'my_reviews',
    screen: 'reviews',
    labelKey: 'staff_dashboard.nav.my_reviews',
  },
  {
    id: 'my_salons',
    screen: 'qr',
    labelKey: 'staff_dashboard.nav.my_salons',
    params: { tab: 'tipping' },
  },
]

export const STAFF_WORKSPACE_SCREEN_IDS = ['qr', 'payments', 'reviews', 'tips']

export function isStaffWorkspaceSubActive(
  activeScreen: string,
  tabParam: string | null,
  item: (typeof STAFF_WORKSPACE_SUBMENU)[number],
): boolean {
  if (activeScreen !== item.screen) return false

  if (item.id === 'my_qr') {
    return !tabParam || tabParam === 'personal'
  }

  if (!item.params?.tab) return true

  if (item.screen === 'payments') {
    return !tabParam || tabParam === item.params.tab
  }

  return tabParam === item.params.tab
}

export function isStaffWorkspaceRouteActive(
  activeScreen: string,
  tabParam: string | null,
): boolean {
  return STAFF_WORKSPACE_SUBMENU.some((item) =>
    isStaffWorkspaceSubActive(activeScreen, tabParam, item),
  )
}

/** Top-level sidebar item is active only when its screen matches and no workspace sub-route owns it. */
export function isStaffTopLevelMenuItemActive(
  activeScreen: string,
  tabParam: string | null,
  itemId: string,
): boolean {
  if (activeScreen !== itemId) return false
  return !isStaffWorkspaceRouteActive(activeScreen, tabParam)
}

export const STAFF_BOTTOM_NAV_ITEMS = STAFF_MENU_ITEMS.filter(
  (item) => !['pay', 'profile', 'tips'].includes(item.id),
)

export const STAFF_SCREENS = ['home', 'qr', 'tips', 'reviews', 'pay', 'payments', 'profile', 'notifications']

const STAFF_ACTION_URL_ALIASES: Record<string, string> = {
  '/staff/businesses': '/staff',
}

export function resolveStaffNotificationActionUrl(
  actionUrl: string | null | undefined,
): string | null {
  if (!actionUrl?.trim()) return null
  const trimmed = actionUrl.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const queryOrHashIndex = trimmed.search(/[?#]/)
  const pathPart =
    queryOrHashIndex === -1 ? trimmed : trimmed.slice(0, queryOrHashIndex)
  const suffix = queryOrHashIndex === -1 ? '' : trimmed.slice(queryOrHashIndex)
  const resolvedPath = STAFF_ACTION_URL_ALIASES[pathPart] || pathPart
  return `${resolvedPath}${suffix}`
}

// Maps a notification type to the staff screen it should open from the header bell.
// Link notifications (incoming requests + approved/accepted/joined) all land on the
// Salon Link & Tips screen ('qr') — that page hosts the Accept/Decline CTAs for
// pending requests and the linked-business list for everything else.
const STAFF_NOTIFICATION_SCREEN: Record<string, string> = {
  tip: 'payments',
  tipsuccess: 'payments',
  review: 'reviews',
  reviewgood: 'reviews',
  feedbackalert: 'reviews',
  stafflinkrequest: 'qr',
  stafflinkapproved: 'qr',
  stafflinkaccepted: 'qr',
  staffinviteaccepted: 'qr',
  staffacceptedinvite: 'qr',
  staffjoined: 'qr',
  directpaymentreceived: 'payments',
  paymentreceived: 'payments',
}

export function resolveStaffNotificationScreen(type: string | null | undefined): string {
  const key = (type || '').toLowerCase().replace(/[\s_-]+/g, '')
  return STAFF_NOTIFICATION_SCREEN[key] || 'notifications'
}

export function navigateStaffNotification(
  notification: { type?: string | null; actionUrl?: string | null },
  navigate: (path: string) => void,
  fallbackNavigate: (screen: string) => void,
) {
  if (notification.type === 'StaffLinkRequest') {
    navigate('/staff/qr')
    return
  }

  const target = resolveStaffNotificationActionUrl(notification.actionUrl)
  if (target) {
    if (/^https?:\/\//i.test(target)) {
      window.location.assign(target)
    } else {
      navigate(target)
    }
    return
  }

  const screen = resolveStaffNotificationScreen(notification.type)
  if (screen === 'payments') {
    const key = (notification.type || '').toLowerCase().replace(/[\s_-]+/g, '')
    const isDirectPayment = key === 'directpaymentreceived' || key === 'paymentreceived'
    navigate(isDirectPayment ? '/staff/payments?tab=direct_payments' : '/staff/payments?tab=tips')
    return
  }

  fallbackNavigate(screen)
}
