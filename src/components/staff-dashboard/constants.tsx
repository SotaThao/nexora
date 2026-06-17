// Staff dashboard navigation constants.
import { LayoutDashboard, QrCode, Wallet, CreditCard, Settings, Star } from 'lucide-react'

// Bottom-nav / sidebar items. Notifications is reached via the header bell.
export const STAFF_MENU_ITEMS = [
  { id: 'home', icon: LayoutDashboard, labelKey: 'staff_dashboard.nav.home' },
  { id: 'qr', icon: QrCode, labelKey: 'staff_dashboard.nav.my_qr' },
  { id: 'tips', icon: Wallet, labelKey: 'staff_dashboard.nav.tips' },
  { id: 'reviews', icon: Star, labelKey: 'staff_dashboard.nav.reviews' },
  { id: 'pay', icon: CreditCard, labelKey: 'staff_dashboard.nav.pay' },
  { id: 'profile', icon: Settings, labelKey: 'staff_dashboard.nav.profile' }
]

export const STAFF_BOTTOM_NAV_ITEMS = STAFF_MENU_ITEMS.filter((item) => !['pay', 'profile'].includes(item.id))

export const STAFF_SCREENS = ['home', 'qr', 'tips', 'reviews', 'pay', 'profile', 'notifications']
