/**
 * TanStack Query hooks over the device-local beep quick messages.
 *
 * Query, rather than a plain useState inside the modal, for the same reason as
 * `usePosPrinterSettings`: the beep modal is mounted twice (the Time Clock roster and the Turn
 * Board station cards each render their own), so a message saved from one has to be on the chip
 * row of the other without a reload. That is what the cache plus invalidation gives us, and it is
 * the house pattern.
 *
 * No `useSessionRole` gate and no `businessId`: these describe the front desk iPad, not the salon.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posBeepSuggestionsRepository from '../repositories/posBeepSuggestions'

/** Reads never hit the network, so nothing here can go stale behind our back. */
const DEVICE_QUERY_OPTIONS = {
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  retry: false,
} as const

export function usePosBeepSuggestions() {
  return useQuery<string[]>({
    queryKey: qk.posBeepSuggestions(),
    queryFn: () => posBeepSuggestionsRepository.getSuggestions(),
    // Synchronous storage read: seeding initialData means the chips are on screen on the modal's
    // first paint rather than one render later, so the row does not jump as it opens.
    initialData: () => posBeepSuggestionsRepository.getSuggestions(),
    ...DEVICE_QUERY_OPTIONS,
  })
}

export function useSavePosBeepSuggestion() {
  const queryClient = useQueryClient()
  return useMutation<string[], Error, string>({
    mutationFn: async (text) => posBeepSuggestionsRepository.addSuggestion(text),
    onSuccess: (saved) => {
      // Seed with what was actually written (post-trim, post-dedupe, post-cap), then invalidate so
      // the other mounted modal refetches instead of keeping a list the repository adjusted.
      queryClient.setQueryData(qk.posBeepSuggestions(), saved)
      queryClient.invalidateQueries({ queryKey: qk.posBeepSuggestions() })
    },
  })
}

export function useRemovePosBeepSuggestion() {
  const queryClient = useQueryClient()
  return useMutation<string[], Error, string>({
    mutationFn: async (text) => posBeepSuggestionsRepository.removeSuggestion(text),
    onSuccess: (saved) => {
      queryClient.setQueryData(qk.posBeepSuggestions(), saved)
      queryClient.invalidateQueries({ queryKey: qk.posBeepSuggestions() })
    },
  })
}
