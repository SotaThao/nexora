/**
 * useTransactions — TanStack Query hooks for the transactions domain.
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import transactionsRepository from '../repositories/transactions'
import type { TransactionsListPage, TransactionsListQuery } from '../repositories/transactions'
import { useSessionRole } from '../../auth/useSessionRole'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import type { MerchantTipsConfirmReceiptResult, TransactionRecord } from '../../types/domain'
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

/**
 * Owner confirms shop-account / multi-staff tips have landed in the shop
 * account (US-025). Mirrors useConfirmStaffTipsReceipt: refreshes the tips list
 * and dashboard aggregates, and surfaces full / partial / full-failure toasts
 * without creating optimistic state.
 */
export function useConfirmMerchantTipsReceipt() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation<MerchantTipsConfirmReceiptResult, Error, string[]>({
    mutationFn: (tipIds) => transactionsRepository.confirmReceipt(tipIds),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: qk.transactions() })
      queryClient.invalidateQueries({ queryKey: ['transactions', 'paginated'] })
      queryClient.invalidateQueries({ queryKey: qk.dashboardOverview() })
      queryClient.invalidateQueries({ queryKey: qk.dashboardTipsChart() })

      if (result.failedIds.length > 0) {
        // Backend rejected every submitted tip — surface a hard error rather
        // than the softer "partial" warning.
        if (result.confirmedCount === 0) {
          showToast(t('merchant_dashboard.tips.confirm_failed'), 'error')
          return
        }

        showToast(
          t('merchant_dashboard.tips.confirm_partial', { count: result.confirmedCount }),
          'warning',
        )
        return
      }

      showToast(t('merchant_dashboard.tips.confirm_success'), 'success')
    },
    onError: (err) => {
      showToast(err.message || t('merchant_dashboard.tips.confirm_failed'), 'error')
    },
  })
}
