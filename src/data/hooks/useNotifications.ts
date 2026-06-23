/**
 * useNotifications — TanStack Query hooks for the notifications domain.
 */
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import notificationsRepository from '../repositories/notifications'
import type { NotificationRecord, NotificationsPage } from '../../types/domain'

function isNotificationUnread(notification: NotificationRecord | undefined): boolean {
  if (!notification) return false
  return !notification.read && !notification.isRead
}

function findNotificationInCache(
  queryClient: QueryClient,
  id: string,
): NotificationRecord | undefined {
  const list = queryClient.getQueryData<NotificationRecord[]>(qk.notifications())
  const fromList = list?.find((item) => item.id === id)
  if (fromList) return fromList

  const pagedQueries = queryClient.getQueriesData<NotificationsPage>({
    queryKey: ['notifications', 'list'],
  })
  for (const [, page] of pagedQueries) {
    const fromPage = page?.items.find((item) => item.id === id)
    if (fromPage) return fromPage
  }

  return undefined
}

function markNotificationReadInRecord(notification: NotificationRecord): NotificationRecord {
  return { ...notification, read: true, isRead: true }
}

function patchNotificationReadInCache(queryClient: QueryClient, id: string) {
  const target = findNotificationInCache(queryClient, id)
  if (isNotificationUnread(target)) {
    queryClient.setQueryData<number>(qk.notificationsUnreadCount(), (current = 0) =>
      Math.max(0, current - 1),
    )
  }

  queryClient.setQueryData<NotificationRecord[]>(qk.notifications(), (current) =>
    current?.map((item) => (item.id === id ? markNotificationReadInRecord(item) : item)),
  )

  queryClient.setQueriesData<NotificationsPage>(
    { queryKey: ['notifications', 'list'] },
    (current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === id ? markNotificationReadInRecord(item) : item,
            ),
          }
        : current,
  )
}

function patchAllNotificationsReadInCache(queryClient: QueryClient) {
  queryClient.setQueryData<number>(qk.notificationsUnreadCount(), 0)

  queryClient.setQueryData<NotificationRecord[]>(qk.notifications(), (current) =>
    current?.map(markNotificationReadInRecord),
  )

  queryClient.setQueriesData<NotificationsPage>(
    { queryKey: ['notifications', 'list'] },
    (current) =>
      current
        ? {
            ...current,
            items: current.items.map(markNotificationReadInRecord),
          }
        : current,
  )
}

export function useNotifications({ enabled: callerEnabled = true } = {}) {
  return useQuery<NotificationRecord[]>({
    queryKey: qk.notifications(),
    queryFn: () => notificationsRepository.list(),
    enabled: callerEnabled,
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useNotificationsPage({
  pageNumber = 1,
  pageSize = 20,
}: {
  pageNumber?: number
  pageSize?: number
} = {}) {
  return useQuery<NotificationsPage>({
    queryKey: qk.notificationsList({ pageNumber, pageSize }),
    queryFn: () => notificationsRepository.listPaged({ pageNumber, pageSize }),
  })
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: qk.notificationsUnreadCount(),
    queryFn: () => notificationsRepository.unreadCount(),
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => notificationsRepository.markRead(id),
    onMutate: (id) => {
      patchNotificationReadInCache(queryClient, id)
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: () => notificationsRepository.markAllRead(),
    onMutate: () => {
      patchAllNotificationsReadInCache(queryClient)
    },
  })
}

/** @deprecated server-side */
export function useAddNotification() {
  const queryClient = useQueryClient()
  return useMutation<NotificationRecord, Error, NotificationRecord>({
    mutationFn: (notification) => notificationsRepository.add(notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
    },
  })
}

/** @deprecated server-side */
export function useReplaceAllNotifications() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, NotificationRecord[]>({
    mutationFn: (list) => notificationsRepository.replaceAll(list),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
    },
  })
}
