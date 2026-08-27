/**
 * TanStack Query hooks for the salon side of the two-way beep.
 *
 * The feed is polled on its own 15s interval rather than being folded into the roster, for two
 * reasons: the roster shape (one row per staff member) cannot express several calls to the same
 * tech, and the Turn Board tab fetches the roster with `refetchInterval: false` — so without a
 * separate polled query a station card would never notice that the tech replied.
 *
 * Nudging deliberately reuses posTimeClockRepository.beepStaff(): the server treats a beep aimed at
 * a tech who already has an open call as a nudge on that same row, so there is one endpoint and one
 * rate limit rather than two code paths that can disagree.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posBeepRepository from '../repositories/posBeep'
import posTimeClockRepository from '../repositories/posTimeClock'
import type { BeepStaffResultApiDto, PosBeepApiDto } from '../../types/repositories'

const BEEP_FEED_REFETCH_MS = 15000

export function useMerchantBeepFeed(
  businessId?: string,
  window?: { fromUtc: string; toUtc: string; dayKey: string },
  options: { enabled?: boolean } = {},
) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<PosBeepApiDto[]>({
    queryKey: qk.merchantPosBeepFeed(businessId, window?.dayKey),
    queryFn: () => posBeepRepository.getBeepFeed(businessId as string, window!.fromUtc, window!.toUtc),
    enabled: (options.enabled ?? true) && isAuthenticated && Boolean(businessId) && Boolean(window),
    retry: false,
    refetchInterval: BEEP_FEED_REFETCH_MS,
    // Keeps the previous statuses on screen while a poll is in flight instead of blanking the cell.
    placeholderData: (previous) => previous,
  })
}

function useBeepFeedInvalidation(businessId?: string) {
  const queryClient = useQueryClient()
  return () => {
    // Keyed without dayKey on purpose: a prefix of whichever local day is on screen.
    queryClient.invalidateQueries({ queryKey: qk.merchantPosBeepFeed(businessId) })
    // The roster's own lastBeepAt column and the Turn Board still read their own queries.
    queryClient.invalidateQueries({ queryKey: qk.merchantPosTimeClockRoster(businessId) })
    queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
  }
}

export function useNudgeBeep(businessId?: string) {
  const invalidate = useBeepFeedInvalidation(businessId)
  return useMutation<BeepStaffResultApiDto, unknown, { posStaffProfileId: string }>({
    // No message: the original beep already said what was needed, and a nudge should be one tap.
    mutationFn: ({ posStaffProfileId }) =>
      posTimeClockRepository.beepStaff(businessId as string, posStaffProfileId),
    onSuccess: invalidate,
  })
}

export function useResolveBeep(businessId?: string) {
  const invalidate = useBeepFeedInvalidation(businessId)
  return useMutation<void, unknown, { beepId: string }>({
    mutationFn: ({ beepId }) => posBeepRepository.resolveBeep(businessId as string, beepId),
    onSuccess: invalidate,
  })
}
