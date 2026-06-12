/**
 * useNotifications — TanStack Query hooks for the notifications domain.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import notificationsRepository from '../repositories/notifications'
import type { NotificationRecord } from '../../types/domain'

export function useNotifications() {
  return useQuery<NotificationRecord[]>({
    queryKey: qk.notifications(),
    queryFn: () => notificationsRepository.list() as Promise<NotificationRecord[]>,
    staleTime: 2 * 60_000, // 2 min — avoid refetch on every remount
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
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
      queryClient.invalidateQueries({ queryKey: qk.notificationsUnreadCount() })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: () => notificationsRepository.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
      queryClient.invalidateQueries({ queryKey: qk.notificationsUnreadCount() })
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
