/**
 * TanStack Query hooks — Income/Payout Categories (issue #584).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import {
  merchantTransactionCategoriesRepository,
  staffTransactionCategoriesRepository,
} from '../repositories/transactionCategories'
import type { IncomeByCategoryStatsQuery } from '../repositories/transactionCategories'
import { useSessionRole } from '../../auth/useSessionRole'
import type { IncomeByCategoryStats, TransactionCategory } from '../../types/domain'

export function useMerchantCategories({ enabled = true } = {}) {
  const { isOwner } = useSessionRole()

  return useQuery<TransactionCategory[]>({
    queryKey: qk.merchantTransactionCategories(),
    queryFn: () => merchantTransactionCategoriesRepository.list(),
    enabled: isOwner && enabled,
    retry: false,
  })
}

export function useCreateMerchantCategory() {
  const queryClient = useQueryClient()
  return useMutation<{ id: string }, Error, string>({
    mutationFn: (name) => merchantTransactionCategoriesRepository.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantTransactionCategories() })
    },
  })
}

export function useUpdateMerchantCategory() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { categoryId: string; name: string }>({
    mutationFn: ({ categoryId, name }) => merchantTransactionCategoriesRepository.update(categoryId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantTransactionCategories() })
    },
  })
}

export function useDeleteMerchantCategory() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (categoryId) => merchantTransactionCategoriesRepository.remove(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantTransactionCategories() })
      queryClient.invalidateQueries({ queryKey: ['merchantTransactionCategories', 'stats'] })
    },
  })
}

export function useMerchantIncomeByCategoryStats(
  query: IncomeByCategoryStatsQuery,
  { enabled = true } = {},
) {
  const { isOwner } = useSessionRole()

  return useQuery<IncomeByCategoryStats>({
    queryKey: qk.merchantIncomeByCategoryStats(query),
    queryFn: () => merchantTransactionCategoriesRepository.getIncomeStats(query),
    enabled: isOwner && enabled,
    retry: false,
  })
}

export function useStaffCategories({ enabled = true } = {}) {
  const { isStaff } = useSessionRole()

  return useQuery<TransactionCategory[]>({
    queryKey: qk.staffTransactionCategories(),
    queryFn: () => staffTransactionCategoriesRepository.list(),
    enabled: isStaff && enabled,
    retry: false,
  })
}

export function useCreateStaffCategory() {
  const queryClient = useQueryClient()
  return useMutation<{ id: string }, Error, string>({
    mutationFn: (name) => staffTransactionCategoriesRepository.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staffTransactionCategories() })
    },
  })
}

export function useUpdateStaffCategory() {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { categoryId: string; name: string }>({
    mutationFn: ({ categoryId, name }) => staffTransactionCategoriesRepository.update(categoryId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staffTransactionCategories() })
    },
  })
}

export function useDeleteStaffCategory() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (categoryId) => staffTransactionCategoriesRepository.remove(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staffTransactionCategories() })
      queryClient.invalidateQueries({ queryKey: ['staffTransactionCategories', 'stats'] })
    },
  })
}

export function useStaffIncomeByCategoryStats(
  query: IncomeByCategoryStatsQuery,
  { enabled = true } = {},
) {
  const { isStaff } = useSessionRole()

  return useQuery<IncomeByCategoryStats>({
    queryKey: qk.staffIncomeByCategoryStats(query),
    queryFn: () => staffTransactionCategoriesRepository.getIncomeStats(query),
    enabled: isStaff && enabled,
    retry: false,
  })
}
