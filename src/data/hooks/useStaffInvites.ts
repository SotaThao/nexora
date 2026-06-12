/**
 * useStaffInvites — TanStack Query hooks for the staff invite token flow.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { staffInvitesRepository } from '../repositories/staffInvites'
import profileSettingsRepository from '../repositories/profileSettings'
import { buildJoinPublicInvitePayload } from '../../utils/joinPublicInvite'
import type { AcceptStaffInviteDto } from '../../types/hooks'
import type { StaffInviteInfo, UserProfile } from '../../types/domain'

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

export function useJoinPublicInvite() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      let profile = queryClient.getQueryData<UserProfile | null>(qk.userProfile())
      if (!profile) {
        profile = await profileSettingsRepository.get()
      }

      const payload = buildJoinPublicInvitePayload(profile)
      if (!payload.referralCode) {
        throw Object.assign(new Error('REFERRAL_CODE_REQUIRED'), {
          errorCode: 'REFERRAL_CODE_REQUIRED',
        })
      }

      await staffInvitesRepository.joinPublicInvite(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staffBusinesses() })
    },
  })
}
