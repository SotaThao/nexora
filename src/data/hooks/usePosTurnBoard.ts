/**
 * TanStack Query hooks for POS Merchant Ops: Turn Board Assign (US-13).
 * Usable by both Owner and Staff sessions (gated server-side via
 * IPosOperationsAccessService) — see usePosAccess for the FE show/hide check.
 */
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posTurnBoardRepository from '../repositories/posTurnBoard'
import type { TurnBoardStationApiDto } from '../../types/repositories'

export function useTurnBoard(
  businessId?: string,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<TurnBoardStationApiDto[]>({
    queryKey: qk.merchantPosTurnBoard(businessId),
    queryFn: () => posTurnBoardRepository.getTurnBoard(businessId as string),
    enabled: isAuthenticated && Boolean(businessId) && (options?.enabled ?? true),
    retry: false,
    // Station status should stay fresh for the front desk without a manual refresh.
    refetchInterval: options?.refetchInterval ?? 15000,
  })
}
