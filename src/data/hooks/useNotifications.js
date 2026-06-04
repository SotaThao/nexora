/**
 * useNotifications — TanStack Query hooks for the notifications domain.
 *
 * Hooks:
 *   useNotifications()          → useQuery list of all notifications
 *   useAddNotification()        → useMutation to append a notification
 *   useMarkNotificationRead()   → useMutation to mark one notification as read
 *   useReplaceAllNotifications() → useMutation to replace the full list
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import notificationsRepository from '../repositories/notifications'

export function useNotifications() {
  return useQuery({
    queryKey: qk.notifications(),
    queryFn: () => notificationsRepository.list(),
  })
}

export function useAddNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notification) => notificationsRepository.add(notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => notificationsRepository.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
    },
  })
}

export function useReplaceAllNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (list) => notificationsRepository.replaceAll(list),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
    },
  })
}
