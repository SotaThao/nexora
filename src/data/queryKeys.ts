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
  merchantPaymentQr: ()        => ['merchantPaymentQr'],
  merchantPaymentsList: (filters = EMPTY) => ['merchantPayments', 'list', filters],
  merchantPaymentDetail: (paymentId: string) => ['merchantPayments', 'detail', paymentId],

  // Staff Payment Methods
  staffPaymentMethods: ()      => ['staffPaymentMethods'],
  staffPaymentQr: ()          => ['staffPaymentQr'],
  staffPaymentsList: (filters = EMPTY) => ['staffPayments', 'list', filters],
  staffPaymentDetail: (paymentId: string) => ['staffPayments', 'detail', paymentId],

  // Staff Self (own staff profile + linked businesses)
  staffProfile:        ()      => ['staffProfile'],
  staffBusinesses:     ()      => ['staffBusinesses'],
  staffDashboardSummary: ()    => ['staffDashboardSummary'],
  staffReviews:          (filters = EMPTY) => ['staffReviews', filters],
  staffTips:             (filters = EMPTY) => ['staffTips', filters],
  staffLinkRequest:    (linkId: string | null | undefined) => ['staffLinkRequest', linkId ?? 'unknown'],

  // Public Customer Touch
  customerTouch: (businessSlug, touchPointSlug, sessionId) => ['customerTouch', businessSlug, touchPointSlug, sessionId],
  publicBusinessPaymentMethods: (businessId) => ['publicBusinessPaymentMethods', businessId],
  publicDirectPaymentPage: (businessId) => ['publicDirectPaymentPage', businessId],
  publicStaffDirectPaymentPage: (staffProfileId: string) => ['publicStaffDirectPaymentPage', staffProfileId],
  publicPaymentStatus: (paymentId: string) => ['publicPayment', 'status', paymentId],
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
