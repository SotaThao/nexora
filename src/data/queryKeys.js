/**
 * Central query-key registry.
 *
 * All hooks, mutations, and the storageEventBridge reference these keys so
 * that invalidateQueries targets exactly the right cache entries.
 *
 * The storage-key → query-key map (STORAGE_KEY_TO_QUERY_KEY) is used by the
 * bridge (Phase 3) to translate window 'storage' events into cache invalidations.
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
}

/**
 * Maps each DYNAMIC storage key string → the query-key array for that domain.
 * The bridge (Phase 3) uses this to call queryClient.invalidateQueries when a
 * window 'storage' event fires for a known key.
 */
export const STORAGE_KEY_TO_QUERY_KEY = {
  nexora_merchant_setup:    qk.merchantSetup(),
  nexora_profile_settings:  qk.profileSettings(),
  nexora_transactions:      qk.transactions(),
  nexora_reviews:           qk.reviews(),
  nexora_notifications:     qk.notifications(),
  nexora_pending_accounts:  qk.pendingAccounts(),
  nexora_staff_account:     qk.staffAccount(),
}
