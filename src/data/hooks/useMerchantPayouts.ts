import { useContext } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantPayoutsRepository from '../repositories/payouts'
import type {
  CreateMerchantPayoutPayload,
  DebtHistoryQuery,
  MerchantPayoutsListQuery,
  UpdateMerchantPayoutPayload,
} from '../repositories/payouts'
import { AuthContext } from '../../auth/AuthContext'
import type {
  MerchantPayoutStats,
  MerchantPayoutStatsByStaffPage,
  PayoutDebtHistoryPage,
  PayoutRecord,
  PayoutsListPage,
  UnpaidTipDebtsPage,
} from '../../types/domain'

function useIsOwner(enabled = true) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return isOwner && enabled
}

export function useMerchantPayoutStats({ enabled = true } = {}) {
  const canFetch = useIsOwner(enabled)

  return useQuery<MerchantPayoutStats>({
    queryKey: qk.merchantPayoutStats(),
    queryFn: () => merchantPayoutsRepository.getStats(),
    enabled: canFetch,
    retry: false,
  })
}

export function useMerchantPayoutsList(query: MerchantPayoutsListQuery, { enabled = true } = {}) {
  const canFetch = useIsOwner(enabled)

  return useQuery<PayoutsListPage>({
    queryKey: qk.merchantPayoutsList(query),
    queryFn: () => merchantPayoutsRepository.listPaginated(query),
    enabled: canFetch,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useMerchantPayoutDetail(payoutId?: string | null, { enabled = true } = {}) {
  const canFetch = useIsOwner(enabled && Boolean(payoutId))

  return useQuery<PayoutRecord>({
    queryKey: qk.merchantPayoutDetail(payoutId ?? ''),
    queryFn: () => merchantPayoutsRepository.getById(payoutId!),
    enabled: canFetch,
    retry: false,
  })
}

export function useMerchantUnpaidTips({ enabled = true } = {}) {
  const canFetch = useIsOwner(enabled)

  return useQuery<UnpaidTipDebtsPage>({
    queryKey: qk.merchantUnpaidTips(),
    queryFn: () => merchantPayoutsRepository.getUnpaidTips(),
    enabled: canFetch,
    retry: false,
  })
}

export function useMerchantDebtHistory(query: DebtHistoryQuery = {}, { enabled = true } = {}) {
  const canFetch = useIsOwner(enabled)

  return useQuery<PayoutDebtHistoryPage>({
    queryKey: qk.merchantDebtHistory(query),
    queryFn: () => merchantPayoutsRepository.getDebtHistory(query),
    enabled: canFetch,
    retry: false,
  })
}

export function useMerchantPayoutStatsByStaff({ enabled = true } = {}) {
  const canFetch = useIsOwner(enabled)

  return useQuery<MerchantPayoutStatsByStaffPage>({
    queryKey: qk.merchantPayoutStatsByStaff(),
    queryFn: () => merchantPayoutsRepository.getStatsByStaff(),
    enabled: canFetch,
    retry: false,
  })
}

/** Query keys to invalidate after merchant payout mutations. */
export const merchantPayoutInvalidationKeys = {
  all: ['merchantPayouts'] as const,
  list: ['merchantPayouts', 'list'] as const,
  stats: qk.merchantPayoutStats(),
  unpaidTips: qk.merchantUnpaidTips(),
  debtHistory: ['merchantPayouts', 'debtHistory'] as const,
  statsByStaff: qk.merchantPayoutStatsByStaff(),
}

function invalidateMerchantPayoutCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: merchantPayoutInvalidationKeys.all })
}

function invalidateMerchantPayoutListCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: merchantPayoutInvalidationKeys.list })
  queryClient.invalidateQueries({ queryKey: merchantPayoutInvalidationKeys.stats })
  queryClient.invalidateQueries({ queryKey: merchantPayoutInvalidationKeys.unpaidTips })
  queryClient.invalidateQueries({ queryKey: merchantPayoutInvalidationKeys.debtHistory })
  queryClient.invalidateQueries({ queryKey: merchantPayoutInvalidationKeys.statsByStaff })
}

export function useCreateMerchantPayout() {
  const queryClient = useQueryClient()
  return useMutation<{ id: string }, Error, CreateMerchantPayoutPayload>({
    mutationFn: (payload) => merchantPayoutsRepository.create(payload),
    onSuccess: () => invalidateMerchantPayoutCaches(queryClient),
  })
}

export function useUpdateMerchantPayout() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { payoutId: string; payload: UpdateMerchantPayoutPayload }>({
    mutationFn: ({ payoutId, payload }) => merchantPayoutsRepository.update(payoutId, payload),
    onSuccess: (_data, { payoutId }) => {
      invalidateMerchantPayoutCaches(queryClient)
      queryClient.invalidateQueries({ queryKey: qk.merchantPayoutDetail(payoutId) })
    },
  })
}

export function useCancelMerchantPayout() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (payoutId) => merchantPayoutsRepository.cancel(payoutId),
    onSuccess: (_data, payoutId) => {
      invalidateMerchantPayoutCaches(queryClient)
      queryClient.invalidateQueries({ queryKey: qk.merchantPayoutDetail(payoutId) })
    },
  })
}

export function useDeleteMerchantPayout() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (payoutId) => merchantPayoutsRepository.delete(payoutId),
    onSuccess: (_data, payoutId) => {
      queryClient.removeQueries({ queryKey: qk.merchantPayoutDetail(payoutId) })
      invalidateMerchantPayoutListCaches(queryClient)
    },
  })
}
