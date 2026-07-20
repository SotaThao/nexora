/**
 * TanStack Query hooks for POS Merchant Ops: Turn Board Assign & Break (US-13).
 * Usable by both Owner and Staff sessions (gated server-side via
 * IPosOperationsAccessService) — see usePosAccess for the FE show/hide check.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posTurnBoardRepository from '../repositories/posTurnBoard'
import type { TurnBoardStationApiDto } from '../../types/repositories'

export function useTurnBoard(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<TurnBoardStationApiDto[]>({
    queryKey: qk.merchantPosTurnBoard(businessId),
    queryFn: () => posTurnBoardRepository.getTurnBoard(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
    // Station status should stay fresh for the front desk without a manual refresh.
    refetchInterval: 15000,
  })
}

export function useSetStaffBreakStatus(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { posStaffProfileId: string; isBreak: boolean }>({
    mutationFn: ({ posStaffProfileId, isBreak }) =>
      posTurnBoardRepository.setStaffBreakStatus(businessId as string, posStaffProfileId, isBreak),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
    },
  })
}
