/**
 * TanStack Query hooks for merchant staff management.
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantStaffRepository, { StatusFilter } from '../repositories/merchantStaff'
import type { StaffListPage } from '../repositories/merchantStaff'
import type { StaffMember, StaffSearchResult } from '../../types/domain'
import type { StaffInviteParams, StaffReorderItem, UpdateStaffStatusVars } from '../../types/hooks'

export { StatusFilter }

export function useMerchantStaff({
  statusFilter,
  pageNumber,
  pageSize,
  enabled = true,
}: {
  statusFilter?: string
  pageNumber?: number
  pageSize?: number
  enabled?: boolean
} = {}) {
  return useQuery<StaffListPage>({
    queryKey: qk.merchantStaff(statusFilter, pageNumber, pageSize),
    queryFn: () => merchantStaffRepository.list(statusFilter, pageNumber, pageSize),
    enabled,
    placeholderData: keepPreviousData,
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
    mutationFn: (linkId) => merchantStaffRepository.resendInvite(linkId),
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

export function useApproveStaffLink() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (linkId) => merchantStaffRepository.approveLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

export function useRejectStaffLink() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (linkId) => merchantStaffRepository.rejectLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}
