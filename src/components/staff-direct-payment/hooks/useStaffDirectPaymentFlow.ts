import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import {
  useConfirmStaffDirectPayment,
  useCreateStaffDirectPayment,
  useStaffDirectPaymentPage,
} from '../../../data/hooks/usePublicStaffPayment'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { payoutTypeToUiKey, sortPaymentMethodsByUiOrder } from '../../../data/paymentMethodTypes'
import { getApiErrorCode } from '../../../types/domain'
import { logger } from '../../../utils/logger'
import { getWalletOptions } from '../../customer-flow/steps/Payment'
import {
  DIRECT_PAYMENT_MIN_AMOUNT,
  STAFF_DIRECT_PAYMENT_MAX_AMOUNT,
  formatUsdAmount,
  parseDirectPaymentAmountInput,
  sanitizeDirectPaymentAmountInput,
} from '../../../utils/currencyInput'

const MIN_AMOUNT = DIRECT_PAYMENT_MIN_AMOUNT
const MAX_AMOUNT = STAFF_DIRECT_PAYMENT_MAX_AMOUNT

function resolveAmount(selectedAmount: number | 'custom', customAmount: string): number {
  if (selectedAmount === 'custom') return parseDirectPaymentAmountInput(customAmount)
  return Number(selectedAmount) || 0
}

export default function useStaffDirectPaymentFlow() {
  const { staffProfileId = '' } = useParams()
  const { currentLanguage, setLanguage, t } = useTranslation()
  const { showToast } = useNotification()

  const pageQuery = useStaffDirectPaymentPage(staffProfileId)
  const createPaymentMutation = useCreateStaffDirectPayment()
  const confirmPaymentMutation = useConfirmStaffDirectPayment()

  const [step, setStep] = useState('review')
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(15)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedWalletObj, setSelectedWalletObj] = useState<any>(null)
  const [selectedWallet, setSelectedWallet] = useState('')
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null)
  const [activePaymentMethod, setActivePaymentMethod] = useState<any>(null)

  const pageData = pageQuery.data
  const displayName = pageData?.displayName || ''
  const photoUrl = pageData?.photoUrl || null

  const activeAmount = useMemo(
    () => resolveAmount(selectedAmount, customAmount),
    [selectedAmount, customAmount],
  )

  const walletOptions = useMemo(() => {
    const methods = sortPaymentMethodsByUiOrder(
      (pageData?.paymentMethods ?? []).map((method) => ({
        ...method,
        uiKey: method.uiKey || payoutTypeToUiKey(method.type),
      })),
    ).filter((method) => method.uiKey !== 'bankwire')

    return methods
      .map((method) => {
        const wallet = getWalletOptions([method.uiKey || ''])[0]
        if (!wallet) return null
        return {
          ...wallet,
          methodId: method.id,
          apiMethod: method,
        }
      })
      .filter(Boolean)
  }, [pageData?.paymentMethods])

  const staffRecipient = useMemo(
    () => [
      {
        id: staffProfileId || 'staff',
        nickname: displayName || t('staff_direct_payment.default_staff'),
        fullName: displayName || t('staff_direct_payment.default_staff'),
        position: t('staff_direct_payment.pay_to_staff'),
        paymentAccounts: {},
      },
    ],
    [displayName, staffProfileId, t],
  )

  const tipPaymentMethodsData = useMemo(() => {
    if (!activePaymentMethod) return null
    return [
      {
        type: activePaymentMethod.type,
        accountInfo: activePaymentMethod.accountInfo,
      },
    ]
  }, [activePaymentMethod])

  const validateAmount = useCallback(() => {
    if (Number.isNaN(activeAmount) || activeAmount < MIN_AMOUNT) {
      showToast(t('staff_direct_payment.amount_too_low', { min: formatUsdAmount(MIN_AMOUNT) }), 'error')
      return false
    }
    if (activeAmount > MAX_AMOUNT) {
      showToast(t('staff_direct_payment.amount_too_high', { max: formatUsdAmount(MAX_AMOUNT) }), 'error')
      return false
    }
    return true
  }, [activeAmount, showToast, t])

  const handleCustomAmountChange = useCallback((raw: string) => {
    setCustomAmount(sanitizeDirectPaymentAmountInput(raw, MAX_AMOUNT))
  }, [])

  const handleSelectWallet = useCallback(
    async (wallet: { methodId?: string; name?: string; key?: string; apiMethod?: unknown }) => {
      if (!validateAmount()) return
      if (!wallet.methodId) {
        showToast(t('errors.generic'), 'error')
        return
      }

      setSelectedWalletObj(wallet)
      setSelectedWallet(wallet.name || '')
      setStep('processing')

      try {
        const result = await createPaymentMutation.mutateAsync({
          staffProfileId,
          staffPaymentMethodId: wallet.methodId,
          amount: activeAmount,
        })

        if (!result.paymentId) {
          throw new Error('Missing paymentId')
        }

        setCurrentPaymentId(result.paymentId)
        setActivePaymentMethod(result.paymentMethod || wallet.apiMethod)
        setStep('wallet_details')
      } catch (err) {
        logger.error('Failed to create staff direct payment', err)
        showToast(t(getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))), 'error')
        setStep('review')
      }
    },
    [
      activeAmount,
      createPaymentMutation,
      showToast,
      staffProfileId,
      t,
      validateAmount,
    ],
  )

  const handleConfirmPayment = useCallback(async () => {
    if (!currentPaymentId) return

    try {
      await confirmPaymentMutation.mutateAsync(currentPaymentId)
      setStep('success')
    } catch (err) {
      logger.error('Failed to confirm staff direct payment', err)
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))), 'error')
    }
  }, [confirmPaymentMutation, currentPaymentId, showToast, t])

  return {
    staffProfileId,
    currentLanguage,
    setLanguage,
    t,
    showToast,
    pageQuery,
    pageData,
    displayName,
    photoUrl,
    step,
    setStep,
    selectedAmount,
    setSelectedAmount,
    customAmount,
    setCustomAmount,
    handleCustomAmountChange,
    activeAmount,
    minAmount: MIN_AMOUNT,
    maxAmount: MAX_AMOUNT,
    walletOptions,
    selectedWalletObj,
    selectedWallet,
    staffRecipient,
    tipPaymentMethodsData,
    currentPaymentId,
    activePaymentMethod,
    handleSelectWallet,
    handleConfirmPayment,
    isCreating: createPaymentMutation.isPending,
    isConfirming: confirmPaymentMutation.isPending,
  }
}
