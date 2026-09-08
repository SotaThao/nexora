import { useEffect, useRef } from 'react'
import { useMarkCommunityChatSessionRead } from '../../data/hooks/useCommunityChat'
import {
  joinCommunityChatHubSession,
  leaveCommunityChatHubSession,
} from './communityChatRealtime'

/**
 * Join hub + mark-read while a chat surface is active.
 * Clears the mark-read guard on leave so minimize → expand marks read again.
 */
export function useCommunityChatSessionOpen(sessionId: string | null | undefined, enabled = true) {
  const markReadMutation = useMarkCommunityChatSessionRead()
  const markedSessionIdsRef = useRef(new Set<string>())

  useEffect(() => {
    if (!enabled || !sessionId) return undefined

    void joinCommunityChatHubSession(sessionId)

    if (!markedSessionIdsRef.current.has(sessionId)) {
      markedSessionIdsRef.current.add(sessionId)
      markReadMutation.mutate(sessionId)
    }

    return () => {
      markedSessionIdsRef.current.delete(sessionId)
      void leaveCommunityChatHubSession(sessionId)
    }
    // markReadMutation is stable enough for once-per-open; omit from deps on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionId])
}
