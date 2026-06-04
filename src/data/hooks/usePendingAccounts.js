/**
 * usePendingAccounts — TanStack Query hooks for the pending-accounts domain.
 *
 * Hooks:
 *   usePendingAccounts()          → useQuery list of all pending accounts
 *   useAddPendingAccount()        → useMutation to append an account
 *   useReplaceAllPendingAccounts() → useMutation to replace the full list
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import pendingAccountsRepository from '../repositories/pendingAccounts'

export function usePendingAccounts() {
  return useQuery({
    queryKey: qk.pendingAccounts(),
    queryFn: () => pendingAccountsRepository.list(),
  })
}

export function useAddPendingAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (account) => pendingAccountsRepository.add(account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.pendingAccounts() })
    },
  })
}

export function useReplaceAllPendingAccounts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (list) => pendingAccountsRepository.replaceAll(list),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.pendingAccounts() })
    },
  })
}
