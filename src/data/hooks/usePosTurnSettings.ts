/**
 * TanStack Query hooks for POS Weighted Turn Settings — the salon-wide rules that convert the
 * value of a service into turns. Mirrors usePosOrderSettings.ts.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posTurnSettingsRepository from '../repositories/posTurnSettings'
import type { PosTurnSettingsApiDto, PosTurnSettingsUpdateApiDto } from '../../types/repositories'

export function useTurnSettings(businessId?: string, options?: { enabled?: boolean }) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<PosTurnSettingsApiDto>({
    queryKey: qk.merchantPosTurnSettings(businessId),
    queryFn: () => posTurnSettingsRepository.getTurnSettings(businessId as string),
    enabled: isAuthenticated && Boolean(businessId) && (options?.enabled ?? true),
    retry: false,
  })
}

export function useUpdateTurnSettings(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, PosTurnSettingsUpdateApiDto>({
    mutationFn: (dto) => posTurnSettingsRepository.updateTurnSettings(businessId as string, dto),
    onSuccess: () => {
      // New rules re-count every visit still open, so anything showing a turn count is stale the
      // moment this succeeds. The roster key is invalidated without its optional dayKey on
      // purpose — that shorter key is a real prefix of the one on screen, so it still matches.
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnSettings(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTimeClockRoster(businessId) })
    },
  })
}
