import { useMutation, useQueryClient } from '@tanstack/react-query'
import profileSettingsRepository from '../repositories/profileSettings'
import staffPaymentMethodsRepository from '../repositories/staffPaymentMethods'
import { logger } from '../../utils/logger'
import type { PaymentMethodDto } from '../../types/domain'
import type { PersonalOnboardingInput } from '../../types/hooks'

const METHOD_TYPE_BY_UI_KEY: Record<string, string> = {
  zelle: 'Zelle',
  venmo: 'Venmo',
  cashapp: 'CashApp',
  paypal: 'PayPal',
  vlinkpay: 'VlinkPay',
  applecash: 'AppleCash',
  bankwire: 'BankWire',
}

export function useCompletePersonalOnboarding() {
  const queryClient = useQueryClient()

  return useMutation<{ success: boolean }, Error, PersonalOnboardingInput>({
    mutationFn: async ({ accountData, payoutConfigs }) => {
      const firstName = accountData.fullName?.split(' ')[0] || ''
      const lastName = accountData.fullName?.split(' ').slice(1).join(' ') || ''

      await profileSettingsRepository.updateUserProfile({
        firstName,
        lastName,
        phoneNumber: accountData.phone || '',
      })

      await profileSettingsRepository
        .updateStaffProfile({
          displayName: accountData.nickname || accountData.fullName,
          position: accountData.position || '',
        })
        .catch((err: unknown) => {
          logger.warn('[Personal Onboarding] Ignored staff profile update error:', err)
        })

      let methods: PaymentMethodDto[] = []
      try {
        methods = await staffPaymentMethodsRepository.getAll()
      } catch (err: unknown) {
        logger.warn('[Personal Onboarding] Ignored fetch payment methods error:', err)
      }

      const updatePromises: Promise<void>[] = []

      for (const [uiKey, payoutData] of Object.entries(payoutConfigs)) {
        const accountInfo = payoutData.value?.trim()
        if (!accountInfo) continue

        const backendType = METHOD_TYPE_BY_UI_KEY[uiKey]
        if (!backendType) continue

        const targetMethod = methods.find((m) => m.type === backendType)
        if (targetMethod) {
          updatePromises.push(
            staffPaymentMethodsRepository
              .update(targetMethod.id, { accountInfo })
              .then(() => {
                const isActiveInUi = payoutData.enabled
                if (isActiveInUi && !targetMethod.isActive) {
                  return staffPaymentMethodsRepository.toggle(targetMethod.id).then(() => undefined)
                }
                if (!isActiveInUi && targetMethod.isActive) {
                  return staffPaymentMethodsRepository.toggle(targetMethod.id).then(() => undefined)
                }
                return undefined
              }),
          )
        }
      }

      await Promise.all(updatePromises)

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      queryClient.invalidateQueries({ queryKey: ['staffProfile'] })
      queryClient.invalidateQueries({ queryKey: ['staffPaymentMethods'] })
    },
  })
}
