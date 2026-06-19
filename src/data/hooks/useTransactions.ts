/**
 * useTransactions — TanStack Query hooks for the transactions domain.
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import transactionsRepository from '../repositories/transactions'
import type { TransactionsListPage, TransactionsListQuery } from '../repositories/transactions'
import { useSessionRole } from '../../auth/useSessionRole'
import type { TransactionRecord } from '../../types/domain'
import type { UpdateTransactionVars } from '../../types/hooks'

export function useTransactions({ enabled: callerEnabled = true } = {}) {
  const { isOwner } = useSessionRole()
  return useQuery<TransactionRecord[]>({
    queryKey: qk.transactions(),
    queryFn: () => transactionsRepository.list(),
    enabled: isOwner && callerEnabled,
    retry: false,
  })
}

export function useTransactionsPaginated(
  query: TransactionsListQuery,
  { enabled: callerEnabled = true } = {},
) {
  const { isOwner } = useSessionRole()
  return useQuery<TransactionsListPage>({
    queryKey: qk.transactionsPaginated(query),
    queryFn: () => transactionsRepository.listPaginated(query),
    enabled: isOwner && callerEnabled,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useAddTransaction() {
  const queryClient = useQueryClient()
  return useMutation<LooseObject, Error, LooseObject>({
    mutationFn: (tx) => transactionsRepository.add(tx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.transactions() })
      queryClient.invalidateQueries({ queryKey: ['transactions', 'paginated'] })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation<LooseObject, Error, UpdateTransactionVars>({
    mutationFn: ({ id, patch }) => transactionsRepository.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.transactions() })
      queryClient.invalidateQueries({ queryKey: ['transactions', 'paginated'] })
    },
  })
}
