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

  // Merchant Subscriptions (billing)
  merchantSubscriptionPackages: (packageType?: import('./repositories/subscriptionPayments').SubscriptionPackageType) =>
    packageType
      ? (['merchantSubscriptions', 'packages', packageType] as const)
      : (['merchantSubscriptions', 'packages'] as const),
  merchantSubscriptionPaymentMethods: () => ['merchantSubscriptions', 'paymentMethods'],
  merchantSubscriptionPurchaseHistory: () => ['merchantSubscriptions', 'purchaseHistory'],
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

  // Merchant Nexora Voice
  merchantVoiceBookings: (filters = EMPTY) => ['merchantVoice', 'bookings', filters],
  merchantVoiceBookingsCollected: (filters = EMPTY) => ['merchantVoice', 'bookings', 'collected', filters],
  merchantVoiceBookingStatistics: () => ['merchantVoice', 'bookings', 'statistics'],
  merchantVoiceStaff: (filters = EMPTY) => ['merchantVoice', 'staff', filters],
  merchantVoiceStaffById: (id?: string | null) => ['merchantVoice', 'staff', 'detail', id ?? ''],
  merchantVoiceBusinessStaff: (filters = EMPTY) => ['merchantVoice', 'staff', 'businessStaff', filters],
  merchantVoiceConfig: () => ['merchantVoice', 'config'],
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
  merchantVoiceCreditWallet: () => ['merchantVoice', 'credits', 'wallet'],
  merchantVoiceUsageActivity: (filters = EMPTY) => ['merchantVoice', 'usage', 'activity', filters],

  // Nexora Voice trial (merchant)
  voiceTrialRequestMe: () => ['nexora-voice', 'trial-request', 'me'],

  // Public Customer Touch
  customerTouch: (businessSlug, touchPointSlug, sessionId) => ['customerTouch', businessSlug, touchPointSlug, sessionId],
  publicBusinessPaymentMethods: (businessId) => ['publicBusinessPaymentMethods', businessId],
  publicDirectPaymentPage: (businessId) => ['publicDirectPaymentPage', businessId],
  publicStaffDirectPaymentPage: (staffProfileId: string) => ['publicStaffDirectPaymentPage', staffProfileId],
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
