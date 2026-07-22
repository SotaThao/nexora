import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { mapSupabaseError, type SupabaseDisplayError } from '../../lib/supabaseError'
import { supabaseClient } from '../../lib/supabaseClient'
import { qk } from '../queryKeys'
import { channelsRepository, messagesRepository } from '../repositories/community'
import type { ChannelDto, CreateMessageInput, KeysetCursor, MessageDto } from '../repositories/community'
import { useCommunityAuth } from '../../components/community/CommunityAuth'

const CHAT_PAGE_SIZE = 40

type CommunityError = SupabaseDisplayError

type ChatMessageCache = {
  items: MessageDto[]
  olderCursor: KeysetCursor | null
  historyLoaded: boolean
}

function asCommunityError(error: unknown): CommunityError {
  if (typeof error === 'object' && error !== null) {
    const value = error as Partial<CommunityError>
    if (typeof value.message === 'string' && typeof value.retryable === 'boolean') {
      return { message: value.message, retryable: value.retryable, code: value.code }
    }
  }
  return mapSupabaseError(error)
}

function compareMessages(first: MessageDto, second: MessageDto) {
  const createdAt = first.createdAt.localeCompare(second.createdAt)
  return createdAt || first.id.localeCompare(second.id)
}

function mergeMessages(existing: MessageDto[], incoming: MessageDto[]) {
  const byId = new Map(existing.map((message) => [message.id, message]))
  for (const message of incoming) {
    const previous = byId.get(message.id)
    byId.set(message.id, {
      ...previous,
      ...message,
      sender: message.sender ?? previous?.sender,
    })
  }
  return Array.from(byId.values()).sort(compareMessages)
}

function latestCursor(messages: MessageDto[]): KeysetCursor | null {
  const latest = messages[messages.length - 1]
  return latest ? { createdAt: latest.createdAt, id: latest.id } : null
}

type UseCommunityChatOptions = {
  directChannelId?: string | null
  enabled?: boolean
}

export function useCommunityChat(
  communityId?: string | null,
  { directChannelId, enabled = true }: UseCommunityChatOptions = {},
) {
  const { authReady } = useCommunityAuth()
  const queryClient = useQueryClient()
  const [subscriptionAttempt, setSubscriptionAttempt] = useState(0)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [historyError, setHistoryError] = useState<CommunityError | null>(null)
  const [realtimeError, setRealtimeError] = useState<CommunityError | null>(null)
  const hasSubscribedRef = useRef(false)
  const chatEnabled = enabled && authReady

  const channelQuery = useQuery<ChannelDto | null, CommunityError>({
    queryKey: directChannelId
      ? qk.communityDirectChannel(directChannelId)
      : qk.communityChatChannel(communityId ?? ''),
    queryFn: () =>
      directChannelId
        ? Promise.resolve({
            id: directChannelId,
            communityId: null,
            kind: 'direct' as const,
            name: 'Direct',
            createdAt: new Date().toISOString(),
          })
        : channelsRepository.getMain(communityId!),
    enabled: chatEnabled && (Boolean(directChannelId) || Boolean(communityId)),
    retry: false,
  })

  const channelId = directChannelId || channelQuery.data?.id
  const messagesKey = useMemo(() => qk.communityChatMessages(channelId ?? ''), [channelId])
  const messagesQuery = useQuery<ChatMessageCache, CommunityError>({
    queryKey: messagesKey,
    queryFn: async () => {
      const page = await messagesRepository.list(channelId!, { direction: 'backward', limit: CHAT_PAGE_SIZE })
      return { items: page.items, olderCursor: page.nextCursor, historyLoaded: true }
    },
    // Load history via REST as soon as the channel resolves — do NOT couple it to
    // the realtime subscription. If Realtime is slow/unavailable, the chat must
    // still render its history (otherwise the loading skeleton hangs forever).
    // The realtime subscription then only appends new messages / catches up.
    enabled: chatEnabled && Boolean(channelId),
    retry: false,
  })

  const mergeIntoCache = useCallback((incoming: MessageDto[]) => {
    queryClient.setQueryData<ChatMessageCache>(messagesKey, (current) => ({
      items: mergeMessages(current?.items ?? [], incoming),
      olderCursor: current?.olderCursor ?? null,
      historyLoaded: current?.historyLoaded ?? false,
    }))
  }, [messagesKey, queryClient])

  useEffect(() => {
    if (!channelId || !chatEnabled) return

    let active = true

    const mergeHistoryPage = (items: MessageDto[], olderCursor: KeysetCursor | null) => {
      queryClient.setQueryData<ChatMessageCache>(messagesKey, (current) => ({
        items: mergeMessages(current?.items ?? [], items),
        olderCursor,
        historyLoaded: true,
      }))
    }

    const catchUpAfter = async (startingCursor: KeysetCursor) => {
      let cursor: KeysetCursor | null = startingCursor
      while (cursor && active) {
        const page = await messagesRepository.list(channelId, {
          cursor,
          direction: 'forward',
          limit: CHAT_PAGE_SIZE,
        })
        if (!active) return
        mergeIntoCache(page.items)
        cursor = page.nextCursor
      }
    }

    const syncAfterSubscribed = async () => {
      setHistoryError(null)
      setRealtimeError(null)
      try {
        const current = queryClient.getQueryData<ChatMessageCache>(messagesKey)
        if (!current?.historyLoaded) {
          const page = await messagesRepository.list(channelId, { direction: 'backward', limit: CHAT_PAGE_SIZE })
          if (!active) return
          mergeHistoryPage(page.items, page.nextCursor)
          const pageLatest = latestCursor(page.items)
          if (pageLatest) await catchUpAfter(pageLatest)
          return
        }

        const lastSeen = latestCursor(current.items)
        if (lastSeen) {
          await catchUpAfter(lastSeen)
          return
        }

        // An empty cached history has no cursor. Re-read the recent window so
        // messages sent while this client was disconnected are not skipped.
        const page = await messagesRepository.list(channelId, { direction: 'backward', limit: CHAT_PAGE_SIZE })
        if (!active) return
        mergeHistoryPage(page.items, page.nextCursor)
      } catch (error) {
        if (active) setHistoryError(asCommunityError(error))
      }
    }

    const realtimeChannel = supabaseClient
      .channel(`community-chat:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const message = messagesRepository.fromRealtime(payload.new)
          if (message?.channelId === channelId) mergeIntoCache([message])
        },
      )
      .subscribe((status) => {
        if (!active) return
        if (status === 'SUBSCRIBED') {
          setIsReconnecting(hasSubscribedRef.current)
          hasSubscribedRef.current = true
          void syncAfterSubscribed().finally(() => {
            if (active) setIsReconnecting(false)
          })
          return
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setIsReconnecting(true)
          setRealtimeError(mapSupabaseError({ name: 'RealtimeChannelError', message: status }))
        }
      })

    return () => {
      active = false
      void supabaseClient.removeChannel(realtimeChannel)
    }
  }, [channelId, chatEnabled, mergeIntoCache, messagesKey, queryClient, subscriptionAttempt])

  const loadOlder = useCallback(async () => {
    const current = queryClient.getQueryData<ChatMessageCache>(messagesKey)
    if (!channelId || !current?.olderCursor || isLoadingOlder) return
    setIsLoadingOlder(true)
    setHistoryError(null)
    try {
      const page = await messagesRepository.list(channelId, {
        cursor: current.olderCursor,
        direction: 'backward',
        limit: CHAT_PAGE_SIZE,
      })
      queryClient.setQueryData<ChatMessageCache>(messagesKey, (cached) => ({
        items: mergeMessages(cached?.items ?? [], page.items),
        olderCursor: page.nextCursor,
        historyLoaded: true,
      }))
    } catch (error) {
      setHistoryError(asCommunityError(error))
    } finally {
      setIsLoadingOlder(false)
    }
  }, [channelId, isLoadingOlder, messagesKey, queryClient])

  const sendMutation = useMutation<MessageDto, CommunityError, CreateMessageInput>({
    mutationFn: (input) => messagesRepository.send(input),
  })

  const retry = useCallback(() => {
    setHistoryError(null)
    setRealtimeError(null)
    setIsReconnecting(true)
    setSubscriptionAttempt((attempt) => attempt + 1)
    void channelQuery.refetch()
  }, [channelQuery])

  const history = messagesQuery.data
  return {
    channel: channelQuery.data,
    channelError: channelQuery.error,
    messages: history?.items ?? [],
    hasOlderMessages: Boolean(history?.olderCursor),
    isLoading: !authReady || channelQuery.isLoading || (Boolean(channelId) && !history?.historyLoaded && !historyError),
    isLoadingOlder,
    isReconnecting,
    error: channelQuery.error ?? historyError ?? realtimeError,
    loadOlder,
    retry,
    sendMessage: sendMutation.mutateAsync,
    sendError: sendMutation.error,
    isSending: sendMutation.isPending,
  }
}
