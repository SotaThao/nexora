/**
 * Central query-key registry.
 *
 * All hooks and mutations reference these keys so that
 * invalidateQueries targets exactly the right cache entries.
 */

export const qk = {
  merchantSetup:    ()         => ['merchantSetup'],
  profileSettings:  ()         => ['profileSettings'],
  transactions:     ()         => ['transactions'],
  reviews:          ()         => ['reviews'],
  notifications:    ()         => ['notifications'],
  pendingAccounts:  ()         => ['pendingAccounts'],
  /**
   * @param {string|undefined} staffId  Omit (or pass undefined) for the
   *   "current user's own account" case.
   */
  staffAccount:     (staffId)  => ['staffAccount', staffId ?? 'self'],
  
  // Dashboard & Analytics
  dashboardOverview:        () => ['dashboard', 'overview'],
  dashboardStaff:           () => ['dashboard', 'staff'],
  dashboardTouchpoints:     () => ['dashboard', 'touchpoints'],
  dashboardReviews:         (filters) => ['dashboard', 'reviews', filters ?? {}],
  
  // Notifications
  notificationsUnreadCount: () => ['notifications', 'unreadCount'],
  
  // Profile (Staff/Personal)
  userProfile:              () => ['userProfile'],
  verifiedStatus:           () => ['userProfile', 'verifiedStatus'],

  // Merchant Staff Management
  merchantStaff:       ()      => ['merchantStaff'],
  merchantStaffSearch: (q)     => ['merchantStaff', 'search', q],
  staffInvite:         (token) => ['staffInvite', token],

  // Public Customer Touch
  customerTouch: (businessSlug, touchPointSlug, sessionId) => ['customerTouch', businessSlug, touchPointSlug, sessionId],
  publicBusinessPaymentMethods: (businessId) => ['publicBusinessPaymentMethods', businessId],
}
