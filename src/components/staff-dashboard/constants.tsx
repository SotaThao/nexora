// Staff dashboard navigation constants.
import { LayoutDashboard, QrCode, Wallet, CreditCard, ClipboardList, Settings, Star } from 'lucide-react'

// Bottom-nav / sidebar items. Notifications is reached via the header bell.
export const STAFF_MENU_ITEMS = [
  { id: 'home', icon: LayoutDashboard, image: '/assets/menu/dashboard.png', labelKey: 'staff_dashboard.nav.home' },
  { id: 'qr', icon: QrCode, image: '/assets/menu/touchpoint.png', labelKey: 'staff_dashboard.nav.my_qr' },
  { id: 'tips', icon: Wallet, image: '/assets/menu/tips.png', labelKey: 'staff_dashboard.nav.tips' },
  { id: 'payments', icon: ClipboardList, image: '/assets/menu/transaction.png', labelKey: 'staff_dashboard.nav.payments' },
  { id: 'reviews', icon: Star, image: '/assets/menu/reviews.png', labelKey: 'staff_dashboard.nav.reviews' },
  { id: 'pay', icon: CreditCard, image: '/assets/menu/analytics.png', labelKey: 'staff_dashboard.nav.pay' },
  { id: 'profile', icon: Settings, image: '/assets/menu/setting.png', labelKey: 'staff_dashboard.nav.profile' },
]

export const STAFF_BOTTOM_NAV_ITEMS = STAFF_MENU_ITEMS.filter((item) => !['pay', 'profile'].includes(item.id))

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
