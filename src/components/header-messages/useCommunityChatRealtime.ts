import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSessionRole } from '../../auth/useSessionRole'
import {
  setCommunityChatQueryClient,
  subscribeCommunityChatHub,
} from './communityChatRealtime'

/** Keeps one shared SignalR connection while any messenger surface is mounted. */
export function useCommunityChatRealtime() {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useSessionRole()

  useEffect(() => {
    setCommunityChatQueryClient(queryClient)
    return () => setCommunityChatQueryClient(null)
  }, [queryClient])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    return subscribeCommunityChatHub()
  }, [isAuthenticated])
}
