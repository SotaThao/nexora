/**
 * useStaffAccount — TanStack Query hooks for the staff-account domain.
 *
 * Hooks:
 *   useStaffAccount(staffId) → useQuery for a single staff account blob.
 *                              Pass undefined / omit to query the "self" slot.
 *   useSaveStaffAccount()    → useMutation to merge data into a staff account
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import staffAccountsRepository from '../repositories/staffAccounts'

export function useStaffAccount(staffId?: string | null, options: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: qk.staffAccount(staffId),
    queryFn: () => staffAccountsRepository.get(staffId ?? 'self'),
    ...options
  })
}

export function useSaveStaffAccount() {
  const queryClient = useQueryClient()
  return useMutation<unknown, Error, { staffId: string | null; data: LooseObject }>({
    mutationFn: ({ staffId, data }) => staffAccountsRepository.save(staffId, data),
    onSuccess: (_result, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: qk.staffAccount(staffId) })
    },
  })
}
