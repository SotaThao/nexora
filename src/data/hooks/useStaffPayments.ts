import { keepPreviousData, useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import staffPaymentsRepository from '../repositories/staffPayments'
import type { StaffPaymentsListQuery } from '../repositories/staffPayments'
import { useSessionRole } from '../../auth/useSessionRole'
import type {
  StaffPaymentQr,
  StaffPaymentRecord,
  StaffPaymentsListPage,
} from '../../types/domain'
import { PaymentStatus } from '../../types/domain'

function useIsStaff(enabled = true) {
  const { isStaff } = useSessionRole()
  return isStaff && enabled
}

export function useStaffPaymentQr({ enabled = true } = {}) {
  const canFetch = useIsStaff(enabled)

  return useQuery<StaffPaymentQr>({
    queryKey: qk.staffPaymentQr(),
    queryFn: () => staffPaymentsRepository.getPaymentQr(),
    enabled: canFetch,
    retry: false,
  })
}

export function useStaffPaymentsList(
  query: StaffPaymentsListQuery,
  {
    enabled = true,
    refetchInterval = false as
      | number
      | false
      | ((query: Query<StaffPaymentsListPage>) => number | false),
  } = {},
) {
  const canFetch = useIsStaff(enabled)

  return useQuery<StaffPaymentsListPage>({
    queryKey: qk.staffPaymentsList(query),
    queryFn: () => staffPaymentsRepository.listPaginated(query),
    enabled: canFetch,
    placeholderData: keepPreviousData,
    retry: false,
    refetchInterval,
    refetchIntervalInBackground: false,
  })
}

export function useStaffPaymentDetail(paymentId?: string | null, { enabled = true } = {}) {
  const canFetch = useIsStaff(enabled && Boolean(paymentId))

  return useQuery<StaffPaymentRecord>({
    queryKey: qk.staffPaymentDetail(paymentId ?? ''),
    queryFn: () => staffPaymentsRepository.getById(paymentId!),
    enabled: canFetch,
    retry: false,
  })
}

export function useAcknowledgeStaffPayment() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (paymentId) => staffPaymentsRepository.acknowledge(paymentId),
    onSuccess: (_data, paymentId) => {
      queryClient.setQueriesData<StaffPaymentsListPage>(
        { queryKey: ['staffPayments', 'list'] },
        (old) => {
          if (!old?.items?.length) return old
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === paymentId
                ? {
                    ...item,
                    status: PaymentStatus.Completed,
                    staffConfirmedAt: item.staffConfirmedAt ?? new Date().toISOString(),
                  }
                : item,
            ),
          }
        },
      )
      queryClient.setQueryData<StaffPaymentRecord>(
        qk.staffPaymentDetail(paymentId),
        (old) =>
          old
            ? {
                ...old,
                status: PaymentStatus.Completed,
                staffConfirmedAt: old.staffConfirmedAt ?? new Date().toISOString(),
              }
            : old,
      )
      queryClient.invalidateQueries({ queryKey: ['staffPayments'] })
      queryClient.invalidateQueries({ queryKey: qk.staffPaymentDetail(paymentId) })
    },
  })
}
