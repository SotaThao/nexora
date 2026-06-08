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
}
