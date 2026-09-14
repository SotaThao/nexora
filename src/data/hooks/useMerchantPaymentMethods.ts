import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { merchantPaymentMethodsRepository } from '../repositories/merchantPaymentMethods'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import type { PaymentMethodDto } from '../../types/domain'
import type { PayoutConfigMap, UpdatePaymentMethodVars } from '../../types/hooks'
import { resolvePaymentMethodImageUrl } from '../../utils/resolvePaymentMethodImageUrl'
import { toPayoutAccountNameDto, PAYOUT_UI_KEY_TO_API_TYPE } from '../paymentMethodTypes'
import { PayoutApiType, PayoutUiKey } from '../payoutUiKeys'
import {
  parseVlinkpayAddresses,
  toVlinkpayCryptoAddressesPayload,
} from '../../components/payout/vlinkpayWallet'

export function useMerchantPaymentMethods({ enabled = true } = {}) {
  return useQuery<PaymentMethodDto[]>({
    queryKey: qk.merchantPaymentMethods(),
    queryFn: () => merchantPaymentMethodsRepository.getAll(),
    enabled,
    staleTime: 1000 * 60 * 5, // Cache merchant payment methods for 5 mins
  })
}

export function useUpdateMerchantPaymentMethod() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation<PaymentMethodDto, Error, UpdatePaymentMethodVars>({
    mutationFn: async ({
      id,
      accountInfo,
      accountName,
      cryptoAddresses,
      imageUrl,
      imageFile,
      cryptoAddressImages,
    }) => {
      const resolvedImageUrl = await resolvePaymentMethodImageUrl({ imageFile, imageUrl })
      const resolvedCryptoAddresses = cryptoAddresses?.length && cryptoAddressImages
        ? await Promise.all(
          cryptoAddresses.map(async (address) => {
            const pending = cryptoAddressImages[address.symbol?.toUpperCase()]
            if (!pending) return address
            const resolvedAddressImageUrl = await resolvePaymentMethodImageUrl({
              imageFile: pending.file,
              imageUrl: pending.url,
            })
            return { ...address, imageUrl: resolvedAddressImageUrl }
          }),
        )
        : cryptoAddresses
      return merchantPaymentMethodsRepository.update(id, {
        accountInfo,
        accountName,
        cryptoAddresses: resolvedCryptoAddresses,
        imageUrl: resolvedImageUrl,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPaymentMethods() })
      queryClient.invalidateQueries({ queryKey: qk.merchantPaymentQr() })
      showToast(t('payment_methods.update_success'), 'success')
    },
    onError: (err) => {
      showToast(err.message || t('payment_methods.update_failed'), 'error')
    },
  })
}

export function useSaveMerchantPayoutConfigs() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, PayoutConfigMap>({
    mutationFn: async (payoutConfigs) => {
      const methods = await merchantPaymentMethodsRepository.getAll()
      const tasks: Promise<void>[] = []

      for (const [uiKey, config] of Object.entries(payoutConfigs || {})) {
        const backendType = PAYOUT_UI_KEY_TO_API_TYPE[uiKey]
        if (!backendType) continue

        const method = methods.find((m) => m.type === backendType)
        if (!method) continue

        const accountInfo = config.value?.trim() || ''
        const wantsActive = !!(config.enabled && accountInfo)
        const accountName = toPayoutAccountNameDto(uiKey, config.accountName)
        const isVlinkpay = uiKey === PayoutUiKey.VlinkPay

        tasks.push(
          (async () => {
            const accountNameChanged =
              accountName !== undefined && accountName !== (method.accountName ?? null)
            if (isVlinkpay && accountInfo) {
              const cryptoAddresses = toVlinkpayCryptoAddressesPayload(
                parseVlinkpayAddresses(accountInfo),
              )
              await merchantPaymentMethodsRepository.update(method.id, {
                accountInfo: null,
                cryptoAddresses,
                accountName,
              })
            } else if (accountInfo && (accountInfo !== method.accountInfo || accountNameChanged)) {
              await merchantPaymentMethodsRepository.update(method.id, { accountInfo, accountName })
            }
            if (method.isActive !== wantsActive) {
              if (backendType === PayoutApiType.VlinkPay) return
              await merchantPaymentMethodsRepository.toggle(method.id)
            }
          })(),
        )
      }

      await Promise.all(tasks)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPaymentMethods() })
      queryClient.invalidateQueries({ queryKey: qk.merchantPaymentQr() })
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
    onSuccess: (method, vars) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPaymentMethods() })
      queryClient.invalidateQueries({ queryKey: qk.merchantPaymentQr() })
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
