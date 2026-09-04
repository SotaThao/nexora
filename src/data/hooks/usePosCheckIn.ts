/**
 * TanStack Query hooks for the front desk's half of the shared check-in page.
 *
 * Deliberately mirrors usePosSelfCheckIn one-for-one: the page reads the same shapes whichever
 * surface it is drawn on, so anything asymmetric here would leak back into the component.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posCheckInRepository from '../repositories/posCheckIn'
import { useSessionRole } from '../../auth/useSessionRole'
import type { CheckInTechnicianApiDto, PosCheckInSettingsApiDto } from '../../types/repositories'

export function useCheckInTechnicians(businessId?: string, options?: { enabled?: boolean }) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<CheckInTechnicianApiDto[]>({
    queryKey: qk.merchantPosCheckInTechnicians(businessId),
    queryFn: () => posCheckInRepository.getTechnicians(businessId as string),
    enabled: isAuthenticated && Boolean(businessId) && (options?.enabled ?? true),
    retry: false,
    // Who is clocked in changes through the day, and the desk must not offer someone who went
    // home an hour ago.
    staleTime: 0,
  })
}

export function useCheckInActiveVisit(businessId?: string, phone?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<string | null>({
    queryKey: qk.merchantPosCheckInActiveVisit(businessId, phone),
    queryFn: () => posCheckInRepository.getActiveVisitOrderNumber(businessId as string, phone as string),
    enabled: isAuthenticated && Boolean(businessId) && Boolean(phone),
    retry: false,
    // Never cached beyond the visit it belongs to — the next guest must not inherit an answer
    // resolved for the person before them.
    gcTime: 0,
    staleTime: 0,
  })
}

export function useCheckInSettings(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<PosCheckInSettingsApiDto>({
    queryKey: qk.merchantPosCheckInSettings(businessId),
    queryFn: () => posCheckInRepository.getSettings(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
  })
}

export function useUpdateCheckInSettings(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, PosCheckInSettingsApiDto>({
    mutationFn: (payload) => posCheckInRepository.updateSettings(businessId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosCheckInSettings(businessId) })
    },
  })
}
