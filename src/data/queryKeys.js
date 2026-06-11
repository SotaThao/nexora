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
  dashboardReviews:         (filters = EMPTY) => ['dashboard', 'reviews', filters],
  
  // Notifications
  notificationsUnreadCount: () => ['notifications', 'unreadCount'],
  
  // Profile (Staff/Personal)
  userProfile:              () => ['userProfile'],
  verifiedStatus:           () => ['userProfile', 'verifiedStatus'],

  // Merchant Staff Management
  merchantStaff:       ()      => ['merchantStaff'],
  merchantStaffSearch: (q)     => ['merchantStaff', 'search', q],
  staffInvite:         (token) => ['staffInvite', token],

  // Merchant Touchpoints
  merchantTouchpoints: ()      => ['merchantTouchpoints'],

  // Merchant Payment Methods
  merchantPaymentMethods: ()   => ['merchantPaymentMethods'],

  // Staff Payment Methods
  staffPaymentMethods: ()      => ['staffPaymentMethods'],

  // Staff Self (own staff profile + linked businesses)
  staffProfile:        ()      => ['staffProfile'],
  staffBusinesses:     ()      => ['staffBusinesses'],

  // Public Customer Touch
  customerTouch: (businessSlug, touchPointSlug, sessionId) => ['customerTouch', businessSlug, touchPointSlug, sessionId],
  publicBusinessPaymentMethods: (businessId) => ['publicBusinessPaymentMethods', businessId],
}
