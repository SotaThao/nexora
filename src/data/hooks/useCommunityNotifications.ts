import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCommunityAuth } from '../../components/community/CommunityAuth'
import { mapSupabaseError, type SupabaseDisplayError } from '../../lib/supabaseError'
import { supabaseClient } from '../../lib/supabaseClient'
import { qk } from '../queryKeys'
import { notificationsRepository } from '../repositories/community'
import type { KeysetPage, NotificationDto } from '../repositories/community'

const NOTIFICATIONS_PAGE_SIZE = 24
const MAX_SEEN_NOTIFICATION_IDS = 500

type CommunityError = SupabaseDisplayError

type CommunityNotificationsOptions = {
  enabled?: boolean
  onNewNotification?: (notification: NotificationDto) => void
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

function compareNotifications(first: NotificationDto, second: NotificationDto) {
  const createdAt = second.createdAt.localeCompare(first.createdAt)
  return createdAt || second.id.localeCompare(first.id)
}

function mergeNotifications(existing: NotificationDto[], incoming: NotificationDto[]) {
  const byId = new Map(existing.map((notification) => [notification.id, notification]))
  for (const notification of incoming) byId.set(notification.id, notification)
  return Array.from(byId.values()).sort(compareNotifications)
}

export function useCommunityNotifications({ enabled = true, onNewNotification }: CommunityNotificationsOptions = {}) {
  const { authReady, isAnonymous, user } = useCommunityAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? null
  const notificationEnabled = enabled && authReady && Boolean(userId) && !isAnonymous
  const listKey = useMemo(() => qk.communityNotifications({ limit: NOTIFICATIONS_PAGE_SIZE }), [])
  const countKey = useMemo(() => qk.communityNotificationsUnreadCount(), [])
  const [subscriptionAttempt, setSubscriptionAttempt] = useState(0)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [realtimeError, setRealtimeError] = useState<CommunityError | null>(null)
  const [loadMoreError, setLoadMoreError] = useState<CommunityError | null>(null)
  const hasSubscribedRef = useRef(false)
  const seenIdsRef = useRef(new Set<string>())
  const seenIdsUserRef = useRef<string | null>(null)
  const newNotificationRef = useRef(onNewNotification)

  useEffect(() => {
    newNotificationRef.current = onNewNotification
  }, [onNewNotification])

  const listQuery = useQuery<KeysetPage<NotificationDto>, CommunityError>({
    queryKey: listKey,
    queryFn: () => notificationsRepository.list({ limit: NOTIFICATIONS_PAGE_SIZE }),
    enabled: notificationEnabled,
    retry: false,
  })

  const unreadQuery = useQuery<number, CommunityError>({
    queryKey: countKey,
    queryFn: () => notificationsRepository.getUnreadCount(),
    enabled: notificationEnabled,
    retry: false,
  })

  useEffect(() => {
    for (const notification of listQuery.data?.items ?? []) seenIdsRef.current.add(notification.id)
  }, [listQuery.data?.items])

  const addSeenId = useCallback((notificationId: string) => {
    if (seenIdsRef.current.has(notificationId)) return false
    seenIdsRef.current.add(notificationId)
    if (seenIdsRef.current.size > MAX_SEEN_NOTIFICATION_IDS) {
      const oldest = seenIdsRef.current.values().next().value
      if (oldest) seenIdsRef.current.delete(oldest)
    }
    return true
  }, [])

  const mergeIntoListCache = useCallback((incoming: NotificationDto[], nextCursor?: KeysetPage<NotificationDto>['nextCursor']) => {
    queryClient.setQueryData<KeysetPage<NotificationDto>>(listKey, (current) => {
      const items = mergeNotifications(current?.items ?? [], incoming)
      return {
        items,
        nextCursor: nextCursor ?? current?.nextCursor ?? null,
        previousCursor: items[0] ? { createdAt: items[0].createdAt, id: items[0].id } : null,
      }
    })
  }, [listKey, queryClient])

  useEffect(() => {
    if (!notificationEnabled || !userId) return

    let active = true
    if (seenIdsUserRef.current !== userId) {
      seenIdsRef.current = new Set()
      seenIdsUserRef.current = userId
      hasSubscribedRef.current = false
    }

    const syncAfterSubscribed = async () => {
      try {
        const [page, unreadCount] = await Promise.all([
          notificationsRepository.list({ limit: NOTIFICATIONS_PAGE_SIZE }),
          notificationsRepository.getUnreadCount(),
        ])
        if (!active) return
        for (const notification of page.items) seenIdsRef.current.add(notification.id)
        mergeIntoListCache(page.items, page.nextCursor)
        queryClient.setQueryData(countKey, unreadCount)
        setRealtimeError(null)
      } catch (error) {
        if (active) setRealtimeError(asCommunityError(error))
      }
    }

    const realtimeChannel = supabaseClient
      .channel(`community-notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const notification = notificationsRepository.fromRealtime(payload.new)
          if (!notification || notification.userId !== userId || !addSeenId(notification.id)) return
          mergeIntoListCache([notification])
          if (!notification.readAt) {
            queryClient.setQueryData<number>(countKey, (current) => (current ?? 0) + 1)
          }
          newNotificationRef.current?.(notification)
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
  }, [addSeenId, countKey, mergeIntoListCache, notificationEnabled, queryClient, subscriptionAttempt, userId])

  const markReadMutation = useMutation<NotificationDto, CommunityError, string>({
    mutationFn: (notificationId) => notificationsRepository.markRead(notificationId),
    onSuccess: (notification) => {
      queryClient.setQueryData<KeysetPage<NotificationDto>>(listKey, (current) => current
        ? { ...current, items: current.items.map((item) => item.id === notification.id ? notification : item) }
        : current)
      void queryClient.invalidateQueries({ queryKey: listKey })
      void queryClient.invalidateQueries({ queryKey: countKey })
    },
  })

  const markAllReadMutation = useMutation<void, CommunityError>({
    mutationFn: () => notificationsRepository.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listKey })
      void queryClient.invalidateQueries({ queryKey: countKey })
    },
  })

  const loadMore = useCallback(async () => {
    const current = queryClient.getQueryData<KeysetPage<NotificationDto>>(listKey)
    if (!current?.nextCursor || isLoadingMore) return
    setIsLoadingMore(true)
    setLoadMoreError(null)
    try {
      const page = await notificationsRepository.list({ cursor: current.nextCursor, limit: NOTIFICATIONS_PAGE_SIZE })
      queryClient.setQueryData<KeysetPage<NotificationDto>>(listKey, (cached) => {
        const items = mergeNotifications(cached?.items ?? [], page.items)
        return {
          items,
          nextCursor: page.nextCursor,
          previousCursor: items[0] ? { createdAt: items[0].createdAt, id: items[0].id } : null,
        }
      })
    } catch (error) {
      setLoadMoreError(asCommunityError(error))
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, listKey, queryClient])

  const retry = useCallback(() => {
    setRealtimeError(null)
    setLoadMoreError(null)
    setIsReconnecting(true)
    setSubscriptionAttempt((attempt) => attempt + 1)
    void listQuery.refetch()
    void unreadQuery.refetch()
  }, [listQuery, unreadQuery])

  return {
    notifications: listQuery.data?.items ?? [],
    unreadCount: unreadQuery.data ?? 0,
    hasMore: Boolean(listQuery.data?.nextCursor),
    isLoading: !authReady || (notificationEnabled && (listQuery.isLoading || unreadQuery.isLoading)),
    isLoadingMore,
    isReconnecting,
    error: listQuery.error ?? unreadQuery.error ?? loadMoreError ?? realtimeError,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
    markReadError: markReadMutation.error ?? markAllReadMutation.error,
    loadMore,
    retry,
  }
}
