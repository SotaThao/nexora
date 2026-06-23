// Staff dashboard navigation constants.
import { LayoutDashboard, QrCode, Wallet, CreditCard, Settings, Star } from 'lucide-react'

// Bottom-nav / sidebar items. Notifications is reached via the header bell.
export const STAFF_MENU_ITEMS = [
  { id: 'home', icon: LayoutDashboard, image: '/assets/menu/dashboard.png', labelKey: 'staff_dashboard.nav.home' },
  { id: 'qr', icon: QrCode, image: '/assets/menu/touchpoint.png', labelKey: 'staff_dashboard.nav.my_qr' },
  { id: 'tips', icon: Wallet, image: '/assets/menu/tips.png', labelKey: 'staff_dashboard.nav.tips' },
  { id: 'reviews', icon: Star, image: '/assets/menu/reviews.png', labelKey: 'staff_dashboard.nav.reviews' },
  { id: 'pay', icon: CreditCard, image: '/assets/menu/transaction.png', labelKey: 'staff_dashboard.nav.pay' },
  { id: 'profile', icon: Settings, image: '/assets/menu/setting.png', labelKey: 'staff_dashboard.nav.profile' }
]

export const STAFF_BOTTOM_NAV_ITEMS = STAFF_MENU_ITEMS.filter((item) => !['pay', 'profile'].includes(item.id))

export const STAFF_SCREENS = ['home', 'qr', 'tips', 'reviews', 'pay', 'profile', 'notifications']
