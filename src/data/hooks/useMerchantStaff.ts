/**
 * TanStack Query hooks for merchant staff management.
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantStaffRepository, { StatusFilter } from '../repositories/merchantStaff'
import type { StaffListPage } from '../repositories/merchantStaff'
import type { StaffMember, StaffSearchResult } from '../../types/domain'
import type { MerchantStaffInvite, StaffInvitesQuery } from '../../types/repositories'
import type { StaffInviteParams, StaffLinkRequestParams, StaffReorderItem, UpdateStaffStatusVars } from '../../types/hooks'

export { StatusFilter }

export function useMerchantStaff({
  statusFilter,
  pageNumber = 1,
  pageSize = 10,
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

/** v3.3 — paged list of staff invites (`GET /merchant/staff/invites`). */
export function useMerchantStaffInvites(
  query: StaffInvitesQuery = {},
  { enabled = true } = {},
) {
  return useQuery<MerchantStaffInvite[]>({
    queryKey: qk.merchantStaffInvites(query),
    queryFn: () => merchantStaffRepository.listInvites(query),
    enabled,
  })
}

/** v3.3 — single invite detail (`GET /merchant/staff/invites/{inviteId}`). */
export function useMerchantStaffInvite(inviteId?: string | null, { enabled = true } = {}) {
  return useQuery<MerchantStaffInvite>({
    queryKey: qk.merchantStaffInvite(inviteId),
    queryFn: () => merchantStaffRepository.getInvite(inviteId!),
    enabled: enabled && !!inviteId,
  })
}

/** v3.3 — cancel/revoke a pending invite (`DELETE /merchant/staff/invites/{inviteId}`). */
export function useCancelStaffInvite() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (inviteId) => merchantStaffRepository.cancelInvite(inviteId),
    onSuccess: () => {
      // qk.merchantStaff() === ['merchantStaff'] is a prefix of the invites/
      // detail keys, so this single invalidation refreshes the roster + invite lists.
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
  return useMutation<void, Error, string | StaffLinkRequestParams>({
    mutationFn: (params) => merchantStaffRepository.sendLinkRequest(params),
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

export function useApproveMerchantStaffLink() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (linkId) => merchantStaffRepository.approveLink(linkId),
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
