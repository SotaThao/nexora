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
  dashboardReviews:         (filters = EMPTY) => ['dashboard', 'reviews', filters],
  
  // Notifications
  notificationsUnreadCount: () => ['notifications', 'unreadCount'],
  notificationsList:      (filters = EMPTY) => ['notifications', 'list', filters],

  // Client ecosystem (header SSO)
  ecosystems:             () => ['ecosystems'],
  
  // Profile (Staff/Personal)
  userProfile:              () => ['userProfile'],
  verifiedStatus:           () => ['userProfile', 'verifiedStatus'],
  kycInitialize:            () => ['userProfile', 'kycInitialize'],
  kybIframeInitialize:      (language = 'en') => ['userProfile', 'kybIframeInitialize', language],
  kybRegister:              () => ['userProfile', 'kybRegister'],

  // Merchant Staff Management
  merchantStaff:       (statusFilter?: string, pageNumber?: number, pageSize?: number) => {
    const key: unknown[] = ['merchantStaff']
    if (statusFilter) key.push(statusFilter)
    if (pageNumber !== undefined || pageSize !== undefined) key.push({ pageNumber, pageSize })
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
  staffInvite:         (token)   => ['staffInvite', token],
  publicMerchantInvite: (ref)    => ['publicMerchantInvite', ref],
  merchantInviteLink:  ()      => ['merchantSettings', 'inviteLink'],

  // Merchant Touchpoints
  merchantTouchpoints: ()      => ['merchantTouchpoints'],

  // Merchant Physical Cards (QR/NFC hardware)
  merchantPhysicalCards: (filters = EMPTY) => ['merchantPhysicalCards', filters],
  merchantPhysicalCardDetail: (helpCode?: string | null) => ['merchantPhysicalCards', 'detail', helpCode ?? ''],
  resolveQrCode: (cardCode?: string | null) => ['publicQr', 'resolve', cardCode ?? ''],
  publicPhysicalCardHelp: (helpCode?: string | null, authMode?: string | null) =>
    ['publicPhysicalCardHelp', helpCode ?? '', authMode ?? ''],

  // Merchant Payment Methods
  merchantPaymentMethods: ()   => ['merchantPaymentMethods'],

  // Staff Payment Methods
  staffPaymentMethods: ()      => ['staffPaymentMethods'],

  // Staff Self (own staff profile + linked businesses)
  staffProfile:        ()      => ['staffProfile'],
  staffBusinesses:     ()      => ['staffBusinesses'],
  staffDashboardSummary: ()    => ['staffDashboardSummary'],
  staffReviews:          (filters = EMPTY) => ['staffReviews', filters],
  staffTips:             (filters = EMPTY) => ['staffTips', filters],
  staffLinkRequest:    (linkId: string | null | undefined) => ['staffLinkRequest', linkId ?? 'unknown'],

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

  // Tax IQ — Receipt Vault (US-05). No status/link-type filters in the key — BE has no
  // server-side filter params for GET /receipts, filtering happens client-side. Calling
  // with no args yields ['taxiqReceipts'] (broad invalidation target), same convention
  // as taxiqOwnerDeductions/taxiqStaffDeductions above.
  taxiqReceipts: (ownerTaxYearId?: string, staffTaxYearId?: string) => {
    const key: unknown[] = ['taxiqReceipts']
    if (ownerTaxYearId) key.push(ownerTaxYearId)
    if (staffTaxYearId) key.push(staffTaxYearId)
    return key
  },

  // Tax IQ — Staff Mileage & Cash Tip Logs (US-12) — separate keys per DoD (mutation
  // must not invalidate the other log type's list).
  taxiqStaffMileageLogs: (staffTaxYearId?: string) => ['taxiqStaffMileageLogs', staffTaxYearId ?? 'unknown'],
  taxiqStaffCashTipLogs: (staffTaxYearId?: string) => ['taxiqStaffCashTipLogs', staffTaxYearId ?? 'unknown'],

  // Tax IQ — Staff Self-Reported Income (US-13)
  taxiqSelfReportedIncome: (staffTaxYearId?: string) => ['taxiqSelfReportedIncome', staffTaxYearId ?? 'unknown'],
  taxiqSelfReportedIncomeDetail: (id?: string) => ['taxiqSelfReportedIncome', 'detail', id ?? 'unknown'],

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

  // Tax IQ — Owner Tax Payment Reminders (US-08)
  taxiqTaxReminders: (ownerTaxYearId?: string) => ['taxiqTaxReminders', ownerTaxYearId ?? 'unknown'],

  // Tax IQ — Owner Payout & Dispute Center (US-09)
  taxiqOwnerStaffList: (ownerTaxYearId?: string) => ['taxiqOwnerStaffList', ownerTaxYearId ?? 'unknown'],
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

  // Tax IQ — CPA Access Grant (US-10)
  taxiqCpaAccessGrants: (ownerTaxYearId?: string, staffTaxYearId?: string) =>
    ['taxiqCpaAccessGrants', ownerTaxYearId ?? 'none', staffTaxYearId ?? 'none'],
  taxiqCpaViewerPackage: (token?: string) => ['taxiqCpaViewerPackage', token ?? 'unknown'],

  // Public Customer Touch
  customerTouch: (businessSlug, touchPointSlug, sessionId) => ['customerTouch', businessSlug, touchPointSlug, sessionId],
  publicBusinessPaymentMethods: (businessId) => ['publicBusinessPaymentMethods', businessId],
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
