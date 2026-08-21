import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useSessionRole } from '../../auth/useSessionRole'
import {
  setCommunityChatCurrentUserProfileId,
  setCommunityChatQueryClient,
  subscribeCommunityChatHub,
} from './communityChatRealtime'

/** Keeps one shared SignalR connection while any messenger surface is mounted. */
export function useCommunityChatRealtime({ enabled = true }: { enabled?: boolean } = {}) {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const { isAuthenticated } = useSessionRole()
  const currentUserProfileId = session?.id ?? ''

  useEffect(() => {
    if (!enabled) return undefined
    setCommunityChatQueryClient(queryClient)
    return () => setCommunityChatQueryClient(null)
  }, [enabled, queryClient])

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      setCommunityChatCurrentUserProfileId(null)
      return undefined
    }
    setCommunityChatCurrentUserProfileId(currentUserProfileId)
    return () => setCommunityChatCurrentUserProfileId(null)
  }, [currentUserProfileId, enabled, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !enabled) return undefined
    return subscribeCommunityChatHub()
  }, [enabled, isAuthenticated])
}
