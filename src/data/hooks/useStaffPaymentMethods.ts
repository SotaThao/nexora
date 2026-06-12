import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { staffPaymentMethodsRepository } from '../repositories/staffPaymentMethods'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { isApiError } from '../../types/domain'
import type { PaymentMethodDto } from '../../types/domain'
import type { UpdatePaymentMethodVars } from '../../types/hooks'

export function useStaffPaymentMethods() {
  return useQuery<PaymentMethodDto[]>({
    queryKey: qk.staffPaymentMethods(),
    queryFn: async () => {
      try {
        return await staffPaymentMethodsRepository.getAll()
      } catch (err: unknown) {
        if (isApiError(err) && err.status === 404) return []
        throw err
      }
    },
    retry: (failureCount, error) => {
      if (isApiError(error) && error.status === 404) return false
      return failureCount < 3
    },
  })
}

export function useUpdateStaffPaymentMethod() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation<PaymentMethodDto, Error, UpdatePaymentMethodVars>({
    mutationFn: ({ id, accountInfo, imageUrl }) =>
      staffPaymentMethodsRepository.update(id, { accountInfo, imageUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staffPaymentMethods() })
      showToast(t('payment_methods.update_success'), 'success')
    },
    onError: (err) => {
      showToast(err.message || t('payment_methods.update_failed'), 'error')
    },
  })
}

export function useToggleStaffPaymentMethod() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation<PaymentMethodDto, Error, string>({
    mutationFn: (id) => staffPaymentMethodsRepository.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staffPaymentMethods() })
    },
    onError: (err) => {
      showToast(err.message || t('payment_methods.toggle_failed'), 'error')
    },
  })
}
