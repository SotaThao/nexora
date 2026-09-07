/**
 * TanStack Query hooks over the device-local printer records (US-047).
 *
 * Query, rather than a plain useState, for one concrete reason: the printer setup page and the
 * checkout screen are different routes, and saving on one has to be visible on the other without a
 * reload. That is exactly what the cache plus invalidation gives us, and it is the house pattern.
 *
 * No `useSessionRole` gate and no `businessId`: these describe the iPad, not the salon, and a
 * paired self-check-in device has no user session to gate on.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posPrinterSettingsRepository from '../repositories/posPrinterSettings'
import type { PosPrinterProfile, PosReceiptSettings } from '../../types/repositories'

/** Reads never hit the network, so nothing here can go stale behind our back. */
const DEVICE_QUERY_OPTIONS = {
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  retry: false,
} as const

export function usePosPrinterProfile() {
  return useQuery<PosPrinterProfile>({
    queryKey: qk.posPrinterProfile(),
    queryFn: () => posPrinterSettingsRepository.getPrinterProfile(),
    ...DEVICE_QUERY_OPTIONS,
  })
}

export function useSavePosPrinterProfile() {
  const queryClient = useQueryClient()
  return useMutation<PosPrinterProfile, Error, Partial<PosPrinterProfile>>({
    mutationFn: async (patch) => posPrinterSettingsRepository.savePrinterProfile(patch),
    onSuccess: (saved) => {
      // Seed the cache with what was actually written (post-clamp), then invalidate so any other
      // mounted reader refetches rather than keeping a value the repository may have adjusted.
      queryClient.setQueryData(qk.posPrinterProfile(), saved)
      queryClient.invalidateQueries({ queryKey: qk.posPrinterProfile() })
    },
  })
}

export function usePosReceiptSettings() {
  return useQuery<PosReceiptSettings>({
    queryKey: qk.posReceiptSettings(),
    queryFn: () => posPrinterSettingsRepository.getReceiptSettings(),
    ...DEVICE_QUERY_OPTIONS,
  })
}

export function useSavePosReceiptSettings() {
  const queryClient = useQueryClient()
  return useMutation<PosReceiptSettings, Error, PosReceiptSettings>({
    mutationFn: async (next) => posPrinterSettingsRepository.saveReceiptSettings(next),
    onSuccess: (saved) => {
      queryClient.setQueryData(qk.posReceiptSettings(), saved)
      queryClient.invalidateQueries({ queryKey: qk.posReceiptSettings() })
    },
  })
}
