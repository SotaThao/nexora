/**
 * useTransactions — TanStack Query hooks for the transactions domain.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import transactionsRepository from '../repositories/transactions'
import type { TransactionRecord } from '../../types/domain'
import type { UpdateTransactionVars } from '../../types/hooks'

export function useTransactions() {
  return useQuery<TransactionRecord[]>({
    queryKey: qk.transactions(),
    queryFn: () => transactionsRepository.list(),
  })
}

export function useAddTransaction() {
  const queryClient = useQueryClient()
  return useMutation<LooseObject, Error, LooseObject>({
    mutationFn: (tx) => transactionsRepository.add(tx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.transactions() })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation<LooseObject, Error, UpdateTransactionVars>({
    mutationFn: ({ id, patch }) => transactionsRepository.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.transactions() })
    },
  })
}
