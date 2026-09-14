/**
 * TanStack Query hooks for the POS Front Desk Time Clock tab.
 *
 * Polling rather than realtime: the QR is refetched when the current token expires and the roster
 * refreshes every 15s, which is close enough for a clock board and avoids standing up a websocket
 * hub the app doesn't otherwise have. Mutations invalidate the roster/log immediately so a
 * front-desk action never waits for the next poll.
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

// The clock QR is derived from a fixed server-side window (token = HMAC of businessId + window
// index), so a token handed out mid-window arrives with only the rest of that window left to live.
// A fixed poll interval therefore drifts off the boundary and parks the panel on a code that has
// already rotated. Ask for the next token when this one actually expires instead.
const QR_REFETCH_FLOOR_MS = 2000
// Cross the boundary before asking, so the answer is the next token and not the current one again.
const QR_REFETCH_BUFFER_MS = 500

function msUntilTokenExpiry(expiresAt?: string | null): number {
  if (!expiresAt) return QR_REFETCH_FLOOR_MS
  const remainingMs = new Date(expiresAt).getTime() - Date.now() + QR_REFETCH_BUFFER_MS
  return Math.max(QR_REFETCH_FLOOR_MS, remainingMs)
}

export function useClockQrToken(businessId?: string, enabled = true) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<ClockQrTokenApiDto | null>({
    queryKey: qk.merchantPosTimeClockQr(businessId),
    queryFn: () => posTimeClockRepository.getQrToken(businessId as string),
    enabled: enabled && isAuthenticated && Boolean(businessId),
    retry: false,
    refetchInterval: (query) => msUntilTokenExpiry(query.state.data?.expiresAt),
  })
}

export function useTimeClockRoster(
  businessId?: string,
  window?: { fromUtc: string; toUtc: string; dayKey: string },
  options: { enabled?: boolean; refetchInterval?: number | false } = {},
) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<TimeClockRosterApiDto>({
    queryKey: [...qk.merchantPosTimeClockRoster(businessId, window?.dayKey), window?.fromUtc, window?.toUtc],
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
    queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
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
  const queryClient = useQueryClient()
  const invalidate = useTimeClockInvalidation(businessId)
  return useMutation<BeepStaffResultApiDto, unknown, { posStaffProfileId: string; message?: string }>({
    mutationFn: ({ posStaffProfileId, message }) =>
      posTimeClockRepository.beepStaff(businessId as string, posStaffProfileId, message),
    onSuccess: () => {
      invalidate()
      // The cooldown shown on the Beep/Nudge buttons reads canNudge/nextNudgeAllowedAt off the beep
      // feed, not the roster — without this, the just-sent beep's cooldown only appears once the
      // feed's own 15s poll happens to land, so the button looks re-enabled for up to 15s.
      queryClient.invalidateQueries({ queryKey: qk.merchantPosBeepFeed(businessId) })
    },
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
