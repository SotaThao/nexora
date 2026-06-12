/**
 * useStaffInvites — TanStack Query hooks for the staff invite token flow.
 */
import { useQuery, useMutation } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { staffInvitesRepository } from '../repositories/staffInvites'
import type { AcceptStaffInviteDto } from '../../types/hooks'
import type { StaffInviteInfo } from '../../types/domain'

export function useStaffInviteInfo(token?: string | null) {
  return useQuery<StaffInviteInfo>({
    queryKey: qk.staffInvite(token),
    queryFn: () => staffInvitesRepository.getInviteInfo(token!),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useAcceptStaffInvite() {
  return useMutation<void, Error, AcceptStaffInviteDto>({
    mutationFn: ({ token, displayName, position, bio, photoUrl, password }) =>
      staffInvitesRepository.acceptInvite(token, { displayName, position, bio, photoUrl, password }),
  })
}
