/**
 * storageEventBridge — D4: one `window 'storage'` listener at app root.
 *
 * Translates storage-key changes emitted by storage.js / Supabase realtime
 * into targeted `queryClient.invalidateQueries` calls so TanStack Query
 * refetches the right domain without components needing per-domain listeners.
 *
 * In the API phase this module is replaced by Query refetch / websocket logic;
 * no component needs to change.
 */
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { qk, STORAGE_KEY_TO_QUERY_KEY } from './queryKeys'

/**
 * The prefix that storage.js adds to all dynamic keys when not in test mode.
 * Mirrors the value exported from src/utils/storage.js.
 * We replicate it here to avoid a hard import from storage.js, keeping the
 * data layer decoupled from the utility layer.
 */
const STORAGE_PREFIX = 'nexora_v3_'

/**
 * Pure helper — exported for testability.
 *
 * Given the raw `event.key` from a window 'storage' event, returns:
 *   - The matching query-key array if the key maps to a known domain.
 *   - `'all'` if the key is null (Supabase pullAll fires this to signal a
 *     full refresh).
 *   - `null` if the key is not in the registry (unrelated key, ignored).
 *
 * @param {string|null} rawEventKey
 * @returns {Array|'all'|null}
 */
export function resolveQueryKey(rawEventKey) {
  if (rawEventKey === null) {
    return 'all'
  }

  // Strip the versioned prefix if present (e.g. "nexora_v3_nexora_transactions")
  const stripped = rawEventKey.startsWith(STORAGE_PREFIX)
    ? rawEventKey.slice(STORAGE_PREFIX.length)
    : rawEventKey

  return STORAGE_KEY_TO_QUERY_KEY[stripped] ?? null
}

/**
 * All domain query-key arrays — used for the null/all-invalidate case.
 * Listed explicitly so the bridge can invalidate every domain at once when
 * storage.js emits a synthetic event with key=null after a full Supabase pull.
 */
function getAllDomainQueryKeys() {
  return [
    qk.merchantSetup(),
    qk.profileSettings(),
    qk.transactions(),
    qk.reviews(),
    qk.notifications(),
    qk.pendingAccounts(),
    qk.staffAccount(),
  ]
}

/**
 * React hook — mount ONCE at app root (inside QueryClientProvider).
 *
 * Registers a single window 'storage' listener that invalidates the relevant
 * TanStack Query cache entry whenever storage.js or the Supabase realtime
 * bridge emits a change. Cleans up the listener on unmount.
 */
export function useStorageEventBridge() {
  const queryClient = useQueryClient()

  useEffect(() => {
    function handleStorageEvent(event) {
      const result = resolveQueryKey(event.key)

      if (result === null) {
        // Key belongs to an unrelated domain — ignore.
        return
      }

      if (result === 'all') {
        // Null key → invalidate every domain (full refresh after Supabase pull).
        getAllDomainQueryKeys().forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey })
        })
        return
      }

      // Specific domain key — invalidate just that domain.
      queryClient.invalidateQueries({ queryKey: result })
    }

    window.addEventListener('storage', handleStorageEvent)
    return () => {
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [queryClient])
}
