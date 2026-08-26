/**
 * Central query-key registry.
 *
 * All hooks and mutations reference these keys so that
 * invalidateQueries targets exactly the right cache entries.
 */

// Shared stable default for optional object params in keys, so callers that
// omit filters reuse one reference rather than allocating a fresh {} each call.
const EMPTY = {}

export const qk = {
  merchantSetup:    ()         => ['merchantSetup'],
  merchantSite:     (businessId?: string) => ['merchantSite', businessId ?? ''],
  publicSite:       (slug: string) => ['publicSite', slug ?? ''],
  profileSettings:  ()         => ['profileSettings'],
  transactions:            () => ['transactions'],
  transactionsPaginated:   (filters = EMPTY) => ['transactions', 'paginated', filters],
  reviews:          ()         => ['reviews'],
  notifications:    ()         => ['notifications'],
  pendingAccounts:  ()         => ['pendingAccounts'],
  /**
   * @param {string|undefined} staffId  Omit (or pass undefined) for the
   *   "current user's own account" case.
   */
  staffAccount:     (staffId?: string | null)  => ['staffAccount', staffId ?? 'self'],
  
  // Dashboard & Analytics
  dashboardOverview:        () => ['dashboard', 'overview'],
  dashboardStaff:           () => ['dashboard', 'staff'],
  dashboardTouchpoints:     () => ['dashboard', 'touchpoints'],
  dashboardTipsChart:       () => ['dashboard', 'tipsChart'],
  dashboardAnalytics:       (filters = EMPTY) => ['dashboard', 'analytics', filters],
  dashboardReviews:         (filters = EMPTY) => ['dashboard', 'reviews', filters],
  
  // Notifications
  notificationsUnreadCount: () => ['notifications', 'unreadCount'],
  notificationsList:      (filters = EMPTY) => ['notifications', 'list', filters],

  // Client ecosystem (header SSO)
  ecosystems:             () => ['ecosystems'],

  // Public homepage banners
  activeBanners:          () => ['banners', 'active'],
  
  // Profile (Staff/Personal)
  userProfile:              () => ['userProfile'],
  verifiedStatus:           () => ['userProfile', 'verifiedStatus'],
  kycInitialize:            () => ['userProfile', 'kycInitialize'],
  kybIframeInitialize:      (language = 'en') => ['userProfile', 'kybIframeInitialize', language],
  kybRegister:              () => ['userProfile', 'kybRegister'],

  // Merchant Staff Management
  merchantStaff:       (statusFilter?: string, pageNumber?: number, pageSize?: number, keyword?: string) => {
    const key: unknown[] = ['merchantStaff']
    if (statusFilter) key.push(statusFilter)
    if (pageNumber !== undefined || pageSize !== undefined || keyword) {
      key.push({ pageNumber, pageSize, keyword: keyword?.trim() || '' })
    }
    return key
  },
  merchantStaffSearch: (q)     => ['merchantStaff', 'search', q],
  // v3.3 — MerchantStaff invite lifecycle + staff-by-code detail.
  // Note: all are prefixed with 'merchantStaff' so invalidating qk.merchantStaff()
  // also refreshes invites/detail caches.
  merchantStaffInvites: (filters = EMPTY) => ['merchantStaff', 'invites', filters],
  merchantStaffInvite:  (inviteId)        => ['merchantStaff', 'invite', inviteId],
  merchantStaffByCode:  (staffCode)       => ['merchantStaff', 'byCode', staffCode],
  merchantStaffStats:   (staffProfileId, filters = EMPTY) =>
    ['merchantStaff', 'stats', staffProfileId, filters],
  localStaffPaymentMethods: (staffProfileId?: string | null) =>
    ['merchantStaff', 'localStaffPaymentMethods', staffProfileId ?? ''],
  localStaffActiveWork: (staffProfileId?: string | null) =>
    ['merchantStaff', 'localStaffActiveWork', staffProfileId ?? ''],
  staffInvite:         (token)   => ['staffInvite', token],
  publicMerchantInvite: (ref)    => ['publicMerchantInvite', ref],
  merchantInviteLink:  ()      => ['merchantSettings', 'inviteLink'],
  // POS Owner Setup — Business Hours (US-014)
  merchantBusinessHours: ()    => ['merchantSettings', 'businessHours'],
  // POS Owner Setup — Roles & Permissions (US-015)
  merchantPosRoles: ()         => ['merchantSettings', 'posRoles'],
  // POS Owner Setup — Categories (US-016)
  merchantPosCategories: ()    => ['merchantSettings', 'posCategories'],
  // POS Owner Setup — Services (US-017)
  merchantPosServices: ()      => ['merchantSettings', 'posServices'],
  merchantPosTags: ()          => ['merchantSettings', 'posTags'],
  // POS Owner Setup — Products (US-018)
  merchantPosProducts: ()      => ['merchantSettings', 'posProducts'],
  // POS Owner Setup — Staff Profile (US-019)
  merchantPosStaffProfile: (businessStaffLinkId?: string) =>
    ['merchantSettings', 'posStaffProfile', businessStaffLinkId ?? ''],
  // POS Owner Setup — Staff Service Assignment (US-020)
  merchantPosStaffServiceAssignments: (businessStaffLinkId?: string) =>
    ['merchantSettings', 'posStaffServiceAssignments', businessStaffLinkId ?? ''],
  // POS Owner Setup — Staff Weekly Schedule (US-09/US-021)
  merchantPosStaffWeeklySchedule: (businessStaffLinkId?: string) =>
    ['merchantSettings', 'posStaffWeeklySchedule', businessStaffLinkId ?? ''],
  // Tax IQ / POS — Pay Engine (US-031 / backend US-23)
  merchantPosPayRuleList: (businessId?: string) => ['merchantSettings', 'posPayRuleList', businessId ?? ''],
  merchantPosPayRule: (businessStaffLinkId?: string) =>
    ['merchantSettings', 'posPayRule', businessStaffLinkId ?? ''],
  // Tax IQ / POS — Pay Engine Pre-tax Deductions (401k/Section 125, backend Ticket 3)
  merchantPosPreTaxDeductions: (businessStaffLinkId?: string) =>
    ['merchantSettings', 'posPreTaxDeductions', businessStaffLinkId ?? ''],
  // Tax IQ / POS — Weekly Payroll (mục 14, backend US-25). weekStart is only appended when
  // explicitly passed — omitting it (e.g. from a mutation's invalidateQueries call, which may
  // not know which week the currently-mounted list query was rendered with) yields a short
  // prefix that matches every cached week for this business, same convention as
  // merchantPosCompletedOrders above.
  merchantPosWeeklyPayroll: (businessId?: string, weekStart?: string) => {
    const key: unknown[] = ['merchantSettings', 'posWeeklyPayroll', businessId ?? '']
    if (weekStart) key.push(weekStart)
    return key
  },
  merchantPosWeeklyPayrollDailyDetail: (businessStaffLinkId?: string, weekStart?: string) => {
    const key: unknown[] = ['merchantSettings', 'posWeeklyPayrollDailyDetail', businessStaffLinkId ?? '']
    if (weekStart) key.push(weekStart)
    return key
  },
  // Tax IQ — Payroll Runs (mục 12, backend US-26). `filters` only appended when passed, same
  // prefix-invalidation convention as merchantPosCompletedOrders — a mutation (Finalize/
  // Cancel/Rerun) invalidates the list without knowing which page/filter the list is on.
  taxiqPayrollRuns: (businessId?: string, filters?: object) => {
    const key: unknown[] = ['taxiq', 'payrollRuns', businessId ?? '']
    if (filters) key.push(filters)
    return key
  },
  taxiqPayrollRun: (id?: string) => ['taxiq', 'payrollRun', id ?? ''],
  // Tax IQ — Tax Ledger (mục 16, backend US-27/28/29). Same filters-appended-when-present
  // convention as taxiqPayrollRuns.
  taxiqTaxLedger: (businessId?: string, filters?: object) => {
    const key: unknown[] = ['taxiq', 'taxLedger', businessId ?? '']
    if (filters) key.push(filters)
    return key
  },
  // Tax IQ — Exceptions Queue + Data Quality Center (mục 17/18, backend US-036). Same
  // filters-appended-when-present convention as taxiqPayrollRuns/taxiqTaxLedger.
  taxiqExceptions: (businessId?: string, filters?: object) => {
    const key: unknown[] = ['taxiq', 'exceptions', businessId ?? '']
    if (filters) key.push(filters)
    return key
  },
  taxiqException: (id?: string) => ['taxiq', 'exception', id ?? ''],
  taxiqDataQuality: (businessId?: string, employerId?: string) => ['taxiq', 'dataQuality', businessId ?? '', employerId ?? ''],
  taxiqCleanupTasks: (businessId?: string, filters?: object) => {
    const key: unknown[] = ['taxiq', 'cleanupTasks', businessId ?? '']
    if (filters) key.push(filters)
    return key
  },
  // POS Merchant Ops — Front Desk access self-check + Check-in/Waitlist (US-12)
  merchantPosAccess: (businessId?: string) => ['merchantSettings', 'posAccess', businessId ?? ''],
  merchantPosWaitlist: (businessId?: string) => ['merchantSettings', 'posWaitlist', businessId ?? ''],
  // POS Merchant Ops — Order List tab (US-17), Waiting + InService combined.
  merchantPosOrderList: (businessId?: string) => ['merchantSettings', 'posOrderList', businessId ?? ''],
  // POS iPad redesign, Ticket 2 — Check-in "returning customer" lookup by phone.
  merchantPosCustomerLookup: (businessId?: string, phone?: string) =>
    ['merchantSettings', 'posCustomerLookup', businessId ?? '', phone ?? ''],
  // POS Booking — per-business settings (Ticket 2)
  merchantPosBookingSettings: (businessId?: string) => ['merchantSettings', 'posBookingSettings', businessId ?? ''],
  // POS Merchant Ops — Completed Orders panel (US-17 follow-up), paginated + filtered.
  // `filters` is only appended when explicitly passed — omitting it (e.g. from an
  // invalidateQueries call after Complete/edit) yields a short prefix that matches every
  // cached page/filter combination, instead of only the exact one it was built with.
  merchantPosCompletedOrders: (businessId?: string, filters?: object) => {
    const key: unknown[] = ['merchantSettings', 'posCompletedOrders', businessId ?? '']
    if (filters) key.push(filters)
    return key
  },
  // POS Merchant Ops — Turn Board Assign & Break (US-13)
  merchantPosTurnBoard: (businessId?: string) => ['merchantSettings', 'posTurnBoard', businessId ?? ''],
  // POS Front Desk — Time Clock tab. Roster/log keys carry the local day being shown so switching
  // day (or crossing midnight on an iPad left open) refetches instead of serving yesterday's board.
  // `dayKey` is only appended when passed: an invalidateQueries call omitting it must yield a real
  // prefix of the rendered key. Defaulting it to '' instead would build a 4th element that matches
  // no live query, and the invalidation would silently do nothing.
  merchantPosTimeClockQr: (businessId?: string) => ['merchantSettings', 'posTimeClockQr', businessId ?? ''],
  merchantPosTimeClockRoster: (businessId?: string, dayKey?: string) => {
    const key: unknown[] = ['merchantSettings', 'posTimeClockRoster', businessId ?? '']
    if (dayKey) key.push(dayKey)
    return key
  },
  merchantPosTimeClockLog: (businessId?: string, dayKey?: string) => {
    const key: unknown[] = ['merchantSettings', 'posTimeClockLog', businessId ?? '']
    if (dayKey) key.push(dayKey)
    return key
  },
  staffClockScanPreview: (businessId?: string, token?: string) =>
    ['staffClockScanPreview', businessId ?? '', token ?? ''],
  // POS Merchant Ops — Checkout (US-14 / US-025, refactored to Order in US-026)
  merchantPosInServiceOrders: (businessId?: string) => ['merchantSettings', 'posInServiceOrders', businessId ?? ''],
  merchantPosOrderDetail: (businessId?: string, orderId?: string) =>
    ['merchantSettings', 'posOrderDetail', businessId ?? '', orderId ?? ''],
  merchantPosCheckoutServiceCatalog: (businessId?: string) =>
    ['merchantSettings', 'posCheckoutServiceCatalog', businessId ?? ''],
  merchantPosCheckoutProductCatalog: (businessId?: string) =>
    ['merchantSettings', 'posCheckoutProductCatalog', businessId ?? ''],
  merchantPosAssignableStaff: (businessId?: string, posServiceId?: string) =>
    ['merchantSettings', 'posAssignableStaff', businessId ?? '', posServiceId ?? ''],
  merchantPosAssignableServices: (businessId?: string, posStaffProfileId?: string) =>
    ['merchantSettings', 'posAssignableServices', businessId ?? '', posStaffProfileId ?? ''],
  // POS Booking — Booking Management screen (Ticket 9)
  merchantPosBookingList: (businessId?: string, filters?: object) => {
    const key: unknown[] = ['merchantSettings', 'posBookingList', businessId ?? '']
    if (filters) key.push(filters)
    return key
  },
  merchantPosBookingDetail: (businessId?: string, bookingId?: string) =>
    ['merchantSettings', 'posBookingDetail', businessId ?? '', bookingId ?? ''],
  // POS Front Desk — Customer tab (US-043), read-only list/detail/order-history.
  merchantPosCustomerList: (businessId?: string, filters?: object) => {
    const key: unknown[] = ['merchantSettings', 'posCustomerList', businessId ?? '']
    if (filters) key.push(filters)
    return key
  },
  merchantPosCustomerDetail: (businessId?: string, customerId?: string) =>
    ['merchantSettings', 'posCustomerDetail', businessId ?? '', customerId ?? ''],
  merchantPosCustomerOrders: (businessId?: string, customerId?: string, filters?: object) => {
    const key: unknown[] = ['merchantSettings', 'posCustomerOrders', businessId ?? '', customerId ?? '']
    if (filters) key.push(filters)
    return key
  },

  // Merchant Touchpoints
  merchantTouchpoints: ()      => ['merchantTouchpoints'],

  // Merchant Physical Cards (QR/NFC hardware)
  merchantPhysicalCards: (filters = EMPTY) => ['merchantPhysicalCards', filters],
  merchantPhysicalCardDetail: (helpCode?: string | null) => ['merchantPhysicalCards', 'detail', helpCode ?? ''],
  resolveQrCode: (cardCode?: string | null) => ['publicQr', 'resolve', cardCode ?? ''],
  publicPhysicalCardHelp: (helpCode?: string | null, authMode?: string | null) =>
    ['publicPhysicalCardHelp', helpCode ?? '', authMode ?? ''],

  // Merchant Subscriptions (billing)
  merchantSubscriptionPackages: (packageType?: import('./repositories/subscriptionPayments').SubscriptionPackageType) =>
    packageType
      ? (['merchantSubscriptions', 'packages', packageType] as const)
      : (['merchantSubscriptions', 'packages'] as const),
  merchantSubscriptionPaymentMethods: () => ['merchantSubscriptions', 'paymentMethods'],
  merchantSubscriptionPurchaseHistory: (page?: {
    pageNumber: number
    pageSize: number
  }) =>
    page
      ? (['merchantSubscriptions', 'purchaseHistory', page] as const)
      : (['merchantSubscriptions', 'purchaseHistory'] as const),
  merchantSubscriptionMyPackages: () => ['merchantSubscriptions', 'myPackages'],
  publicSubscriptionPackages: (packageType?: import('./repositories/subscriptionPayments').SubscriptionPackageType) =>
    packageType
      ? (['publicSubscriptions', 'packages', packageType] as const)
      : (['publicSubscriptions', 'packages'] as const),
  merchantSubscriptionOrderStatus: (orderId: string) => ['merchantSubscriptions', 'orderStatus', orderId],

  // Merchant Payment Methods
  merchantPaymentMethods: ()   => ['merchantPaymentMethods'],
  supportedPaymentMethods: ()  => ['supportedPaymentMethods'],
  merchantPaymentQr: ()        => ['merchantPaymentQr'],
  merchantPaymentsList: (filters = EMPTY) => ['merchantPayments', 'list', filters],
  merchantPaymentDetail: (paymentId: string) => ['merchantPayments', 'detail', paymentId],
  merchantPaymentStats: (filters = EMPTY) => ['merchantPayments', 'stats', filters],

  // US-55 — Payout Management (merchant)
  merchantPayoutsList: (filters = EMPTY) => ['merchantPayouts', 'list', filters],
  merchantPayoutDetail: (payoutId: string) => ['merchantPayouts', 'detail', payoutId],
  merchantPayoutStats: () => ['merchantPayouts', 'stats'],
  merchantPayoutStatsByStaff: () => ['merchantPayouts', 'statsByStaff'],
  merchantUnpaidTips: () => ['merchantPayouts', 'unpaidTips'],
  merchantDebtHistory: (filters = EMPTY) => ['merchantPayouts', 'debtHistory', filters],
  merchantStaffDebt: (staffProfileId: string) => ['merchantPayouts', 'staffDebt', staffProfileId],

  // US-55 — Payout Management (staff)
  staffPayoutsList: (filters = EMPTY) => ['staffPayouts', 'list', filters],
  staffPayoutDetail: (payoutId: string) => ['staffPayouts', 'detail', payoutId],
  staffPayoutStats: () => ['staffPayouts', 'stats'],
  staffUnpaidDebt: () => ['staffPayouts', 'unpaidDebt'],

  // Staff Payment Methods
  staffPaymentMethods: ()      => ['staffPaymentMethods'],
  staffPaymentQr: ()          => ['staffPaymentQr'],
  staffPaymentsList: (filters = EMPTY) => ['staffPayments', 'list', filters],
  staffPaymentDetail: (paymentId: string) => ['staffPayments', 'detail', paymentId],
  staffPaymentStats: (filters = EMPTY) => ['staffPayments', 'stats', filters],

  // Staff Self (own staff profile + linked businesses)
  staffProfile:        ()      => ['staffProfile'],
  staffBusinesses:     ()      => ['staffBusinesses'],
  staffDashboardSummary: ()    => ['staffDashboardSummary'],
  staffDashboardStatistics: () => ['staffDashboardStatistics'],
  staffReviews:          (filters = EMPTY) => ['staffReviews', filters],
  staffTips:             (filters = EMPTY) => ['staffTips', filters],
  staffTransactionsPaginated: (filters = EMPTY) => ['staffTransactions', 'paginated', filters],
  staffLinkRequest:    (linkId: string | null | undefined) => ['staffLinkRequest', linkId ?? 'unknown'],
  staffLinkRequestsList: (filters = EMPTY) => ['staffLinkRequests', 'list', filters],
  staffWorkSkillCategories:  (businessId: string) => ['staffWorkSkill', businessId, 'categories'],
  staffWorkSkillServices:    (businessId: string) => ['staffWorkSkill', businessId, 'services'],
  staffWorkSkillAssignments: (businessId: string) => ['staffWorkSkill', businessId, 'assignments'],

  // Tax IQ — Owner Tax Year (prefixed with 'taxiqOwnerTaxYear' so invalidating
  // qk.taxiqOwnerTaxYear() also clears the byId cache below).
  taxiqOwnerTaxYear:     (businessId?: string, taxYear?: number) => {
    const key: unknown[] = ['taxiqOwnerTaxYear']
    if (businessId) key.push(businessId)
    if (taxYear !== undefined) key.push(taxYear)
    return key
  },
  taxiqOwnerTaxYearById: (id?: string) => ['taxiqOwnerTaxYear', 'byId', id ?? 'unknown'],

  // Tax IQ — Staff Tax Year (prefixed with 'taxiqStaffTaxYear' so invalidating
  // qk.taxiqStaffTaxYear() also clears the byId cache below). No businessId —
  // StaffTaxYear is scoped by the caller's JWT userId only.
  taxiqStaffTaxYear: (taxYear?: number) => {
    const key: unknown[] = ['taxiqStaffTaxYear']
    if (taxYear !== undefined) key.push(taxYear)
    return key
  },
  taxiqStaffTaxYearById: (id?: string) => ['taxiqStaffTaxYear', 'byId', id ?? 'unknown'],

  // Tax IQ — Staff self-entered SSN/EIN (US-012). Scoped by JWT userId only, one
  // profile per Staff (not per tax year) — no id/year param needed.
  taxiqStaffTaxProfile: () => ['taxiqStaffTaxProfile'],

  // Tax IQ — Owner Deduction Center
  taxiqOwnerDeductions: (ownerTaxYearId?: string, recordStatus?: string, categoryId?: string) => {
    const key: unknown[] = ['taxiqOwnerDeductions']
    if (ownerTaxYearId) key.push(ownerTaxYearId)
    if (recordStatus) key.push(recordStatus)
    if (categoryId) key.push(categoryId)
    return key
  },
  taxiqDeductionCategories: (applicableRole?: string) => ['taxiqDeductionCategories', applicableRole ?? 'all'],

  // Tax IQ — Staff Deduction Center (US-11)
  taxiqStaffDeductions: (staffTaxYearId?: string, recordStatus?: string, categoryId?: string) => {
    const key: unknown[] = ['taxiqStaffDeductions']
    if (staffTaxYearId) key.push(staffTaxYearId)
    if (recordStatus) key.push(recordStatus)
    if (categoryId) key.push(categoryId)
    return key
  },

  // Tax IQ — Receipt Vault (US-05). Calling with no args yields ['taxiqReceipts'] (broad
  // invalidation target), same convention as taxiqOwnerDeductions/taxiqStaffDeductions above.
  // deductionRecordId scopes the key so the "linked receipts for one deduction" query
  // (server-filtered via GET /receipts?deductionRecordId=...) never collides with the
  // full-vault query cached under the same tax year ids.
  taxiqReceipts: (ownerTaxYearId?: string, staffTaxYearId?: string, deductionRecordId?: string) => {
    const key: unknown[] = ['taxiqReceipts']
    if (ownerTaxYearId) key.push(ownerTaxYearId)
    if (staffTaxYearId) key.push(staffTaxYearId)
    if (deductionRecordId) key.push(deductionRecordId)
    return key
  },

  // Tax IQ — Staff Mileage Log (US-12)
  taxiqStaffMileageLogs: (staffTaxYearId?: string) => ['taxiqStaffMileageLogs', staffTaxYearId ?? 'unknown'],

  // Tax IQ — Staff Self-Reported Income (US-13)
  taxiqSelfReportedIncome: (staffTaxYearId?: string) => ['taxiqSelfReportedIncome', staffTaxYearId ?? 'unknown'],
  taxiqSelfReportedIncomeDetail: (id?: string) => ['taxiqSelfReportedIncome', 'detail', id ?? 'unknown'],

  // Tax IQ — Staff 1099-K Reconciliation (US-018)
  taxiqForm1099KReconciliation: (staffTaxYearId?: string) => ['taxiqForm1099KReconciliation', staffTaxYearId ?? 'unknown'],

  // Tax IQ — Owner Income Summary (US-014)
  taxiqOwnerIncome: (ownerTaxYearId?: string) => ['taxiqOwnerIncome', ownerTaxYearId ?? 'unknown'],
  taxiqOwnerIncomeDetail: (id?: string) => ['taxiqOwnerIncome', 'detail', id ?? 'unknown'],

  // Tax IQ — Owner Assets Tracker (US-07): Equipment, Gift Card Liability, Membership Credit
  taxiqOwnerEquipment: (ownerTaxYearId?: string) => ['taxiqOwnerEquipment', ownerTaxYearId ?? 'unknown'],
  taxiqOwnerGiftCardLiabilities: (ownerTaxYearId?: string) =>
    ['taxiqOwnerGiftCardLiabilities', ownerTaxYearId ?? 'unknown'],
  taxiqOwnerMembershipCredits: (ownerTaxYearId?: string) =>
    ['taxiqOwnerMembershipCredits', ownerTaxYearId ?? 'unknown'],

  // Tax IQ — Tax Readiness Score (shared widget, Owner + Staff scope)
  taxiqReadinessScore: (scope?: string, taxYearId?: string) =>
    ['taxiqReadinessScore', scope ?? 'unknown', taxYearId ?? 'unknown'],

  // Tax IQ — Owner Year-End Export (US-06). Cache also stores the last known
  // ExportPackageDto via setQueryData so the "no new changes" idempotent-final-export
  // message can be derived client-side by comparing `version` (BE has no explicit flag).
  taxiqOwnerExport: (ownerTaxYearId?: string) => ['taxiqOwnerExport', ownerTaxYearId ?? 'unknown'],

  // Tax IQ — Staff Year-End Export (US-15). Same idempotent-reexport cache pattern as Owner.
  taxiqStaffExport: (staffTaxYearId?: string) => ['taxiqStaffExport', staffTaxYearId ?? 'unknown'],

  // Tax IQ — Owner Adjustment History (US-06, post-Lock only)
  taxiqOwnerAdjustments: (ownerTaxYearId?: string) => ['taxiqOwnerAdjustments', ownerTaxYearId ?? 'unknown'],

  // Tax IQ — Staff Adjustment History (US-013, post-Lock only)
  taxiqStaffAdjustments: (staffTaxYearId?: string) => ['taxiqStaffAdjustments', staffTaxYearId ?? 'unknown'],

  // Tax IQ — Owner Tax Payment Reminders (US-08)
  taxiqTaxReminders: (ownerTaxYearId?: string) => ['taxiqTaxReminders', ownerTaxYearId ?? 'unknown'],

  // Tax IQ — Owner Payout & Dispute Center (US-09)
  taxiqOwnerStaffList: (ownerTaxYearId?: string) => ['taxiqOwnerStaffList', ownerTaxYearId ?? 'unknown'],

  // Tax IQ — Owner view of a Staff's masked/plaintext TIN (US-012)
  taxiqOwnerStaffTin: (ownerTaxYearId?: string, staffUserId?: string, reveal?: boolean) =>
    ['taxiqOwnerStaffTin', ownerTaxYearId ?? 'unknown', staffUserId ?? 'unknown', reveal ?? false],
  taxiqOwnerPayouts: (ownerTaxYearId?: string, staffUserId?: string, status?: string) => {
    const key: unknown[] = ['taxiqOwnerPayouts', ownerTaxYearId ?? 'unknown']
    if (staffUserId) key.push(staffUserId)
    if (status) key.push(status)
    return key
  },
  taxiqOwnerPayoutsDisputed: (ownerTaxYearId?: string) => ['taxiqOwnerPayoutsDisputed', ownerTaxYearId ?? 'unknown'],

  // Tax IQ — Staff Payout Confirmation & Dispute (US-14). No staffTaxYearId param —
  // GetPendingPayoutsQuery scopes by JWT userId only, same as taxiqStaffTaxYear above.
  taxiqStaffPayoutsPending: () => ['taxiqStaffPayoutsPending'],
  // BUG-03 — Staff Payout History. Filters embedded in key so different status/page
  // combos cache independently, same convention as staffPayoutsList above.
  taxiqStaffPayoutsHistory: (filters = EMPTY) => ['taxiqStaffPayoutsHistory', filters],

  // Tax IQ — CPA Access Grant (US-10)
  taxiqCpaAccessGrants: (ownerTaxYearId?: string, staffTaxYearId?: string) =>
    ['taxiqCpaAccessGrants', ownerTaxYearId ?? 'none', staffTaxYearId ?? 'none'],
  taxiqCpaViewerPackage: (token?: string) => ['taxiqCpaViewerPackage', token ?? 'unknown'],

  // Tax IQ — Staff W-4 Invite Link (US-028). Anonymous context query, keyed by token.
  taxiqStaffW4Invite: (token?: string) => ['taxiqStaffW4Invite', token ?? 'unknown'],

  // Tax IQ — Employer Registry (US-029). Prefixed with 'taxiqEmployers' so invalidating
  // qk.taxiqEmployers() also clears the byId cache below.
  taxiqEmployers: (businessId?: string) => ['taxiqEmployers', businessId ?? 'unknown'],
  taxiqEmployerById: (id?: string) => ['taxiqEmployers', 'byId', id ?? 'unknown'],
  taxiqEmployerRegistrations: (employerId?: string) => ['taxiqEmployerRegistrations', employerId ?? 'unknown'],
  // Jurisdictions (mục 19, backend US-037). Keyed by employerId — businessId prefix kept for
  // consistency with other taxiq* keys even though the query itself only needs employerId.
  taxiqJurisdictionSummary: (businessId?: string, employerId?: string) =>
    ['taxiq', 'jurisdictionSummary', businessId ?? '', employerId ?? ''],

  // Share Links (mục 23, backend generalized from CpaAccessGrant). Owner-side list has no
  // params (resolves current business via JWT); public viewer keyed by token + passcode so a
  // wrong-passcode attempt never masks a subsequent correct one from cache.
  taxiqShareLinks: () => ['taxiqShareLinks'],
  taxiqShareLinkContent: (token?: string, passcode?: string) =>
    ['taxiqShareLinkContent', token ?? 'unknown', passcode ?? ''],

  // Tax Center — 1099-NEC (mục 21, backend reuses Share Link infra from mục 23 for delivery)
  taxiqForm1099Nec: (ownerTaxYearId?: string) => ['taxiqForm1099Nec', ownerTaxYearId ?? 'unknown'],
  taxiqForm1096Report: (ownerTaxYearId?: string) => ['taxiqForm1096Report', ownerTaxYearId ?? 'unknown'],

  // Tip Ledger (mục 26) — scoped per staff, same key for owner + staff views (same query shape)
  taxiqTipLedger: (staffTaxYearId?: string) => ['taxiqTipLedger', staffTaxYearId ?? 'unknown'],

  // Forms & Reports (mục 20) — list scoped per OwnerTaxYear; preview scoped per FormsReportId
  taxiqFormsReports: (ownerTaxYearId?: string) => ['taxiqFormsReports', ownerTaxYearId ?? 'unknown'],
  taxiqFormsReportPreview: (formsReportId?: string) => ['taxiqFormsReportPreview', formsReportId ?? 'unknown'],

  // Tax Estimate (mục 27) — quarterly estimate scoped per OwnerTaxYear + quarter; alerts/checklist scoped per OwnerTaxYear only
  taxiqTaxEstimate: (ownerTaxYearId?: string, quarter?: number) => [
    'taxiqTaxEstimate',
    ownerTaxYearId ?? 'unknown',
    quarter ?? 'current',
  ],
  taxiqDepositScheduleAlerts: (ownerTaxYearId?: string) => ['taxiqDepositScheduleAlerts', ownerTaxYearId ?? 'unknown'],
  taxiqTaxReadinessChecklist: (ownerTaxYearId?: string) => ['taxiqTaxReadinessChecklist', ownerTaxYearId ?? 'unknown'],

  // Merchant Nexora Voice
  merchantVoiceBookings: (filters = EMPTY) => ['merchantVoice', 'bookings', filters],
  merchantVoiceBookingsCollected: (filters = EMPTY) => ['merchantVoice', 'bookings', 'collected', filters],
  merchantVoiceBookingStatistics: () => ['merchantVoice', 'bookings', 'statistics'],
  merchantVoiceStaff: (filters = EMPTY) => ['merchantVoice', 'staff', filters],
  merchantVoiceStaffById: (id?: string | null) => ['merchantVoice', 'staff', 'detail', id ?? ''],
  merchantVoiceBusinessStaff: (filters = EMPTY) => ['merchantVoice', 'staff', 'businessStaff', filters],
  merchantVoiceConfig: () => ['merchantVoice', 'config'],
  merchantVoiceHolidays: () => ['merchantVoice', 'holidays'],
  merchantVoiceHolidaysAffectedCount: (date: string) => ['merchantVoice', 'holidays', 'affected-count', date],
  merchantVoiceServiceCategories: () => ['merchantVoice', 'service-categories'],
  merchantVoiceServices: () => ['merchantVoice', 'services'],
  merchantVoiceTenantStatus: () => ['merchantVoice', 'tenant', 'status'],
  merchantVoiceMyTenant: () => ['merchantVoice', 'tenant', 'my'],
  merchantVoiceCalls: (filters = EMPTY) => ['merchantVoice', 'calls', filters],
  merchantVoiceCallStatistics: () => ['merchantVoice', 'calls', 'statistics'],
  merchantVoiceCustomers: (filters = EMPTY) => ['merchantVoice', 'customers', filters],
  merchantVoiceCustomersRoot: () => ['merchantVoice', 'customers'] as const,
  merchantVoiceCustomerSummary: () => ['merchantVoice', 'customers', 'summary'],
  merchantVoiceSmsCampaignDashboard: () => ['merchantVoice', 'smsCampaigns', 'dashboard'],
  merchantVoiceSmsCampaignAudienceSummary: () => ['merchantVoice', 'smsCampaigns', 'audience-summary'],
  merchantVoiceSmsCampaigns: (filters = EMPTY) => ['merchantVoice', 'smsCampaigns', 'list', filters],
  merchantVoiceSmsCampaignById: (id?: string | null) => ['merchantVoice', 'smsCampaigns', 'detail', id ?? ''],
  merchantVoiceSmsCampaignRecipients: (id?: string | null, filters = EMPTY) => [
    'merchantVoice',
    'smsCampaigns',
    id ?? '',
    'recipients',
    filters,
  ],
  merchantVoiceSmsCreditSummary: () => ['merchantVoice', 'smsCredits', 'summary'],
  merchantVoiceSmsCreditHistory: (filters = EMPTY) => ['merchantVoice', 'smsCredits', 'history', filters],
  /** Prefix — invalidate all smsCredits queries (summary + history variants). */
  merchantVoiceSmsCreditsRoot: () => ['merchantVoice', 'smsCredits'] as const,
  merchantVoiceCreditWallet: () => ['merchantVoice', 'credits', 'wallet'],
  merchantVoiceUsageActivity: (filters = EMPTY) => ['merchantVoice', 'usage', 'activity', filters],
  /** Prefix — invalidate all usage-activity filter variants. */
  merchantVoiceUsageActivityRoot: () => ['merchantVoice', 'usage', 'activity'] as const,

  // Nexora Voice trial (merchant)
  voiceTrialRequestMe: () => ['nexora-voice', 'trial-request', 'me'],

  // Public Customer Touch
  customerTouch: (businessSlug, touchPointSlug, sessionId) => ['customerTouch', businessSlug, touchPointSlug, sessionId],
  publicBusinessPaymentMethods: (businessId) => ['publicBusinessPaymentMethods', businessId],
  publicDirectPaymentPage: (businessId) => ['publicDirectPaymentPage', businessId],
  publicStaffDirectPaymentPage: (staffProfileId: string) => ['publicStaffDirectPaymentPage', staffProfileId],
  // POS Booking — Public Booking Page discovery (Ticket 4)
  publicBookingPage: (businessSlug?: string) => ['publicBookingPage', businessSlug ?? ''],
  // Customer entity unification — public contact-step "returning customer" lookup by phone.
  publicBookingCustomerLookup: (businessSlug?: string, phone?: string) =>
    ['publicBookingPage', 'customerLookup', businessSlug ?? '', phone ?? ''],
  // POS Booking — customer self-service Manage Booking page (Ticket 8)
  manageBooking: (manageToken?: string) => ['manageBooking', manageToken ?? ''],
  // Nested under the manageBooking prefix so invalidating the booking also refreshes consent.
  manageBookingConsent: (manageToken?: string) => ['manageBooking', manageToken ?? '', 'consent'],
  publicPaymentStatus: (paymentId: string) => ['publicPayment', 'status', paymentId],
  publicVoiceBookingPage: (
    businessKey?: string | null,
    phone?: string | null,
  ) => [
    'public',
    'nexora-voice',
    'booking-page',
    businessKey ?? '',
    phone ?? null,
  ],

  // Community demo (backend-neutral data boundary)
  communityList: (filters = EMPTY) => ['community', 'list', filters],
  communityMyList: () => ['community', 'my-list'],
  communityDetail: (communityId: string) => ['community', 'detail', communityId],
  communityBySlug: (slug: string) => ['community', 'slug', slug],
  communityMembers: (communityId: string, filters = EMPTY) => ['community', 'members', communityId, filters],
  communityPosts: (communityId: string, filters = EMPTY) => ['community', 'posts', communityId, filters],
  communityPost: (postId: string) => ['community', 'post', postId],
  communityComments: (postId: string, filters = EMPTY) => ['community', 'comments', postId, filters],
  communityReactions: (postId: string) => ['community', 'reactions', postId],
  communityInvites: (communityId: string) => ['community', 'invites', communityId],
  communityInvitePreview: (token: string) => ['community', 'invitePreview', token],
  communityJoinRequests: (communityId: string, filters = EMPTY) => ['community', 'joinRequests', communityId, filters],
  communityChannels: (communityId: string) => ['community', 'channels', communityId],
  communityMessages: (channelId: string, filters = EMPTY) => ['community', 'messages', channelId, filters],
  communityChatChannel: (communityId: string) => ['community', 'chat', 'channel', communityId],
  communityChatMessages: (channelId: string) => ['community', 'chat', 'messages', channelId],
  communityDirectChannels: () => ['community', 'directMessages', 'channels'],
  communityDirectChannel: (channelId: string) => ['community', 'directMessages', 'channel', channelId],
  communityDirectProfileSearch: (query: string) => ['community', 'directMessages', 'profileSearch', query.trim().toLocaleLowerCase()],
  communityReports: (communityId: string, filters = EMPTY) => ['community', 'reports', communityId, filters],
  communityNotifications: (filters = EMPTY) => ['community', 'notifications', filters],
  communityNotificationsUnreadCount: () => ['community', 'notifications', 'unreadCount'],
  communityProfile: (profileId: string) => ['community', 'profile', profileId],
}

/** Maps localStorage domain keys → TanStack Query key arrays (storage event bridge). */
export const STORAGE_KEY_TO_QUERY_KEY: Record<string, readonly string[]> = {
  nexora_notifications: ['notifications'],
  nexora_transactions: ['transactions'],
  nexora_reviews: ['reviews'],
  nexora_merchant_setup: ['merchantSetup'],
  nexora_profile_settings: ['profileSettings'],
  nexora_pending_accounts: ['pendingAccounts'],
}
