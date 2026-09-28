// POS Admin demo (#589 follow-up) — demo-local menu config that mirrors the REAL Nexora
// owner sidebar's item order/icons (src/components/dashboard/constants.tsx +
// DashboardSidebar.tsx in vlink-nexora-fe), trimmed to what a public, auth-less route can
// safely render. Only "POS > Salon Settings" is a real link in this demo (see
// posSidebarNavConfig.ts); every other row/child is inert (see PosSidebarNav).
import {
  BarChart3,
  Calendar,
  HelpCircle,
  LayoutDashboard,
  Newspaper,
  Package,
  QrCode,
  Settings,
  Star,
  Store,
  type LucideIcon,
} from 'lucide-react'

export type PosSidebarMenuItem = {
  id: string
  icon: LucideIcon
  labelKey: string
  /** Only the POS item expands with real (non-toggle) children in this demo. */
  expandable?: boolean
}

/** Top-level rows, in the exact order of the real sidebar (Home is rendered separately). */
export const POS_DEMO_SIDEBAR_MENU_ITEMS: PosSidebarMenuItem[] = [
  { id: 'overview', icon: LayoutDashboard, labelKey: 'dashboard.menu.dashboard' },
  // "Payments & Payouts" is rendered by the real PaymentsPayoutsMenuSection component right
  // after this row (see PosSidebarNav) — matching DESKTOP_PAYMENTS_PAYOUTS_ANCHOR_ID = overview.
  { id: 'reviews', icon: Star, labelKey: 'dashboard.menu.reviews' },
  { id: 'touchpoints', icon: QrCode, labelKey: 'dashboard.menu.one_qr' },
  { id: 'ai-hub', icon: Calendar, labelKey: 'dashboard.menu.booking_hub', expandable: true },
  { id: 'pos', icon: Store, labelKey: 'dashboard.menu.pos', expandable: true },
  { id: 'product-management', icon: Package, labelKey: 'dashboard.menu.product_management', expandable: true },
  { id: 'analytics', icon: BarChart3, labelKey: 'dashboard.menu.analytics' },
  { id: 'settings', icon: Settings, labelKey: 'dashboard.menu.settings' },
  { id: 'news-library', icon: Newspaper, labelKey: 'dashboard.menu.news_library' },
  { id: 'support', icon: HelpCircle, labelKey: 'dashboard.menu.support' },
]

/** AI Hub children — real product hides everything but "Plans" without a voice tenant. */
export const AI_HUB_SUBMENU = [
  { id: 'plans', labelKey: 'components.dashboard.views.BookingHubView.tabs.plans' },
]

/** Gift Card Center children — matches GIFT_CARD_CENTER_SUBMENU in dashboard/constants.tsx. */
export const GIFT_CARD_CENTER_SUBMENU = [
  { id: 'gift-card', labelKey: 'dashboard.menu.gift_card' },
  { id: 'membership-card', labelKey: 'dashboard.menu.membership_card' },
]

/**
 * POS children — matches the real POS_SUBMENU order (Products excluded, same as
 * SHOW_POS_PRODUCTS_MENU = false in the real app). Only "settings" (Salon Settings) is a
 * real link in this demo; the rest are inert.
 */
export const POS_DEMO_SUBMENU = [
  { id: 'board', labelKey: 'dashboard.menu.pos_board' },
  { id: 'settings', labelKey: 'dashboard.menu.pos_salon_settings' },
  { id: 'report', labelKey: 'dashboard.menu.pos_report' },
  { id: 'promotions', labelKey: 'dashboard.menu.pos_promotions' },
  { id: 'public-checkin', labelKey: 'dashboard.menu.pos_public_checkin' },
  { id: 'devices', labelKey: 'dashboard.menu.pos_devices' },
  { id: 'printer', labelKey: 'dashboard.menu.pos_printer' },
]

export const POS_SALON_SETTINGS_CHILD_ID = 'settings'
