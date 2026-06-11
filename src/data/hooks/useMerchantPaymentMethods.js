import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { merchantPaymentMethodsRepository } from '../repositories/merchantPaymentMethods'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'

/**
 * @typedef {object} BusinessPaymentMethodDto
 * @property {string} id
 * @property {string} type
 * @property {string|null} accountInfo
 * @property {string|null} imageUrl
 * @property {boolean} isActive
 * @property {boolean} isConfigured
 * @property {string|null} businessKybStatus
 */

/**
 * Hook to get the merchant's business payment methods.
 * @param {object} [options]
 * @param {boolean} [options.enabled] — gate the fetch (e.g. onboarding waits until the business exists)
 * @returns {import('@tanstack/react-query').UseQueryResult<BusinessPaymentMethodDto[], Error>}
 */
export function useMerchantPaymentMethods({ enabled = true } = {}) {
  return useQuery({
    queryKey: qk.merchantPaymentMethods(),
    queryFn: () => merchantPaymentMethodsRepository.getAll(),
    enabled
  })
}

/**
 * Hook to update a merchant's business payment method.
 * @returns {import('@tanstack/react-query').UseMutationResult<BusinessPaymentMethodDto, Error, { id: string, accountInfo?: string|null, imageUrl?: string|null }>}
 */
export function useUpdateMerchantPaymentMethod() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, accountInfo, imageUrl }) => 
      merchantPaymentMethodsRepository.update(id, { accountInfo, imageUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPaymentMethods() })
      showToast(t('payment_methods.update_success'), 'success')
    },
    onError: (err) => {
      showToast(err.message || t('payment_methods.update_failed'), 'error')
    }
  })
}

// UI wallet keys (setup wizard payoutConfigs) → backend PayoutMethodType enum names.
const METHOD_TYPE_BY_UI_KEY = {
  zelle: 'Zelle',
  bankwire: 'BankWire',
  paypal: 'PayPal',
  venmo: 'Venmo',
  cashapp: 'CashApp',
  applecash: 'AppleCash',
  vlinkpay: 'VlinkPay'
}

/**
 * Hook to persist the onboarding payout configs to the merchant payment-methods API.
 * The backend pre-seeds all PayoutMethodType methods (inactive) on business creation,
 * so the flow is: GET (map type → id) → PUT accountInfo → PATCH toggle.
 * @returns {import('@tanstack/react-query').UseMutationResult<void, Error, object>}
 */
export function useSaveMerchantPayoutConfigs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payoutConfigs) => {
      const methods = await merchantPaymentMethodsRepository.getAll()
      const tasks = []

      for (const [uiKey, config] of Object.entries(payoutConfigs || {})) {
        const backendType = METHOD_TYPE_BY_UI_KEY[uiKey]
        if (!backendType) continue

        const method = methods.find(m => m.type === backendType)
        if (!method) continue

        const accountInfo = config.value?.trim() || ''
        // A method can only be active once configured (BR: isConfigured required).
        const wantsActive = !!(config.enabled && accountInfo)

        tasks.push((async () => {
          if (accountInfo && accountInfo !== method.accountInfo) {
            await merchantPaymentMethodsRepository.update(method.id, { accountInfo })
          }
          if (method.isActive !== wantsActive) {
            // VlinkPay cannot be toggled before KYB approval — skip instead of failing onboarding.
            if (backendType === 'VlinkPay') return
            await merchantPaymentMethodsRepository.toggle(method.id)
          }
        })())
      }

      await Promise.all(tasks)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPaymentMethods() })
    }
  })
}

/**
 * Hook to toggle a merchant's business payment method active status.
 * @returns {import('@tanstack/react-query').UseMutationResult<BusinessPaymentMethodDto, Error, string>}
 */
export function useToggleMerchantPaymentMethod() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id) => merchantPaymentMethodsRepository.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPaymentMethods() })
    },
    onError: (err) => {
      showToast(err.message || t('payment_methods.toggle_failed'), 'error')
    }
  })
}
