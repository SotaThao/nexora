// Staff dashboard navigation constants.
import { Home, QrCode, Wallet, CreditCard, User, Star } from 'lucide-react'

// Bottom-nav / sidebar items. Notifications is reached via the header bell.
export const STAFF_MENU_ITEMS = [
  { id: 'home', icon: Home, labelKey: 'staff_dashboard.nav.home' },
  { id: 'qr', icon: QrCode, labelKey: 'staff_dashboard.nav.my_qr' },
  { id: 'tips', icon: Wallet, labelKey: 'staff_dashboard.nav.tips' },
  { id: 'reviews', icon: Star, labelKey: 'staff_dashboard.nav.reviews' },
  { id: 'pay', icon: CreditCard, labelKey: 'staff_dashboard.nav.pay' },
  { id: 'profile', icon: User, labelKey: 'staff_dashboard.nav.profile' }
]

export const STAFF_SCREENS = ['home', 'qr', 'tips', 'reviews', 'pay', 'profile', 'notifications']
