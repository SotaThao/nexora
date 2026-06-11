/**
 * TanStack Query hooks for merchant staff management.
 *
 * All mutations invalidate the `merchantStaff` query key so the staff
 * list refetches after every server-side state change.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantStaffRepository, { StatusFilter } from '../repositories/merchantStaff'

export { StatusFilter }


/**
 * Fetch the merchant's staff list (links + pending invites).
 * @param {{ statusFilter?: string, enabled?: boolean }} [options]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useMerchantStaff({ statusFilter, pageNumber, pageSize, enabled = true } = {}) {
  return useQuery({
    queryKey: qk.merchantStaff(statusFilter, pageNumber, pageSize),
    queryFn: () => merchantStaffRepository.list(statusFilter, pageNumber, pageSize),
    enabled,
  })
}

/**
 * Invite a new staff member.
 * Invalidates the staff list on success so the new pending invite row appears.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useInviteStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params) => merchantStaffRepository.invite(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

/**
 * Resend a pending staff invite notification.
 * Invalidates the staff list on success.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useResendStaffInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (inviteId) => merchantStaffRepository.resendInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

/**
 * Search existing staff profiles.
 * The query is only enabled when `q` is a non-empty string.
 *
 * @param {string} q - Search query string
 * @param {{ enabled?: boolean }} [options]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useSearchMerchantStaff(q, { enabled = true } = {}) {
  return useQuery({
    queryKey: qk.merchantStaffSearch(q),
    queryFn: () => merchantStaffRepository.search(q),
    enabled: enabled && !!q && q.trim().length > 0,
  })
}

/**
 * Send a link request to an existing staff profile.
 * Invalidates the staff list on success.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useSendStaffLinkRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (staffProfileId) => merchantStaffRepository.sendLinkRequest(staffProfileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

/**
 * Update the status of a staff link (Active / Inactive / etc.).
 * Invalidates the staff list on success.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateMerchantStaffStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ staffLinkId, status }) =>
      merchantStaffRepository.updateStatus(staffLinkId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

/**
 * Persist staff display order.
 * Invalidates the staff list on success.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useReorderMerchantStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items) => merchantStaffRepository.reorder(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

/**
 * Remove (unlink/delete) a staff link.
 * Invalidates the staff list on success.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useRemoveMerchantStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (staffLinkId) => merchantStaffRepository.remove(staffLinkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

/**
 * Approve a staff link request.
 * Invalidates the staff list on success.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useApproveStaffLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (linkId) => merchantStaffRepository.approveLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

/**
 * Reject a staff link request.
 * Invalidates the staff list on success.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useRejectStaffLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (linkId) => merchantStaffRepository.rejectLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}
