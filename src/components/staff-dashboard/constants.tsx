// Staff dashboard navigation constants.
import { LayoutDashboard, QrCode, Wallet, CreditCard, Settings, Star, ClipboardList } from 'lucide-react'

// Bottom-nav / sidebar items. Notifications is reached via the header bell.
export const STAFF_MENU_ITEMS = [
  { id: 'home', icon: LayoutDashboard, image: '/assets/menu/dashboard.png', labelKey: 'staff_dashboard.nav.home' },
  { id: 'qr', icon: QrCode, image: '/assets/menu/touchpoint.png', labelKey: 'staff_dashboard.nav.my_qr' },
  { id: 'tips', icon: Wallet, image: '/assets/menu/tips.png', labelKey: 'staff_dashboard.nav.tips' },
  { id: 'transactions', icon: ClipboardList, image: '/assets/menu/transaction.png', labelKey: 'staff_dashboard.nav.transactions' },
  { id: 'reviews', icon: Star, image: '/assets/menu/reviews.png', labelKey: 'staff_dashboard.nav.reviews' },
  { id: 'profile', icon: Settings, image: '/assets/menu/setting.png', labelKey: 'staff_dashboard.nav.profile' }
]

export const STAFF_BOTTOM_NAV_ITEMS = STAFF_MENU_ITEMS.filter((item) => item.id !== 'pay')

export const STAFF_SCREENS = ['home', 'qr', 'tips', 'transactions', 'reviews', 'pay', 'profile', 'notifications']

// Maps a notification type to the staff screen it should open from the header bell.
// Link notifications (incoming requests + approved/accepted/joined) all land on the
// Salon Link & Tips screen ('qr') — that page hosts the Accept/Decline CTAs for
// pending requests and the linked-business list for everything else.
const STAFF_NOTIFICATION_SCREEN: Record<string, string> = {
  tip: 'transactions',
  tipsuccess: 'transactions',
  review: 'reviews',
  reviewgood: 'reviews',
  feedbackalert: 'reviews',
  stafflinkrequest: 'qr',
  stafflinkapproved: 'qr',
  stafflinkaccepted: 'qr',
  staffinviteaccepted: 'qr',
  staffacceptedinvite: 'qr',
  staffjoined: 'qr',
}

export function resolveStaffNotificationScreen(type: string | null | undefined): string {
  const key = (type || '').toLowerCase().replace(/[\s_-]+/g, '')
  return STAFF_NOTIFICATION_SCREEN[key] || 'notifications'
}
