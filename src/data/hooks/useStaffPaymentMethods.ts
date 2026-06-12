import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { staffPaymentMethodsRepository } from '../repositories/staffPaymentMethods'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'

/**
 * @typedef {object} StaffPaymentMethodDto
 * @property {string} id
 * @property {string} type
 * @property {string|null} accountInfo
 * @property {string|null} imageUrl
 * @property {boolean} isActive
 * @property {boolean} isConfigured
 */

/**
 * Hook to get the authenticated staff member's own payment methods.
 * @returns {import('@tanstack/react-query').UseQueryResult<StaffPaymentMethodDto[], Error>}
 */
export function useStaffPaymentMethods() {
  return useQuery({
    queryKey: qk.staffPaymentMethods(),
    queryFn: async () => {
      try {
        return await staffPaymentMethodsRepository.getAll()
      } catch (err) {
        if ((err as any)?.status === 404) return []
        throw err
      }
    },
    retry: (failureCount, error) => {
      if ((error as any)?.status === 404) return false
      return failureCount < 3
    }
  })
}

/**
 * Hook to update a staff member's payment method.
 * @returns {import('@tanstack/react-query').UseMutationResult<StaffPaymentMethodDto, Error, { id: string, accountInfo?: string|null, imageUrl?: string|null }>}
 */
export function useUpdateStaffPaymentMethod() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, accountInfo, imageUrl }: LooseObject) =>
      staffPaymentMethodsRepository.update(id, { accountInfo, imageUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staffPaymentMethods() })
      showToast(t('payment_methods.update_success'), 'success')
    },
    onError: (err: any) => {
      showToast(err.message || t('payment_methods.update_failed'), 'error')
    }
  })
}

/**
 * Hook to toggle a staff member's payment method active status.
 * @returns {import('@tanstack/react-query').UseMutationResult<StaffPaymentMethodDto, Error, string>}
 */
export function useToggleStaffPaymentMethod() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id) => staffPaymentMethodsRepository.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.staffPaymentMethods() })
    },
    onError: (err: any) => {
      showToast(err.message || t('payment_methods.toggle_failed'), 'error')
    }
  })
}
