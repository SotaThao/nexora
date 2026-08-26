import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { COMMUNITY_CHAT_DEFAULT_PAGE_SIZE } from '../../constants/communityChat'
import type { CommunityChatMessage } from '../../types/communityChat'
import { qk } from '../queryKeys'
import communityChatRepository from '../repositories/communityChat'

/**
 * Paged message history (newest-first pages).
 * Page 1 = latest messages; fetchNextPage loads older history for scroll-up.
 */
export function useCommunityChatMessagesInfinite(
  sessionId: string | null | undefined,
  {
    enabled = true,
    pageSize = COMMUNITY_CHAT_DEFAULT_PAGE_SIZE,
  }: {
    enabled?: boolean
    pageSize?: number
  } = {},
) {
  const query = useInfiniteQuery({
    queryKey: qk.communityChatMessagesInfinite(sessionId, pageSize),
    queryFn: ({ pageParam }) => communityChatRepository.listMessages(sessionId!, {
      pageNumber: pageParam,
      pageSize,
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (
      lastPage.hasNextPage
        ? (lastPage.pageNumber ?? 1) + 1
        : undefined
    ),
    enabled: enabled && Boolean(sessionId),
    staleTime: 15_000,
  })

  const messages = useMemo(() => {
    const seen = new Set<string>()
    const flattened: CommunityChatMessage[] = []

    query.data?.pages.forEach((page) => {
      page.items.forEach((message) => {
        if (!message.id || seen.has(message.id)) return
        seen.add(message.id)
        flattened.push(message)
      })
    })

    return flattened
  }, [query.data?.pages])

  const fetchOlderMessages = useCallback(async () => {
    if (!query.hasNextPage || query.isFetchingNextPage) return null
    return query.fetchNextPage()
  }, [query])

  return {
    messages,
    isLoading: query.isLoading,
    isError: query.isError,
    hasOlderMessages: Boolean(query.hasNextPage),
    isFetchingOlderMessages: query.isFetchingNextPage,
    fetchOlderMessages,
    totalCount: query.data?.pages[0]?.totalCount ?? messages.length,
  }
}
