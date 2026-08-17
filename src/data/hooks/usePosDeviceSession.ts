/**
 * Mutations the tablet runs on itself: unlocking Settings, and signing out of the salon.
 *
 * Both are one-shot actions with no cached state behind them, so there is nothing to invalidate —
 * signing out ends the session entirely, and the caller clears the stored token once the server
 * has confirmed.
 */
import { useMutation } from '@tanstack/react-query'
import posDevicePairingRepository from '../repositories/posDevicePairing'

export function useVerifyPosDevicePin() {
  return useMutation<void, Error, string>({
    mutationFn: (pin) => posDevicePairingRepository.verifyPin(pin),
    retry: false,
  })
}

export function useSignOutPosDevice() {
  return useMutation<void, Error, void>({
    mutationFn: () => posDevicePairingRepository.signOut(),
    retry: false,
  })
}
