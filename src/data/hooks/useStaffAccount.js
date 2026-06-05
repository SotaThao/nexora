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

export function useStaffAccount(staffId) {
  return useQuery({
    queryKey: qk.staffAccount(staffId),
    queryFn: () => staffAccountsRepository.get(staffId),
  })
}

export function useSaveStaffAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    /**
     * @param {{ staffId: string, data: object }} args
     */
    mutationFn: ({ staffId, data }) => staffAccountsRepository.save(staffId, data),
    onSuccess: (_result, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: qk.staffAccount(staffId) })
    },
  })
}
