/**
 * useStaffInvites — TanStack Query hooks for the staff invite token flow.
 * These endpoints are anonymous and used by the staff invite portal.
 */
import { useQuery, useMutation } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { staffInvitesRepository } from '../repositories/staffInvites'

/**
 * Hook to load invite metadata by token.
 * Only enabled when token is a non-empty string.
 *
 * @param {string|null|undefined} token - Invite token from the URL
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useStaffInviteInfo(token) {
  return useQuery({
    queryKey: qk.staffInvite(token),
    queryFn: () => staffInvitesRepository.getInviteInfo(token),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000, // 5 min — invite metadata rarely changes
    retry: false, // 400/404 = invalid/expired — no point retrying
  })
}

/**
 * Hook to accept an invite token.
 * No cache invalidation needed since the invitee is anonymous and
 * the merchant's staff list will update via their own query.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useAcceptStaffInvite() {
  return useMutation({
    /**
     * @param {{ token: string, displayName: string, position?: string, bio?: string, photoUrl?: string, password?: string }} vars
     */
    mutationFn: ({ token, displayName, position, bio, photoUrl, password }) =>
      staffInvitesRepository.acceptInvite(token, { displayName, position, bio, photoUrl, password }),
  })
}
