// Dashboard constants — wallet logos, payout config defaults, sidebar menu.
// Extracted from Dashboard.jsx (Group 1 refactor).
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Pointer,
  Calculator,
  CircleDollarSign,
  Star,
  ReceiptText,
  QrCode,
  BarChart3,
  Settings,
  HelpCircle,
  Wallet,
  Calendar,
  Store,
  Package,
} from 'lucide-react'
import { BookingHubMainTab } from '../../data/merchantVoice/domain'

/** Menu ids used by Booking Hub / Touchpoints expandable nav (avoid hardcoding duplicates). */
export const DASHBOARD_MENU = {
  Touchpoints: 'touchpoints',
  BookingHub: 'booking-hub',
  TaxIq: 'taxiq',
  ProductManagement: "product-management",
} as const

/** Dashboard session roles passed as `userRole` prop. */
export const DASHBOARD_USER_ROLE = {
  Owner: 'owner',
  Staff: 'staff',
} as const

export type DashboardUserRole =
  (typeof DASHBOARD_USER_ROLE)[keyof typeof DASHBOARD_USER_ROLE];

export function isDashboardStaffRole(
  userRole: string | null | undefined,
): boolean {
  return userRole === DASHBOARD_USER_ROLE.Staff;
}

export const BOOKING_HUB_PATH = `/dashboard/${DASHBOARD_MENU.BookingHub}`;
/** Legacy URL segment — redirect to {@link BOOKING_HUB_PATH}. */
export const BOOKING_HUB_LEGACY_PATH_SEGMENT = "booking-hub";

export function bookingHubPath(tab?: string) {
  if (!tab) return BOOKING_HUB_PATH;
  return `${BOOKING_HUB_PATH}?tab=${encodeURIComponent(tab)}`;
}

export const WalletLogos = {
  venmo: (
    <svg
      viewBox="0 0 448 512"
      className="h-[18px] w-[18px] fill-walletVenmo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z" />
    </svg>
  ),
  cashapp: (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-walletCashapp"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M23.59 3.475a5.1 5.1 0 00-3.05-3.05c-1.31-.42-2.5-.42-4.92-.42H8.36c-2.4 0-3.61 0-4.9.4a5.1 5.1 0 00-3.05 3.06C0 4.765 0 5.965 0 8.365v7.27c0 2.41 0 3.6.4 4.9a5.1 5.1 0 003.05 3.05c1.3.41 2.5.41 4.9.41h7.28c2.41 0 3.61 0 4.9-.4a5.1 5.1 0 003.06-3.06c.41-1.3.41-2.5.41-4.9v-7.25c0-2.41 0-3.61-.41-4.91zm-6.17 4.63l-.93.93a.5.5 0 01-.67.01 5 5 0 00-3.22-1.18c-.97 0-1.94.32-1.94 1.21 0 .9 1.04 1.2 2.24 1.65 2.1.7 3.84 1.58 3.84 3.64 0 2.24-1.74 3.78-4.58 3.95l-.26 1.2a.49.49 0 01-.48.39H9.63l-.09-.01a.5.5 0 01-.38-.59l.28-1.27a6.54 6.54 0 01-2.88-1.57v-.01a.48.48 0 010-.68l1-.97a.49.49 0 01.67 0c.91.86 2.13 1.34 3.39 1.32 1.3 0 2.17-.55 2.17-1.42 0-.87-.88-1.1-2.54-1.72-1.76-.63-3.43-1.52-3.43-3.6 0-2.42 2.01-3.6 4.39-3.71l.25-1.23a.48.48 0 01.48-.38h1.78l.1.01c.26.06.43.31.37.57l-.27 1.37c.9.3 1.75.77 2.48 1.39l.02.02c.19.2.19.5 0 .68z" />
    </svg>
  ),
  zelle: (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-walletZelle"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z" />
    </svg>
  ),
  paypal: (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-walletPaypal"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.09 6.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H6.22c-.65 0-1.13-.59-.99-1.22L8.53 5.4c.14-.63.7-.1 1.33-.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" />
      <path
        d="M16.92 3.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H3.06c-.65 0-1.13-.59-.99-1.22L5.37 2.4c.14-.63.7-1.1 1.33-1.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z"
        opacity="0.6"
      />
    </svg>
  ),
  bankwire: (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-slate-600"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2L1 7v2h22V7L12 2zm0 18H3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h-3zm-11 2h22v2H1v-2z" />
    </svg>
  ),
  applecash: (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] fill-black"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.73-1.16 1.87-1.02 2.98 1.11.09 2.25-.56 2.97-1.43z" />
    </svg>
  ),
  vlinkpay: (
    <img
      src="/assets/vlinkpay-logo.png"
      alt="VLINKPAY Logo"
      className="h-[18px] w-[18px] object-contain"
    />
  ),
};

export const DEFAULT_PAYOUT_CONFIGS = {
  zelle: { enabled: false, value: '', qrCode: '', accountName: '' },
  bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
  paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
  venmo: { enabled: false, value: '', qrCode: '', accountName: '' },
  cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
  applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
}

/** Dashboard route root. */
export const DASHBOARD_ROOT_PATH = '/dashboard'

/** Sidebar / route segment ids under `{@link DASHBOARD_ROOT_PATH}/…`. */
export const DASHBOARD_MENU_ID = {
  overview: 'overview',
  staff: 'staff',
  tips: 'tips',
  reviews: 'reviews',
  reports: 'reports',
  touchpoints: 'touchpoints',
  taxiq: 'taxiq',
  bookingHub: 'ai-hub',
  productManagement: 'product-management',
  analytics: 'analytics',
  settings: 'settings',
  support: 'support',
  subscriptions: 'subscriptions',
  payments: 'payments',
} as const

export type DashboardMenuId = (typeof DASHBOARD_MENU_ID)[keyof typeof DASHBOARD_MENU_ID]

/** Merchant Portal Product Management SSO entry (alias of {@link DASHBOARD_MENU_ID.productManagement}). */
export const PRODUCT_MANAGEMENT_MENU_ID = DASHBOARD_MENU_ID.productManagement;

export function buildDashboardMenuPath(menuId: string): string {
  return menuId === DASHBOARD_MENU_ID.overview
    ? DASHBOARD_ROOT_PATH
    : `${DASHBOARD_ROOT_PATH}/${menuId}`;
}

export const DASHBOARD_REPORTS_PATH = buildDashboardMenuPath(
  DASHBOARD_MENU_ID.reports,
);
export const DASHBOARD_TIPS_PATH = buildDashboardMenuPath(
  DASHBOARD_MENU_ID.tips,
);
export const DASHBOARD_SETTINGS_BASE_PATH = `${DASHBOARD_ROOT_PATH}/settings`;

export const DASHBOARD_REPORTS_TAB = {
  tips: 'tips',
  directPayments: 'direct_payments',
} as const

export const DASHBOARD_TIPS_TAB = {
  savings: 'savings',
  payouts: 'payouts',
} as const

export const DASHBOARD_SETTINGS_QUERY_TAB = {
  payout: 'payout',
} as const

type DashboardReportsQuery = {
  status?: string
  tab?: string
  dateFrom?: string
  dateTo?: string
  transactionId?: string
  paymentId?: string
  date?: string
}

function withQuery(
  path: string,
  query: Record<string, string | undefined | null>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== "") params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** `/dashboard/reports` with optional query (status, tab, date range, ids). */
export function buildDashboardReportsPath(
  query: DashboardReportsQuery = {},
): string {
  return withQuery(DASHBOARD_REPORTS_PATH, {
    status: query.status,
    tab: query.tab,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    transactionId: query.transactionId,
    paymentId: query.paymentId,
    date: query.date,
  });
}

/** `/dashboard/tips` with optional tab. */
export function buildDashboardTipsPath(query: { tab?: string } = {}): string {
  return withQuery(DASHBOARD_TIPS_PATH, { tab: query.tab });
}

/** `/dashboard/settings?tab=…` (query-tab form used by payout setup). */
export function buildDashboardSettingsQueryPath(tab: string): string {
  return withQuery(DASHBOARD_SETTINGS_BASE_PATH, { tab });
}

export const MENU_ITEMS = [
  { id: DASHBOARD_MENU_ID.overview, label: 'Dashboard', icon: LayoutDashboard },
  { id: DASHBOARD_MENU_ID.staff, label: 'Staff', icon: Users },
  { id: DASHBOARD_MENU_ID.tips, label: 'Tips', icon: CircleDollarSign },
  { id: DASHBOARD_MENU_ID.reviews, label: 'Reviews', icon: Star },
  { id: DASHBOARD_MENU_ID.reports, label: 'Transactions', icon: ReceiptText },
  { id: DASHBOARD_MENU_ID.touchpoints, label: 'Touch Points', icon: QrCode },
  {
    id: DASHBOARD_MENU_ID.taxiq,
    label: 'Tax IQ',
    icon: Calculator,
    image: '/assets/menu/tax-iq.svg',
    children: [
      { id: 'onboarding', labelKey: 'dashboard.menu.taxiq_onboarding' },
      { id: 'employers', labelKey: 'dashboard.menu.taxiq_employers' },
      { id: 'deductions', labelKey: 'dashboard.menu.taxiq_deductions' },
      { id: 'income', labelKey: 'dashboard.menu.taxiq_income' },
      { id: 'receipts', labelKey: 'dashboard.menu.taxiq_receipts' },
      { id: 'equipment', labelKey: 'dashboard.menu.taxiq_equipment' },
      { id: 'payroll', labelKey: 'dashboard.menu.taxiq_payroll' },
      { id: 'pay-engine', labelKey: 'dashboard.menu.taxiq_pay_engine' },
      { id: 'weekly-payroll', labelKey: 'dashboard.menu.taxiq_weekly_payroll' },
      { id: 'payroll-runs', labelKey: 'dashboard.menu.taxiq_payroll_runs' },
      { id: 'tax-ledger', labelKey: 'dashboard.menu.taxiq_tax_ledger' },
      { id: 'exceptions', labelKey: 'dashboard.menu.taxiq_exceptions' },
      { id: 'data-quality', labelKey: 'dashboard.menu.taxiq_data_quality' },
      { id: 'jurisdictions', labelKey: 'dashboard.menu.taxiq_jurisdictions' },
      { id: 'reminders', labelKey: 'dashboard.menu.taxiq_reminders' },
      { id: 'cpa-access', labelKey: 'dashboard.menu.taxiq_cpa_access' },
      { id: 'share-links', labelKey: 'dashboard.menu.taxiq_share_links' },
      { id: '1099nec', labelKey: 'dashboard.menu.taxiq_form1099nec' },
      { id: 'tip-ledger', labelKey: 'dashboard.menu.taxiq_tip_ledger' },
      { id: 'forms-reports', labelKey: 'dashboard.menu.taxiq_forms_reports' },
      { id: 'tax-estimate', labelKey: 'dashboard.menu.taxiq_tax_estimate' },
      { id: 'export', labelKey: 'dashboard.menu.taxiq_export' }
    ]
  },
  { id: DASHBOARD_MENU_ID.bookingHub, label: 'AI Hub', icon: Calendar },
  {
    id: DASHBOARD_MENU_ID.productManagement,
    label: 'Gift Card Center',
    icon: Package,
  },
  { id: DASHBOARD_MENU_ID.analytics, label: 'Analytics', icon: BarChart3 },
  {
    id: 'pos',
    label: 'POS',
    icon: Store,
    children: [
      { id: 'settings', label: 'General Settings' },
      { id: 'roles', label: 'Roles & Permissions' },
      { id: 'categories', label: 'Categories' },
      { id: 'services', label: 'Services' },
      { id: 'products', label: 'Products' },
      { id: 'staff', label: 'Staff Profiles' },
      { id: 'board', label: 'Front Desk' }
    ]
  },
  { id: DASHBOARD_MENU_ID.settings, label: 'Settings', icon: Settings },
  { id: DASHBOARD_MENU_ID.support, label: 'Support', icon: HelpCircle },
]

export const MERCHANT_SIDEBAR_HIDDEN_MENU_IDS = [
  DASHBOARD_MENU_ID.tips,
  DASHBOARD_MENU_ID.reports,
];

/** Temporarily hide Hardware Devices submenu/tab until the feature is ready. */
export const SHOW_HARDWARE_DEVICES = false;

export const TOUCHPOINTS_SUBMENU = [
  { id: "stations", labelKey: "dashboard.touchpoints.tabs.stations" },
  { id: "devices", labelKey: "dashboard.touchpoints.tabs.devices" },
] as const;

export const VISIBLE_TOUCHPOINTS_SUBMENU = SHOW_HARDWARE_DEVICES
  ? TOUCHPOINTS_SUBMENU
  : TOUCHPOINTS_SUBMENU.filter((item) => item.id !== 'devices')

export const TAXIQ_SUBMENU: { id: string; labelKey: string }[] =
  MENU_ITEMS.find((item): item is typeof item & { children: { id: string; labelKey: string }[] } =>
    item.id === DASHBOARD_MENU_ID.taxiq && 'children' in item,
  )?.children ?? []
/** Gift Card Center sidebar children — SSO destinations (external Merchant Portal). */
export const GIFT_CARD_CENTER_SUBMENU = [
  {
    id: "gift-card",
    labelKey: "dashboard.menu.gift_card",
    destination: "gift-card",
  },
  {
    id: "membership-card",
    labelKey: "dashboard.menu.membership_card",
    destination: "membership-card",
  },
] as const;

/** Booking Hub sidebar children — maps to `/dashboard/booking-hub?tab=`. */
export const BOOKING_HUB_SUBMENU = [
  {
    id: BookingHubMainTab.Booking,
    labelKey: "components.dashboard.views.BookingHubView.tabs.booking",
    requiresVoiceTenant: true,
  },
  {
    id: BookingHubMainTab.Customers,
    labelKey: "components.dashboard.views.BookingHubView.tabs.customers",
    requiresVoiceTenant: true,
  },
  {
    id: BookingHubMainTab.CallLog,
    labelKey: "components.dashboard.views.BookingHubView.tabs.callLog",
    requiresVoiceTenant: true,
  },
  {
    id: BookingHubMainTab.SmsCampaigns,
    labelKey: "components.dashboard.views.BookingHubView.tabs.smsCampaigns",
    requiresVoiceTenant: true,
  },
  {
    id: BookingHubMainTab.Plans,
    labelKey: "components.dashboard.views.BookingHubView.tabs.plans",
    requiresVoiceTenant: false,
  },
  {
    id: BookingHubMainTab.Settings,
    labelKey: "components.dashboard.views.BookingHubView.tabs.settings",
    requiresVoiceTenant: true,
  },
] as const;

/** Match BookingHubView page tabs: without voice tenant only Plans is visible. */
export function getVisibleBookingHubSubmenu(hasVoiceTenant: boolean) {
  if (hasVoiceTenant) return BOOKING_HUB_SUBMENU;
  return BOOKING_HUB_SUBMENU.filter((item) => !item.requiresVoiceTenant);
}

export function getDefaultBookingHubTab(
  hasVoiceTenant: boolean,
): BookingHubMainTab {
  return hasVoiceTenant ? BookingHubMainTab.Booking : BookingHubMainTab.Plans;
}

export function isBookingHubMainTabAllowed(
  tab: BookingHubMainTab,
  hasVoiceTenant: boolean,
): boolean {
  const item = BOOKING_HUB_SUBMENU.find((entry) => entry.id === tab);
  if (!item) return false;
  return hasVoiceTenant || !item.requiresVoiceTenant;
}

export function isBookingHubSubActive(
  activeMenu: string,
  tabParam: string | null,
  subId: string,
  hasVoiceTenant = true,
): boolean {
  if (activeMenu !== DASHBOARD_MENU.BookingHub) return false;
  const activeTab = tabParam || getDefaultBookingHubTab(hasVoiceTenant);
  return activeTab === subId;
}

export function getDashboardMenuLocalizedLabel(
  id: string,
  t: (key: string) => string,
  fallback: string,
): string {
  const labelKey = DASHBOARD_MENU_LABEL_KEYS[id];
  if (labelKey) return t(labelKey);
  if (id === "devices") return t("dashboard.menu.qr_nfc");
  return fallback;
}

/** i18n keys for dashboard sidebar / mobile header titles. */
export const DASHBOARD_MENU_LABEL_KEYS: Record<string, string> = {
  [DASHBOARD_MENU_ID.overview]: "dashboard.menu.dashboard",
  [DASHBOARD_MENU_ID.staff]: "dashboard.menu.staff",
  [DASHBOARD_MENU_ID.tips]: "dashboard.menu.tips",
  [DASHBOARD_MENU_ID.reviews]: "dashboard.menu.reviews",
  [DASHBOARD_MENU_ID.reports]: "dashboard.menu.transactions",
  [DASHBOARD_MENU_ID.bookingHub]: "dashboard.menu.booking_hub",
  [DASHBOARD_MENU_ID.productManagement]: "dashboard.menu.product_management",
  [DASHBOARD_MENU_ID.touchpoints]: "dashboard.menu.touchpoints",
  [DASHBOARD_MENU.TaxIq]: 'dashboard.menu.tax_iq',
  [DASHBOARD_MENU_ID.analytics]: "dashboard.menu.analytics",
  [DASHBOARD_MENU_ID.settings]: "dashboard.menu.settings",
  [DASHBOARD_MENU_ID.support]: "dashboard.menu.support",
};

export const DASHBOARD_SETTINGS_TAB = {
  profile: "profile",
  kyb: "kyb",
  affiliate: "affiliate",
} as const;

export function buildDashboardSettingsPath(tab: string): string {
  if (tab === DASHBOARD_SETTINGS_TAB.kyb) {
    return `${DASHBOARD_ROOT_PATH}/settings/${DASHBOARD_SETTINGS_TAB.kyb}`;
  }
  if (tab === DASHBOARD_SETTINGS_TAB.affiliate) {
    return `${DASHBOARD_ROOT_PATH}/settings/${DASHBOARD_SETTINGS_TAB.affiliate}`;
  }
  return `${DASHBOARD_ROOT_PATH}/settings/${DASHBOARD_SETTINGS_TAB.profile}`;
}

export function normalizeDashboardSettingsTab(tab: string): string {
  if (
    tab === DASHBOARD_SETTINGS_TAB.kyb ||
    tab === DASHBOARD_SETTINGS_TAB.affiliate
  ) {
    return tab;
  }
  return DASHBOARD_SETTINGS_TAB.profile;
}

export const DASHBOARD_REVIEW_FILTER_ALL = "all";

export const DASHBOARD_STAFF_SIDEBAR_MENU_IDS = [
  DASHBOARD_MENU_ID.overview,
  DASHBOARD_MENU_ID.support,
] as const;

export function resolveDashboardMobileMenuTitle(
  activeMenu: string,
  tabParam: string | null,
  t: (key: string) => string,
  fallbackLabel = "",
  sectionParam: string | null = null,
): string {
  const paymentsPayoutsItem = getActivePaymentsPayoutsSubmenuItem(
    activeMenu,
    tabParam,
  );
  if (paymentsPayoutsItem) return t(paymentsPayoutsItem.labelKey);

  if (
    activeMenu === DASHBOARD_MENU_ID.settings &&
    sectionParam === "verification"
  ) {
    return t("staff_dashboard.profile.menu_verification");
  }

  const labelKey = DASHBOARD_MENU_LABEL_KEYS[activeMenu];
  if (labelKey) return t(labelKey);

  return fallbackLabel;
}

// sub-items are added as later POS Owner Setup tickets ship their own screens).
export const POS_SUBMENU: { id: string; label: string }[] =
  MENU_ITEMS.find((item): item is typeof item & { children: { id: string; label: string }[] } =>
    item.id === 'pos' && 'children' in item,
  )?.children ?? []


export const MERCHANT_SIDEBAR_MENU_ITEMS = MENU_ITEMS.filter(
  (item) => !MERCHANT_SIDEBAR_HIDDEN_MENU_IDS.includes(item.id),
);

export const PAYMENTS_PAYOUTS_MENU_ITEM = {
  id: "payments_payouts",
  icon: Wallet,
  labelKey: "dashboard.menu.payments_payouts",
};

export const PAYMENTS_PAYOUTS_SUBMENU = [
  {
    id: "overview",
    screen: DASHBOARD_MENU_ID.tips,
    labelKey: "dashboard.tips.tabs.overview",
    params: { tab: "overview" },
  },
  {
    id: "customer_payments",
    screen: DASHBOARD_MENU_ID.reports,
    labelKey: "dashboard.menu.payments_payouts_customer_payments",
    params: { tab: "direct_payments" },
  },
  {
    id: "tips",
    screen: DASHBOARD_MENU_ID.reports,
    labelKey: "dashboard.reports.tabs.tips",
    params: { tab: "tips" },
  },
  {
    id: "payroll",
    screen: DASHBOARD_MENU_ID.tips,
    labelKey: "dashboard.menu.payments_payouts_payroll",
    params: { tab: "payouts" },
  },
  {
    id: "direct_savings",
    screen: DASHBOARD_MENU_ID.tips,
    labelKey: "dashboard.tips.tabs.savings",
    params: { tab: "savings" },
  },
];

// Maps a Tax IQ sidebar sub-item id -> the OwnerTaxYear.enabledModules entry that must be
// present for it to show. Sub-items absent from this table (equipment, cpa-access) are always
// visible — there's no corresponding module toggle for them in the real backend enum.
// Values confirmed against backend/src/Domain/Enums/TaxIq/TaxIqModule.cs (verified live via a
// 400 TAXIQ_INVALID_MODULE response during manual testing — the module names guessed from the
// business spec prose, e.g. "GiftCardLiability"/"StaffPayout"/"DeductionCenter", do not exist).
export const TAXIQ_MENU_CHILD_MODULE: Record<string, string> = {
  deductions: 'DeductionTracking',
  receipts: 'ReceiptManagement',
  payroll: 'PayoutTracking',
  reminders: 'TaxReminders',
  export: 'CPAExport'
}

export function isPaymentsPayoutsSubActive(
  activeMenu: string,
  tabParam: string | null,
  item: (typeof PAYMENTS_PAYOUTS_SUBMENU)[number],
): boolean {
  if (activeMenu !== item.screen) return false;

  const tab = item.params?.tab;
  if (!tab) return true;

  if (item.screen === DASHBOARD_MENU_ID.tips && item.id === "overview") {
    return !tabParam || tabParam === "overview";
  }

  if (item.screen === DASHBOARD_MENU_ID.reports && item.id === "tips") {
    return !tabParam || tabParam === "tips";
  }

  return tabParam === tab;
}

export function isPaymentsPayoutsRouteActive(
  activeMenu: string,
  tabParam: string | null,
): boolean {
  if (
    activeMenu !== DASHBOARD_MENU_ID.tips &&
    activeMenu !== DASHBOARD_MENU_ID.reports
  )
    return false;
  return PAYMENTS_PAYOUTS_SUBMENU.some((item) =>
    isPaymentsPayoutsSubActive(activeMenu, tabParam, item),
  );
}

export function getActivePaymentsPayoutsSubmenuItem(
  activeMenu: string,
  tabParam: string | null,
) {
  return (
    PAYMENTS_PAYOUTS_SUBMENU.find((item) =>
      isPaymentsPayoutsSubActive(activeMenu, tabParam, item),
    ) ?? null
  );
}

export const visibleMenuItems = MENU_ITEMS;

export const PUBLIC_HOME_MENU_ITEM = {
  id: "public-home",
  label: "Home",
  image: "/assets/menu/home.png",
};

export const TIPS_TAB_IDS = ["overview", "savings", "payouts"];
