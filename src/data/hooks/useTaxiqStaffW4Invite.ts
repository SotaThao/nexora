/**
 * TanStack Query hooks for US-028 (Staff W-4 secure invite link). The context/submit
 * hooks deliberately do NOT call useAuth() — the token comes from the URL query
 * string, not the JWT session (mirrors useTaxiqCpaViewer.ts).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqStaffW4InviteRepository from '../repositories/taxiqStaffW4Invite'
import type {
  CreateStaffW4InviteParams,
  StaffW4Invite,
  StaffW4InviteContext,
  SubmitStaffW4ViaInviteParams,
} from '../repositories/taxiqStaffW4Invite'

export function useCreateStaffW4Invite(ownerTaxYearId?: string) {
  const queryClient = useQueryClient()
  return useMutation<StaffW4Invite, Error, CreateStaffW4InviteParams>({
    mutationFn: (params) => taxiqStaffW4InviteRepository.createOrResendInvite(params),
    onSuccess: () => {
      if (ownerTaxYearId) queryClient.invalidateQueries({ queryKey: qk.taxiqOwnerStaffList(ownerTaxYearId) })
    },
  })
}

export function useStaffW4InviteContext(token: string | undefined) {
  return useQuery<StaffW4InviteContext>({
    queryKey: qk.taxiqStaffW4Invite(token),
    queryFn: () => taxiqStaffW4InviteRepository.getContext(token as string),
    enabled: !!token,
    retry: false,
  })
}

export function useSubmitStaffW4ViaInvite() {
  return useMutation<void, Error, SubmitStaffW4ViaInviteParams>({
    mutationFn: (params) => taxiqStaffW4InviteRepository.submit(params),
  })
}
