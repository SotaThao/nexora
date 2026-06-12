/**
 * useStaffSelf — TanStack Query hooks for the staff self-service domain.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import staffSelfRepository from '../repositories/staffSelf'
import type { StaffBusinessLink, StaffLinkRequestDetail, StaffProfile } from '../../types/domain'

export function useStaffProfile({ enabled = true } = {}) {
  return useQuery<StaffProfile | null>({
    queryKey: qk.staffProfile(),
    queryFn: () => staffSelfRepository.getMyProfile(),
    enabled,
  })
}

export function useStaffBusinesses({ enabled = true } = {}) {
  return useQuery<StaffBusinessLink[]>({
    queryKey: qk.staffBusinesses(),
    queryFn: () => staffSelfRepository.getMyBusinesses(),
    enabled,
  })
}

export function useStaffLinkRequest(linkId: string | null | undefined, { enabled = true } = {}) {
  return useQuery<StaffLinkRequestDetail>({
    queryKey: qk.staffLinkRequest(linkId),
    queryFn: () => staffSelfRepository.getLinkRequest(linkId || ''),
    enabled: enabled && !!linkId,
  })
}

export function useAcceptStaffLinkRequest() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (linkId) => staffSelfRepository.acceptLinkRequest(linkId),
    onSuccess: (_data, linkId) => {
      queryClient.invalidateQueries({ queryKey: qk.staffLinkRequest(linkId) })
      queryClient.invalidateQueries({ queryKey: qk.staffBusinesses() })
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
      queryClient.invalidateQueries({ queryKey: qk.notificationsUnreadCount() })
    },
  })
}

export function useRejectStaffLinkRequest() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (linkId) => staffSelfRepository.rejectLinkRequest(linkId),
    onSuccess: (_data, linkId) => {
      queryClient.invalidateQueries({ queryKey: qk.staffLinkRequest(linkId) })
      queryClient.invalidateQueries({ queryKey: qk.staffBusinesses() })
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
      queryClient.invalidateQueries({ queryKey: qk.notificationsUnreadCount() })
    },
  })
}
