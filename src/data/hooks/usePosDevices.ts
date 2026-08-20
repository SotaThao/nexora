/**
 * TanStack Query hooks for POS > Check-In Devices.
 *
 * Two clocks drive the pairing QR, and they answer different questions:
 *   - the code expires on its own schedule (a long one — see PosSelfCheckInOptions), so the QR
 *     query refetches when its own `expiresAt` passes;
 *   - a code also dies the moment a tablet consumes it, which no timer can predict, so a second
 *     query asks the server every 15s whether that has happened and pulls a fresh code when it has.
 *
 * The device list does not poll: it only changes when someone pairs, renames, or revokes, and every
 * one of those paths invalidates it here.
 */
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posDevicesRepository, { type PosDeviceStatusFilter } from '../repositories/posDevices'
import type { PosDeviceListItemApiDto, PosDevicePairingQrApiDto } from '../../types/repositories'

// Fallback only — used until the first token lands, or if one arrives without an expiry.
const QR_FALLBACK_REFETCH_MS = 5000

// Small cushion so the refetch fires after the boundary, not a millisecond before it.
const QR_REFETCH_BUFFER_MS = 300

// How often the dashboard asks whether the code on screen has been scanned. Short enough that the
// next tablet is not left staring at a dead code, cheap enough to run for as long as the screen is
// open: the answer is one boolean, no image.
const QR_USED_POLL_MS = 15000

export function usePosDevicePairingQr(businessId?: string, enabled = true) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<PosDevicePairingQrApiDto | null>({
    queryKey: qk.merchantPosDevicePairingQr(businessId),
    queryFn: () => posDevicesRepository.getPairingQr(businessId as string),
    enabled: enabled && isAuthenticated && Boolean(businessId),
    retry: false,
    // Driven by the token's own expiry rather than a fixed 29s tick.
    //
    // The server anchors windows to absolute time (unixSeconds / 30), so a fixed interval keeps
    // whatever phase the first fetch happened to land on: open the screen 29s into a window and
    // every later token also arrives with ~1s left, leaving the countdown parked at "0s" for
    // minutes even though the code behind it is rotating correctly.
    refetchInterval: (query) => {
      const expiresAt = query.state.data?.expiresAt
      if (!expiresAt) return QR_FALLBACK_REFETCH_MS
      const remainingMs = new Date(expiresAt).getTime() - Date.now()
      return Math.max(1000, remainingMs + QR_REFETCH_BUFFER_MS)
    },
  })
}

/**
 * Watches the displayed pairing code and swaps it out once a tablet has used it.
 *
 * `enabled` is the off switch the caller uses when the QR is no longer on screen. Unmounting is
 * already enough — TanStack drops the interval with the last observer — but a panel that stays
 * mounted while hidden (collapsed, behind a tab) has no way to say so otherwise, and this poll must
 * not outlive what it is watching.
 */
export function usePosDevicePairingQrUsed(businessId?: string, token?: string, enabled = true) {
  const { isAuthenticated } = useSessionRole()
  const queryClient = useQueryClient()

  const query = useQuery<boolean>({
    queryKey: qk.merchantPosDevicePairingQrStatus(businessId, token),
    queryFn: () => posDevicesRepository.getPairingQrStatus(businessId as string, token as string),
    enabled: enabled && isAuthenticated && Boolean(businessId) && Boolean(token),
    retry: false,
    // Stops on its own once the answer is yes — it can never go back to no, so there is nothing
    // left to ask until a new token replaces this one under a different query key.
    refetchInterval: (q) => (q.state.data === true ? false : QR_USED_POLL_MS),
    refetchIntervalInBackground: false,
    // Never reuse one token's answer for another: the key changes with the token, and a stale
    // "used" from a previous code would blank the screen for no reason.
    gcTime: 0,
    staleTime: 0,
  })

  const used = query.data === true
  useEffect(() => {
    if (!used) return
    queryClient.invalidateQueries({ queryKey: qk.merchantPosDevicePairingQr(businessId) })
  }, [used, businessId, queryClient])

  return query
}

export function usePosDevices(businessId?: string, status: PosDeviceStatusFilter = 'All') {
  const { isAuthenticated } = useSessionRole()
  return useQuery<PosDeviceListItemApiDto[]>({
    queryKey: qk.merchantPosDevices(businessId, status),
    queryFn: () => posDevicesRepository.getDevices(businessId as string, status),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
    // Keeps the current table on screen while switching filters instead of flashing skeletons.
    placeholderData: (previous) => previous,
  })
}

function useDeviceListInvalidation(businessId?: string) {
  const queryClient = useQueryClient()
  // Keyed without the status filter so it stays a prefix of whichever filter is on screen.
  return () => queryClient.invalidateQueries({ queryKey: qk.merchantPosDevices(businessId) })
}

export function useUpdatePosDevice(businessId?: string) {
  const invalidate = useDeviceListInvalidation(businessId)
  return useMutation<void, Error, { deviceId: string; name?: string; pin?: string }>({
    mutationFn: ({ deviceId, name, pin }) =>
      posDevicesRepository.updateDevice(businessId as string, deviceId, { name, pin }),
    onSuccess: invalidate,
  })
}

export function useRevokePosDevice(businessId?: string) {
  const invalidate = useDeviceListInvalidation(businessId)
  return useMutation<void, Error, string>({
    mutationFn: (deviceId) => posDevicesRepository.revokeDevice(businessId as string, deviceId),
    onSuccess: invalidate,
  })
}
