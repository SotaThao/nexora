import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { CommunityChatMessageType } from '../../constants/communityChat'
import type { CommunityChatSession } from '../../types/communityChat'
import { patchCommunityChatSessionLastMessage } from '../communityChatCache'
import { qk } from '../queryKeys'
import communityChatRepository from '../repositories/communityChat'

const LATEST_MESSAGE_PAGE = { pageNumber: 1, pageSize: 1 } as const

function sessionNeedsLastMessageHydration(session: CommunityChatSession): boolean {
  if (!session.lastMessageAt) return false
  if (String(session.lastMessagePreview ?? '').trim()) return false
  // Image rows usually ship a server preview ("Sent a photo"); skip extra fetch.
  if (session.lastMessageType === CommunityChatMessageType.Image) return false
  return true
}

/**
 * Fallback when session list has lastMessageAt but empty lastMessagePreview —
 * fetch newest message (pageSize 1) and patch the sessions cache.
 */
export function useHydrateCommunityChatLastMessagePreviews(
  sessions: CommunityChatSession[],
  { enabled = true }: { enabled?: boolean } = {},
) {
  const queryClient = useQueryClient()

  const hydrateIds = useMemo(
    () => sessions
      .filter(sessionNeedsLastMessageHydration)
      .map((session) => session.id)
      .filter(Boolean)
      .sort()
      .join(','),
    [sessions],
  )

  useEffect(() => {
    if (!enabled || !hydrateIds) return undefined

    let cancelled = false
    const sessionIds = hydrateIds.split(',')

    void (async () => {
      await Promise.all(sessionIds.map(async (sessionId) => {
        try {
          const page = await queryClient.fetchQuery({
            queryKey: qk.communityChatMessages(sessionId, LATEST_MESSAGE_PAGE),
            queryFn: () => communityChatRepository.listMessages(sessionId, LATEST_MESSAGE_PAGE),
            staleTime: 15_000,
          })
          if (cancelled) return
          const latest = page.items[0]
          if (!latest) return
          patchCommunityChatSessionLastMessage(queryClient, latest)
        } catch {
          // Preview is best-effort; chat window still loads full history.
        }
      }))
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, hydrateIds, queryClient])
}
