import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { merchantPaymentMethodsRepository } from '../repositories/merchantPaymentMethods'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import type { PaymentMethodDto } from '../../types/domain'
import type { PayoutConfigMap, UpdatePaymentMethodVars } from '../../types/hooks'
import { resolvePaymentMethodImageUrl } from '../../utils/resolvePaymentMethodImageUrl'

export function useMerchantPaymentMethods({ enabled = true } = {}) {
  return useQuery<PaymentMethodDto[]>({
    queryKey: qk.merchantPaymentMethods(),
    queryFn: () => merchantPaymentMethodsRepository.getAll(),
    enabled,
  })
}

export function useUpdateMerchantPaymentMethod() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation<PaymentMethodDto, Error, UpdatePaymentMethodVars>({
    mutationFn: async ({ id, accountInfo, imageUrl, imageFile }) => {
      const resolvedImageUrl = await resolvePaymentMethodImageUrl({ imageFile, imageUrl })
      return merchantPaymentMethodsRepository.update(id, {
        accountInfo,
        imageUrl: resolvedImageUrl,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPaymentMethods() })
      showToast(t('payment_methods.update_success'), 'success')
    },
    onError: (err) => {
      showToast(err.message || t('payment_methods.update_failed'), 'error')
    },
  })
}

const METHOD_TYPE_BY_UI_KEY: Record<string, string> = {
  zelle: 'Zelle',
  bankwire: 'BankWire',
  paypal: 'PayPal',
  venmo: 'Venmo',
  cashapp: 'CashApp',
  applecash: 'AppleCash',
  vlinkpay: 'VlinkPay',
}

export function useSaveMerchantPayoutConfigs() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, PayoutConfigMap>({
    mutationFn: async (payoutConfigs) => {
      const methods = await merchantPaymentMethodsRepository.getAll()
      const tasks: Promise<void>[] = []

      for (const [uiKey, config] of Object.entries(payoutConfigs || {})) {
        const backendType = METHOD_TYPE_BY_UI_KEY[uiKey]
        if (!backendType) continue

        const method = methods.find((m) => m.type === backendType)
        if (!method) continue

        const accountInfo = config.value?.trim() || ''
        const wantsActive = !!(config.enabled && accountInfo)

        tasks.push(
          (async () => {
            if (accountInfo && accountInfo !== method.accountInfo) {
              await merchantPaymentMethodsRepository.update(method.id, { accountInfo })
            }
            if (method.isActive !== wantsActive) {
              if (backendType === 'VlinkPay') return
              await merchantPaymentMethodsRepository.toggle(method.id)
            }
          })(),
        )
      }

      await Promise.all(tasks)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPaymentMethods() })
    },
  })
}

export function useToggleMerchantPaymentMethod() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation<
    PaymentMethodDto,
    Error,
    string | { id: string; silentSuccessToast?: boolean }
  >({
    mutationFn: (vars) =>
      merchantPaymentMethodsRepository.toggle(typeof vars === 'string' ? vars : vars.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPaymentMethods() })
    },
    onError: (err) => {
      showToast(err.message || t('payment_methods.toggle_failed'), 'error')
    },
  })
}
