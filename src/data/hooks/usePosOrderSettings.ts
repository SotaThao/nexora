/**
 * TanStack Query hooks for POS Order Settings — the salon-wide service-line rules
 * (technician acceptance, mismatch warnings). Mirrors usePosBookingSettings.ts.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posOrderSettingsRepository from '../repositories/posOrderSettings'
import type { PosOrderSettingsApiDto } from '../../types/repositories'

export function useOrderSettings(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<PosOrderSettingsApiDto>({
    queryKey: qk.merchantPosOrderSettings(businessId),
    queryFn: () => posOrderSettingsRepository.getOrderSettings(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
  })
}

export function useUpdateOrderSettings(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, PosOrderSettingsApiDto>({
    mutationFn: (dto) => posOrderSettingsRepository.updateOrderSettings(businessId as string, dto),
    onSuccess: () => {
      // Turning acceptance off clears every line still waiting for one, so the boards showing
      // those lines are stale the moment this succeeds.
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderSettings(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
    },
  })
}
