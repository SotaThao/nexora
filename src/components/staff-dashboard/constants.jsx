// Staff dashboard navigation constants.
import { Home, QrCode, CircleDollarSign, CreditCard, User, Star, MessageCircle, Wallet, Gift } from 'lucide-react'

// Sidebar items (includes Pay). Notifications is reached via the header bell.
export const STAFF_MENU_ITEMS = [
  { id: 'home', icon: Home, labelKey: 'staff_dashboard.nav.home' },
  { id: 'qr', icon: QrCode, labelKey: 'staff_dashboard.nav.my_qr' },
  { id: 'tips', icon: CircleDollarSign, labelKey: 'staff_dashboard.nav.tips' },
  { id: 'reviews', icon: Star, labelKey: 'staff_dashboard.nav.reviews' },
  { id: 'pay', icon: CreditCard, labelKey: 'staff_dashboard.nav.pay' },
  { id: 'profile', icon: User, labelKey: 'staff_dashboard.nav.profile' }
]

// Bottom nav — five tabs per mobile reference (Pay reached via quick actions).
export const STAFF_BOTTOM_NAV_ITEMS = [
  { id: 'home', icon: Home, labelKey: 'staff_dashboard.nav.home' },
  { id: 'qr', icon: QrCode, labelKey: 'staff_dashboard.nav.my_qr' },
  { id: 'tips', icon: CircleDollarSign, labelKey: 'staff_dashboard.nav.tips' },
  { id: 'reviews', icon: Star, labelKey: 'staff_dashboard.nav.reviews' },
  { id: 'profile', icon: User, labelKey: 'staff_dashboard.nav.profile' }
]

export const STAFF_QUICK_ACTIONS = [
  { id: 'qr', icon: QrCode, labelKey: 'staff_dashboard.home.quick_qr', color: 'bg-violet-100 text-violet-600' },
  { id: 'tips', icon: CircleDollarSign, labelKey: 'staff_dashboard.home.quick_tips', color: 'bg-emerald-100 text-emerald-600' },
  { id: 'reviews', icon: MessageCircle, labelKey: 'staff_dashboard.home.quick_reviews', color: 'bg-purple-100 text-purple-600' },
  { id: 'pay', icon: Wallet, labelKey: 'staff_dashboard.home.quick_payments', color: 'bg-blue-100 text-blue-600' },
  { id: 'refer', icon: Gift, labelKey: 'staff_dashboard.home.quick_refer', color: 'bg-pink-100 text-pink-600' }
]

export const STAFF_SCREENS = ['home', 'qr', 'tips', 'reviews', 'pay', 'profile', 'notifications']
