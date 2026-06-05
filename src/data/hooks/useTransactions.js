/**
 * useTransactions — TanStack Query hooks for the transactions domain.
 *
 * Hooks:
 *   useTransactions()       → useQuery list of all transactions
 *   useAddTransaction()     → useMutation to append a transaction
 *   useUpdateTransaction()  → useMutation to patch a transaction by id
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import transactionsRepository from '../repositories/transactions'

export function useTransactions() {
  return useQuery({
    queryKey: qk.transactions(),
    queryFn: () => transactionsRepository.list(),
  })
}

export function useAddTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tx) => transactionsRepository.add(tx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.transactions() })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    /**
     * @param {{ id: string, patch: object }} args
     */
    mutationFn: ({ id, patch }) => transactionsRepository.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.transactions() })
    },
  })
}
