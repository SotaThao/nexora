import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { staffPaymentMethodsRepository } from '../repositories/staffPaymentMethods'
import { useSessionRole } from '../../auth/useSessionRole'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { isApiError } from '../../types/domain'
import type { PaymentMethodDto } from '../../types/domain'
import type { UpdatePaymentMethodVars } from '../../types/hooks'
import { resolvePaymentMethodImageUrl } from '../../utils/resolvePaymentMethodImageUrl'

export function useStaffPaymentMethods({ enabled: callerEnabled = true } = {}) {
  const { isStaff } = useSessionRole()
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
    enabled: isStaff && callerEnabled,
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
    mutationFn: async ({ id, accountInfo, imageUrl, imageFile }) => {
      const resolvedImageUrl = await resolvePaymentMethodImageUrl({ imageFile, imageUrl })
      return staffPaymentMethodsRepository.update(id, {
        accountInfo,
        imageUrl: resolvedImageUrl,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staffPaymentMethods() })
      queryClient.invalidateQueries({ queryKey: qk.staffPaymentQr() })
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

  return useMutation<
    PaymentMethodDto,
    Error,
    string | { id: string; silentSuccessToast?: boolean }
  >({
    mutationFn: (vars) =>
      staffPaymentMethodsRepository.toggle(typeof vars === 'string' ? vars : vars.id),
    onSuccess: (method, vars) => {
      queryClient.invalidateQueries({ queryKey: qk.staffPaymentMethods() })
      queryClient.invalidateQueries({ queryKey: qk.staffPaymentQr() })
      const silentSuccessToast = typeof vars === 'string' ? false : Boolean(vars.silentSuccessToast)
      if (silentSuccessToast) return
      showToast(
        t(method.isActive ? 'payment_methods.toggle_enabled' : 'payment_methods.toggle_disabled'),
        'success',
      )
    },
    onError: (err) => {
      showToast(err.message || t('payment_methods.toggle_failed'), 'error')
    },
  })
}
