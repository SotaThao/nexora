/**
 * TanStack Query hooks for POS Owner Setup: Staff Profile (US-019).
 */
import { useContext } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posStaffProfileRepository, { type SaveStaffPosProfileParams } from '../repositories/posStaffProfile'
import { AuthContext } from '../../auth/AuthContext'
import type { PosStaffProfileApiDto } from '../../types/repositories'

export function useStaffPosProfile(businessStaffLinkId: string | undefined) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return useQuery<PosStaffProfileApiDto>({
    queryKey: qk.merchantPosStaffProfile(businessStaffLinkId),
    queryFn: () => posStaffProfileRepository.getStaffPosProfile(businessStaffLinkId as string),
    enabled: isOwner && !!businessStaffLinkId,
    retry: false,
    // Keep the previously-selected staff's profile rendered while the newly selected
    // staff's data fetches, instead of collapsing the two-card detail panel down to a
    // skeleton on every click — that collapse/expand was the reported UI jank.
    placeholderData: keepPreviousData,
  })
}

export function useSaveStaffPosProfile() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, SaveStaffPosProfileParams>({
    mutationFn: (params) => posStaffProfileRepository.saveStaffPosProfile(params),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosStaffProfile(params.businessStaffLinkId) })
    },
  })
}

export function useUpdateStaffPosContractType() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { businessStaffLinkId: string; contractType: string }>({
    mutationFn: ({ businessStaffLinkId, contractType }) =>
      posStaffProfileRepository.updateContractType(businessStaffLinkId, contractType),
    onSuccess: (_, { businessStaffLinkId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosStaffProfile(businessStaffLinkId) })
    },
  })
}
