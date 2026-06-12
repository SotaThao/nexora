/**
 * TanStack Query hooks for merchant staff management.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantStaffRepository from '../repositories/merchantStaff'
import type { StaffMember, StaffSearchResult } from '../../types/domain'
import type { StaffInviteParams, StaffReorderItem, UpdateStaffStatusVars } from '../../types/hooks'

export function useMerchantStaff({ enabled = true } = {}) {
  return useQuery<StaffMember[]>({
    queryKey: qk.merchantStaff(),
    queryFn: () => merchantStaffRepository.list(),
    enabled,
  })
}

export function useInviteStaff() {
  const queryClient = useQueryClient()
  return useMutation<LooseObject, Error, StaffInviteParams>({
    mutationFn: (params) => merchantStaffRepository.invite(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

export function useResendStaffInvite() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (inviteId) => merchantStaffRepository.resendInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

export function useSearchMerchantStaff(q: string, { enabled = true } = {}) {
  return useQuery<StaffSearchResult[]>({
    queryKey: qk.merchantStaffSearch(q),
    queryFn: () => merchantStaffRepository.search(q),
    enabled: enabled && !!q && q.trim().length > 0,
  })
}

export function useSendStaffLinkRequest() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (staffProfileId) => merchantStaffRepository.sendLinkRequest(staffProfileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

export function useUpdateMerchantStaffStatus() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, UpdateStaffStatusVars>({
    mutationFn: ({ staffLinkId, status }) =>
      merchantStaffRepository.updateStatus(staffLinkId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

export function useRejectMerchantStaffLink() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (linkId) => merchantStaffRepository.rejectLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

export function useReorderMerchantStaff() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, StaffReorderItem[]>({
    mutationFn: (items) => merchantStaffRepository.reorder(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

export function useRemoveMerchantStaff() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (staffLinkId) => merchantStaffRepository.remove(staffLinkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}
