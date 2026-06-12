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
  merchantSetup:    (): string[]         => ['merchantSetup'],
  profileSettings:  (): string[]         => ['profileSettings'],
  transactions:     (): string[]         => ['transactions'],
  reviews:          (): string[]         => ['reviews'],
  notifications:    (): string[]         => ['notifications'],
  pendingAccounts:  (): string[]         => ['pendingAccounts'],
  /**
   * @param {string|undefined} staffId  Omit (or pass undefined) for the
   *   "current user's own account" case.
   */
  staffAccount:     (staffId?: string): unknown[]  => ['staffAccount', staffId ?? 'self'],

  // Dashboard & Analytics
  dashboardOverview:        (): string[] => ['dashboard', 'overview'],
  dashboardStaff:           (): string[] => ['dashboard', 'staff'],
  dashboardTouchpoints:     (): string[] => ['dashboard', 'touchpoints'],
  dashboardReviews:         (filters = EMPTY): unknown[] => ['dashboard', 'reviews', filters],

  // Notifications
  notificationsUnreadCount: (): string[] => ['notifications', 'unreadCount'],

  // Profile (Staff/Personal)
  userProfile:              (): string[] => ['userProfile'],
  verifiedStatus:           (): string[] => ['userProfile', 'verifiedStatus'],

  merchantStaff:       (statusFilter?: string, pageNumber?: number, pageSize?: number): unknown[]  => {
    const key: unknown[] = ['merchantStaff']
    if (statusFilter) key.push(statusFilter)
    if (pageNumber !== undefined || pageSize !== undefined) key.push({ pageNumber, pageSize })
    return key
  },
  merchantStaffSearch: (q: string): unknown[]     => ['merchantStaff', 'search', q],
  staffInvite:         (token: string): unknown[] => ['staffInvite', token],

  // Merchant Touchpoints
  merchantTouchpoints: (): string[]      => ['merchantTouchpoints'],

  // Merchant Payment Methods
  merchantPaymentMethods: (): string[]   => ['merchantPaymentMethods'],

  // Staff Payment Methods
  staffPaymentMethods: (): string[]      => ['staffPaymentMethods'],

  // Staff Self (own staff profile + linked businesses)
  staffProfile:        (): string[]      => ['staffProfile'],
  staffBusinesses:     (): string[]      => ['staffBusinesses'],

  // Public Customer Touch
  customerTouch: (businessSlug: string, touchPointSlug: string, sessionId: string): unknown[] => ['customerTouch', businessSlug, touchPointSlug, sessionId],
  publicBusinessPaymentMethods: (businessId: string): unknown[] => ['publicBusinessPaymentMethods', businessId],
}

/** Maps raw localStorage keys (without prefix) to TanStack Query key arrays. */
export const STORAGE_KEY_TO_QUERY_KEY: Record<string, string[]> = {
  nexora_notifications:    ['notifications'],
  nexora_transactions:     ['transactions'],
  nexora_reviews:          ['reviews'],
  nexora_merchant_setup:   ['merchantSetup'],
  nexora_profile_settings: ['profileSettings'],
  nexora_pending_accounts: ['pendingAccounts'],
  nexora_staff_account:    ['staffAccount', 'self'],
}
