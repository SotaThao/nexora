/**
 * useNotifications — TanStack Query hooks for the notifications domain.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import notificationsRepository from '../repositories/notifications'
import type { NotificationRecord, NotificationsPage } from '../../types/domain'

export function useNotifications() {
  return useQuery<NotificationRecord[]>({
    queryKey: qk.notifications(),
    queryFn: () => notificationsRepository.list(),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: () => notificationsRepository.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
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
