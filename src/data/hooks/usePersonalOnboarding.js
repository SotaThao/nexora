import { useMutation, useQueryClient } from '@tanstack/react-query'
import profileSettingsRepository from '../repositories/profileSettings'
import staffPaymentMethodsRepository from '../repositories/staffPaymentMethods'

/**
 * Hook to handle the API integration for Step 4 of the Personal Registration flow.
 * It updates the user profile, staff profile, and payment methods in a single flow.
 */
export function useCompletePersonalOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ accountData, paymentAccounts, payoutConfigs }) => {
      // 1. Update User Profile (Phone, First Name, Last Name)
      const firstName = accountData.fullName?.split(' ')[0] || ''
      const lastName = accountData.fullName?.split(' ').slice(1).join(' ') || ''
      
      await profileSettingsRepository.updateUserProfile({
        firstName,
        lastName,
        phoneNumber: accountData.phone || ''
      })

      // 2. Update Staff Profile (Nickname, Position)
      await profileSettingsRepository.updateStaffProfile({
        displayName: accountData.nickname || accountData.fullName,
        position: accountData.position || ''
      }).catch(err => {
        console.warn('[Personal Onboarding] Ignored staff profile update error:', err)
      })

      // 3. Update Payment Methods
      // First, get the list of available payment methods to get their IDs
      let methods = []
      try {
        methods = await staffPaymentMethodsRepository.getAll()
      } catch (err) {
        console.warn('[Personal Onboarding] Ignored fetch payment methods error:', err)
      }
      
      // We only update methods that the user has configured
      const updatePromises = []

      // Map of payout method types from UI to Backend Enums (Zelle, Venmo, CashApp, PayPal, AppleCash, VlinkPay, BankWire)
      const methodMapping = {
        zelle: 'Zelle',
        venmo: 'Venmo',
        cashapp: 'CashApp',
        paypal: 'PayPal',
        vlinkpay: 'VlinkPay',
        applecash: 'AppleCash',
        bankwire: 'BankWire'
      }

      // In useRegisterForm, payouts is an object like: { zelle: { enabled: true, value: '...' } }
      for (const [uiKey, payoutData] of Object.entries(payoutConfigs)) {
        const accountInfo = payoutData.value?.trim()
        if (!accountInfo) continue // Skip empty ones
        
        const backendType = methodMapping[uiKey]
        if (!backendType) continue

        const targetMethod = methods.find(m => m.type === backendType)
        if (targetMethod) {
          // Update the account info
          updatePromises.push(
            staffPaymentMethodsRepository.update(targetMethod.id, {
              accountInfo
            }).then(() => {
              // If it's enabled in UI, toggle it if it wasn't active
              const isActiveInUi = payoutData.enabled
              if (isActiveInUi && !targetMethod.isActive) {
                return staffPaymentMethodsRepository.toggle(targetMethod.id)
              } else if (!isActiveInUi && targetMethod.isActive) {
                return staffPaymentMethodsRepository.toggle(targetMethod.id)
              }
            })
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
    }
  })
}
