/**
 * useStaffAccount — TanStack Query hooks for the staff-account domain.
 */
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import staffAccountsRepository from '../repositories/staffAccounts'
import type { StaffAccountView } from '../../types/domain'
import type { SaveStaffAccountVars } from '../../types/hooks'

export function useStaffAccount(
  staffId?: string | null,
  options: Omit<UseQueryOptions<StaffAccountView | null>, 'queryKey' | 'queryFn'> = {},
) {
  return useQuery<StaffAccountView | null>({
    queryKey: qk.staffAccount(staffId),
    queryFn: () => staffAccountsRepository.get(staffId ?? 'self'),
    ...options,
  })
}

export function useSaveStaffAccount() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, SaveStaffAccountVars>({
    mutationFn: ({ staffId, data }) => staffAccountsRepository.save(staffId, data),
    onSuccess: (_result, { staffId }) => {
      queryClient.invalidateQueries({ queryKey: qk.staffAccount(staffId) })
    },
  })
}
