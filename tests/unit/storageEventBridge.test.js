/**
 * Unit tests for storageEventBridge — specifically the pure resolveQueryKey()
 * helper that maps a raw window-storage event key → query-key array (or 'all').
 *
 * The hook itself (useStorageEventBridge) is tested via integration: mounting
 * in App is covered by existing component tests. The pure helper is the unit
 * under test here.
 */
import { describe, it, expect } from 'vitest'
import { resolveQueryKey } from '../../src/data/storageEventBridge'
import { qk } from '../../src/data/queryKeys'

describe('resolveQueryKey', () => {
  // -------------------------------------------------------------------------
  // Null key → full-refresh signal from Supabase pullAll
  // -------------------------------------------------------------------------
  it('returns "all" when event.key is null', () => {
    expect(resolveQueryKey(null)).toBe('all')
  })

  // -------------------------------------------------------------------------
  // Bare keys (no prefix) — storage.js in test mode omits the prefix
  // -------------------------------------------------------------------------
  it('maps bare nexora_transactions to transactions query key', () => {
    expect(resolveQueryKey('nexora_transactions')).toEqual(qk.transactions())
  })

  it('maps bare nexora_merchant_setup to merchantSetup query key', () => {
    expect(resolveQueryKey('nexora_merchant_setup')).toEqual(qk.merchantSetup())
  })

  it('maps bare nexora_profile_settings to profileSettings query key', () => {
    expect(resolveQueryKey('nexora_profile_settings')).toEqual(qk.profileSettings())
  })

  it('maps bare nexora_reviews to reviews query key', () => {
    expect(resolveQueryKey('nexora_reviews')).toEqual(qk.reviews())
  })

  it('maps bare nexora_notifications to notifications query key', () => {
    expect(resolveQueryKey('nexora_notifications')).toEqual(qk.notifications())
  })

  it('maps bare nexora_pending_accounts to pendingAccounts query key', () => {
    expect(resolveQueryKey('nexora_pending_accounts')).toEqual(qk.pendingAccounts())
  })

  it('maps bare nexora_staff_account to staffAccount query key', () => {
    expect(resolveQueryKey('nexora_staff_account')).toEqual(qk.staffAccount())
  })

  // -------------------------------------------------------------------------
  // Prefixed keys — storage.js in production adds "nexora_v3_" prefix
  // -------------------------------------------------------------------------
  it('strips nexora_v3_ prefix and maps nexora_transactions', () => {
    expect(resolveQueryKey('nexora_v3_nexora_transactions')).toEqual(qk.transactions())
  })

  it('strips nexora_v3_ prefix and maps nexora_merchant_setup', () => {
    expect(resolveQueryKey('nexora_v3_nexora_merchant_setup')).toEqual(qk.merchantSetup())
  })

  it('strips nexora_v3_ prefix and maps nexora_profile_settings', () => {
    expect(resolveQueryKey('nexora_v3_nexora_profile_settings')).toEqual(qk.profileSettings())
  })

  it('strips nexora_v3_ prefix and maps nexora_reviews', () => {
    expect(resolveQueryKey('nexora_v3_nexora_reviews')).toEqual(qk.reviews())
  })

  it('strips nexora_v3_ prefix and maps nexora_notifications', () => {
    expect(resolveQueryKey('nexora_v3_nexora_notifications')).toEqual(qk.notifications())
  })

  it('strips nexora_v3_ prefix and maps nexora_pending_accounts', () => {
    expect(resolveQueryKey('nexora_v3_nexora_pending_accounts')).toEqual(qk.pendingAccounts())
  })

  it('strips nexora_v3_ prefix and maps nexora_staff_account', () => {
    expect(resolveQueryKey('nexora_v3_nexora_staff_account')).toEqual(qk.staffAccount())
  })

  // -------------------------------------------------------------------------
  // Unknown / unrelated keys → null (ignored)
  // -------------------------------------------------------------------------
  it('returns null for an unrelated key', () => {
    expect(resolveQueryKey('some_unrelated_key')).toBeNull()
  })

  it('returns null for a prefixed but non-domain key', () => {
    expect(resolveQueryKey('nexora_v3_some_other_key')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(resolveQueryKey('')).toBeNull()
  })
})
