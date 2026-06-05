/**
 * useMerchantSetup — TanStack Query hooks for the merchant-setup domain.
 *
 * Hooks:
 *   useMerchantSetup()    → useQuery for the full setup blob
 *   useSaveMerchantSetup() → useMutation to replace the full blob
 *   useStaffList()         → useQuery for just the staffList array
 *   useSaveStaffList()     → useMutation to merge a new staffList
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantsRepository from '../repositories/merchants'

export function useMerchantSetup() {
  return useQuery({
    queryKey: qk.merchantSetup(),
    queryFn: () => merchantsRepository.getSetup(),
  })
}

export function useSaveMerchantSetup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (setup) => merchantsRepository.saveSetup(setup),
    onMutate: (setup) => {
      queryClient.setQueryData(qk.merchantSetup(), setup)
    },
    onSuccess: (_data, setup) => {
      queryClient.setQueryData(qk.merchantSetup(), setup)
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

export function useClearMerchantSetup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => merchantsRepository.clearSetup(),
    onMutate: () => {
      queryClient.setQueryData(qk.merchantSetup(), null)
    },
    onSuccess: () => {
      queryClient.setQueryData(qk.merchantSetup(), null)
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}

export function useStaffList() {
  return useQuery({
    queryKey: qk.merchantSetup(),
    queryFn: () => merchantsRepository.getStaffList(),
    select: (data) => data ?? [],
  })
}

export function useSaveStaffList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (list) => merchantsRepository.saveStaffList(list),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantSetup() })
    },
  })
}
