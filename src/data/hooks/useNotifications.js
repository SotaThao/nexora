/**
 * useNotifications — TanStack Query hooks for the notifications domain.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import notificationsRepository from '../repositories/notifications'

export function useNotifications() {
  return useQuery({
    queryKey: qk.notifications(),
    queryFn: () => notificationsRepository.list(),
    staleTime: 2 * 60_000, // 2 min — avoid refetch on every remount
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: qk.notificationsUnreadCount(),
    queryFn: () => notificationsRepository.unreadCount(),
    refetchInterval: 60 * 1000, // 60s
    refetchOnWindowFocus: true,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => notificationsRepository.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
      queryClient.invalidateQueries({ queryKey: qk.notificationsUnreadCount() })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
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
  return useMutation({
    mutationFn: (notification) => notificationsRepository.add(notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
    },
  })
}

/** @deprecated server-side */
export function useReplaceAllNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (list) => notificationsRepository.replaceAll(list),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
    },
  })
}
