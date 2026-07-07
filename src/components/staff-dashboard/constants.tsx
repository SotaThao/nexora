// Staff dashboard navigation constants.
import { LayoutDashboard, QrCode, Wallet, CreditCard, Settings, Star, Calculator } from 'lucide-react'

// Bottom-nav / sidebar items. Notifications is reached via the header bell.
// 'taxiq' carries `children` (Tax IQ sub-nav) — StaffSidebar renders it as an
// expandable group, mirroring the Owner Dashboard's MENU_ITEMS.taxiq pattern.
export const STAFF_MENU_ITEMS = [
  { id: 'home', icon: LayoutDashboard, image: '/assets/menu/dashboard.png', labelKey: 'staff_dashboard.nav.home' },
  { id: 'qr', icon: QrCode, image: '/assets/menu/touchpoint.png', labelKey: 'staff_dashboard.nav.my_qr' },
  { id: 'tips', icon: Wallet, image: '/assets/menu/tips.png', labelKey: 'staff_dashboard.nav.tips' },
  { id: 'reviews', icon: Star, image: '/assets/menu/reviews.png', labelKey: 'staff_dashboard.nav.reviews' },
  { id: 'pay', icon: CreditCard, image: '/assets/menu/transaction.png', labelKey: 'staff_dashboard.nav.pay' },
  {
    id: 'taxiq',
    icon: Calculator,
    image: '/assets/menu/tax-iq.svg',
    labelKey: 'staff_dashboard.nav.taxiq',
    children: [
      { id: 'deductions', labelKey: 'staff_dashboard.nav.taxiq_deductions' },
      { id: 'receipts', labelKey: 'staff_dashboard.nav.taxiq_receipts' },
      { id: 'logs', labelKey: 'staff_dashboard.nav.taxiq_logs' },
      { id: 'income', labelKey: 'staff_dashboard.nav.taxiq_income' },
      { id: 'export', labelKey: 'staff_dashboard.nav.taxiq_export' },
      { id: 'cpa-access', labelKey: 'staff_dashboard.nav.taxiq_cpa_access' },
    ],
  },
  { id: 'profile', icon: Settings, image: '/assets/menu/setting.png', labelKey: 'staff_dashboard.nav.profile' }
]

export const STAFF_BOTTOM_NAV_ITEMS = STAFF_MENU_ITEMS.filter((item) => item.id !== 'pay' && item.id !== 'taxiq')

export const STAFF_SCREENS = ['home', 'qr', 'tips', 'reviews', 'pay', 'taxiq', 'profile', 'notifications']

// Maps a Staff Tax IQ sidebar sub-item id -> the StaffTaxYear.enabledModules entry
// that must be present for it to show. Sub-items absent from this table (income,
// cpa-access) are always visible — there's no corresponding module toggle for them
// in the real backend enum (backend/src/Domain/Enums/TaxIq/TaxIqModule.cs has only
// 6 values; the BA doc's "Income Summary"/"Cash Tip Log"/"Tax Estimate"/"Year-End
// Package" wording doesn't map 1:1 — see openspec/changes/
// integrate-taxiq-staff-nav-onboarding/design.md D3, same precedent as the Owner
// side's TAXIQ_MENU_CHILD_MODULE in dashboard/constants.tsx).
export const STAFF_TAXIQ_MENU_CHILD_MODULE: Record<string, string> = {
  deductions: 'DeductionTracking',
  receipts: 'ReceiptManagement',
  logs: 'MileageLog',
  export: 'CPAExport',
}

// Maps a notification type to the staff screen it should open from the header bell.
// Link notifications (incoming requests + approved/accepted/joined) all land on the
// Salon Link & Tips screen ('qr') — that page hosts the Accept/Decline CTAs for
// pending requests and the linked-business list for everything else.
const STAFF_NOTIFICATION_SCREEN: Record<string, string> = {
  tip: 'tips',
  tipsuccess: 'tips',
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
