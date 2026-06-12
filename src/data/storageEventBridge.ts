/**
 * storageEventBridge — translates storage-key changes into query invalidations.
 */
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { qk, STORAGE_KEY_TO_QUERY_KEY } from './queryKeys'

const STORAGE_PREFIX = 'nexora_v3_'

export function resolveQueryKey(rawEventKey: string | null): readonly string[] | 'all' | null {
  if (rawEventKey === null) {
    return 'all'
  }

  const stripped = rawEventKey.startsWith(STORAGE_PREFIX)
    ? rawEventKey.slice(STORAGE_PREFIX.length)
    : rawEventKey

  return STORAGE_KEY_TO_QUERY_KEY[stripped] ?? null
}

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

export function useStorageEventBridge() {
  const queryClient = useQueryClient()

  useEffect(() => {
    function handleStorageEvent(event: StorageEvent) {
      const result = resolveQueryKey(event.key)

      if (result === null) {
        return
      }

      if (result === 'all') {
        getAllDomainQueryKeys().forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey })
        })
        return
      }

      queryClient.invalidateQueries({ queryKey: result })
    }

    window.addEventListener('storage', handleStorageEvent)
    return () => {
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [queryClient])
}
