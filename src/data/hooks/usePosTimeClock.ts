/**
 * TanStack Query hooks for the POS Front Desk Time Clock tab.
 *
 * Polling rather than realtime: the QR rotates on its own 30s cadence and the roster refreshes
 * every 15s, which is close enough for a clock board and avoids standing up a websocket hub the
 * app doesn't otherwise have. Mutations invalidate the roster/log immediately so a front-desk
 * action never waits for the next poll.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posTimeClockRepository from '../repositories/posTimeClock'
import type {
  BeepStaffResultApiDto,
  ClockQrTokenApiDto,
  ClockScanPreviewApiDto,
  ScanClockQrResultApiDto,
  TimeClockLogEntryApiDto,
  TimeClockRosterApiDto,
} from '../../types/repositories'

const ROSTER_REFETCH_MS = 15000
// One second under the 30s token window so the displayed code is replaced before it stops working.
const QR_REFETCH_MS = 29000

export function useClockQrToken(businessId?: string, enabled = true) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<ClockQrTokenApiDto | null>({
    queryKey: qk.merchantPosTimeClockQr(businessId),
    queryFn: () => posTimeClockRepository.getQrToken(businessId as string),
    enabled: enabled && isAuthenticated && Boolean(businessId),
    retry: false,
    refetchInterval: QR_REFETCH_MS,
  })
}

export function useTimeClockRoster(
  businessId?: string,
  window?: { fromUtc: string; toUtc: string; dayKey: string },
  options: { enabled?: boolean; refetchInterval?: number | false } = {},
) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<TimeClockRosterApiDto>({
    queryKey: qk.merchantPosTimeClockRoster(businessId, window?.dayKey),
    queryFn: () => posTimeClockRepository.getRoster(businessId as string, window!.fromUtc, window!.toUtc),
    enabled: (options.enabled ?? true) && isAuthenticated && Boolean(businessId) && Boolean(window),
    retry: false,
    refetchInterval: options.refetchInterval ?? ROSTER_REFETCH_MS,
    // Keeps the previous board on screen while a poll is in flight instead of flashing skeletons.
    placeholderData: (previous) => previous,
  })
}

export function useTimeClockLog(businessId?: string, window?: { fromUtc: string; toUtc: string; dayKey: string }) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<TimeClockLogEntryApiDto[]>({
    queryKey: qk.merchantPosTimeClockLog(businessId, window?.dayKey),
    queryFn: () => posTimeClockRepository.getLog(businessId as string, window!.fromUtc, window!.toUtc),
    enabled: isAuthenticated && Boolean(businessId) && Boolean(window),
    retry: false,
    refetchInterval: ROSTER_REFETCH_MS,
    placeholderData: (previous) => previous,
  })
}

function useTimeClockInvalidation(businessId?: string) {
  const queryClient = useQueryClient()
  return () => {
    // Deliberately keyed without dayKey: this is a prefix of whichever day is on screen, so the
    // board refreshes no matter which local day the caller is looking at.
    queryClient.invalidateQueries({ queryKey: qk.merchantPosTimeClockRoster(businessId) })
    queryClient.invalidateQueries({ queryKey: qk.merchantPosTimeClockLog(businessId) })
    queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
  }
}

export function useClockInStaff(businessId?: string) {
  const invalidate = useTimeClockInvalidation(businessId)
  return useMutation<string, unknown, string>({
    mutationFn: (businessStaffLinkId: string) => posTimeClockRepository.clockIn(businessStaffLinkId),
    onSuccess: invalidate,
  })
}

export function useClockOutStaff(businessId?: string) {
  const invalidate = useTimeClockInvalidation(businessId)
  return useMutation<void, unknown, string>({
    mutationFn: (businessStaffLinkId: string) => posTimeClockRepository.clockOut(businessStaffLinkId),
    onSuccess: invalidate,
  })
}

export function useBeepStaff(businessId?: string) {
  const invalidate = useTimeClockInvalidation(businessId)
  return useMutation<BeepStaffResultApiDto, unknown, string>({
    mutationFn: (posStaffProfileId: string) =>
      posTimeClockRepository.beepStaff(businessId as string, posStaffProfileId),
    onSuccess: invalidate,
  })
}

// Tech-side scan screen — no polling: the token is already fixed by the link they opened.
export function useClockScanPreview(businessId?: string, token?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<ClockScanPreviewApiDto>({
    queryKey: qk.staffClockScanPreview(businessId, token),
    queryFn: () => posTimeClockRepository.getScanPreview(businessId as string, token as string),
    enabled: isAuthenticated && Boolean(businessId) && Boolean(token),
    retry: false,
  })
}

export function useScanClockQr() {
  return useMutation<ScanClockQrResultApiDto, unknown, { businessId: string; token: string }>({
    mutationFn: ({ businessId, token }) => posTimeClockRepository.scan(businessId, token),
  })
}
