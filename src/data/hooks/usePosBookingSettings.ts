/**
 * TanStack Query hooks for POS Booking Settings (Ticket 2). Usable by both Owner and
 * Staff sessions (gated server-side via IPosOperationsAccessService, same permission
 * as Orders) — see usePosOrders.ts for the sibling pattern this mirrors.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posBookingSettingsRepository from '../repositories/posBookingSettings'
import type { PosBookingSettingsApiDto } from '../../types/repositories'

export function useBookingSettings(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<PosBookingSettingsApiDto>({
    queryKey: qk.merchantPosBookingSettings(businessId),
    queryFn: () => posBookingSettingsRepository.getBookingSettings(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
  })
}

export function useUpdateBookingSettings(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, PosBookingSettingsApiDto>({
    mutationFn: (dto) => posBookingSettingsRepository.updateBookingSettings(businessId as string, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosBookingSettings(businessId) })
    },
  })
}
