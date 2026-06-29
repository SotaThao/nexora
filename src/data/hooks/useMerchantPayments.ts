import { useContext } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantPaymentsRepository from '../repositories/merchantPayments'
import type { MerchantPaymentsListQuery } from '../repositories/merchantPayments'
import { AuthContext } from '../../auth/AuthContext'
import type {
  MerchantPaymentQr,
  MerchantPaymentRecord,
  MerchantPaymentsListPage,
} from '../../types/domain'
import { PaymentStatus } from '../../types/domain'

function useIsOwner(enabled = true) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  return isOwner && enabled
}

export function useMerchantPaymentQr({ enabled = true } = {}) {
  const canFetch = useIsOwner(enabled)

  return useQuery<MerchantPaymentQr>({
    queryKey: qk.merchantPaymentQr(),
    queryFn: () => merchantPaymentsRepository.getPaymentQr(),
    enabled: canFetch,
  })
}

export function useMerchantPaymentsList(
  query: MerchantPaymentsListQuery,
  {
    enabled = true,
    refetchInterval = false as
      | number
      | false
      | ((query: Query<MerchantPaymentsListPage>) => number | false),
  } = {},
) {
  const canFetch = useIsOwner(enabled)

  return useQuery<MerchantPaymentsListPage>({
    queryKey: qk.merchantPaymentsList(query),
    queryFn: () => merchantPaymentsRepository.listPaginated(query),
    enabled: canFetch,
    placeholderData: keepPreviousData,
    retry: false,
    refetchInterval,
    refetchIntervalInBackground: false,
  })
}

export function useMerchantPaymentDetail(paymentId?: string | null, { enabled = true } = {}) {
  const canFetch = useIsOwner(enabled && Boolean(paymentId))

  return useQuery<MerchantPaymentRecord>({
    queryKey: qk.merchantPaymentDetail(paymentId ?? ''),
    queryFn: () => merchantPaymentsRepository.getById(paymentId!),
    enabled: canFetch,
    retry: false,
  })
}

export function useAcknowledgeMerchantPayment() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (paymentId) => merchantPaymentsRepository.acknowledge(paymentId),
    onSuccess: (_data, paymentId) => {
      queryClient.setQueriesData<MerchantPaymentsListPage>(
        { queryKey: ['merchantPayments', 'list'] },
        (old) => {
          if (!old?.items?.length) return old
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === paymentId
                ? {
                    ...item,
                    status: PaymentStatus.Completed,
                    merchantConfirmedAt: item.merchantConfirmedAt ?? new Date().toISOString(),
                  }
                : item,
            ),
          }
        },
      )
      queryClient.setQueryData<MerchantPaymentRecord>(
        qk.merchantPaymentDetail(paymentId),
        (old) =>
          old
            ? {
                ...old,
                status: PaymentStatus.Completed,
                merchantConfirmedAt: old.merchantConfirmedAt ?? new Date().toISOString(),
              }
            : old,
      )
      queryClient.invalidateQueries({ queryKey: ['merchantPayments'] })
      queryClient.invalidateQueries({ queryKey: qk.merchantPaymentDetail(paymentId) })
    },
  })
}
