import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import {
  useConfirmDirectPayment,
  useCreateDirectPayment,
  useDirectPaymentPage,
} from '../../../data/hooks/usePublicDirectPayment'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { payoutTypeToUiKey, sortPaymentMethodsByUiOrder } from '../../../data/paymentMethodTypes'
import { getApiErrorCode } from '../../../types/domain'
import { logger } from '../../../utils/logger'
import { getWalletOptions } from '../../customer-flow/steps/Payment'
import {
  DIRECT_PAYMENT_MAX_AMOUNT,
  DIRECT_PAYMENT_MIN_AMOUNT,
  formatUsdAmount,
  parseDirectPaymentAmountInput,
  sanitizeDirectPaymentAmountInput,
} from '../../../utils/currencyInput'

const MIN_AMOUNT = DIRECT_PAYMENT_MIN_AMOUNT
const MAX_AMOUNT = DIRECT_PAYMENT_MAX_AMOUNT

function resolveAmount(selectedAmount: number | 'custom', customAmount: string): number {
  if (selectedAmount === 'custom') return parseDirectPaymentAmountInput(customAmount)
  return Number(selectedAmount) || 0
}

export default function useDirectPaymentFlow() {
  const { businessId = '' } = useParams()
  const { currentLanguage, setLanguage, t } = useTranslation()
  const { showToast } = useNotification()

  const pageQuery = useDirectPaymentPage(businessId)
  const createPaymentMutation = useCreateDirectPayment()
  const confirmPaymentMutation = useConfirmDirectPayment()

  const [step, setStep] = useState('review')
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(15)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedWalletObj, setSelectedWalletObj] = useState<any>(null)
  const [selectedWallet, setSelectedWallet] = useState('')
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null)
  const [activePaymentMethod, setActivePaymentMethod] = useState<any>(null)

  const pageData = pageQuery.data
  const businessName = pageData?.businessName || ''
  const logoUrl = pageData?.logoUrl || null

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

  const businessRecipient = useMemo(
    () => [
      {
        id: 'merchant',
        nickname: businessName || t('direct_payment.default_business'),
        fullName: businessName || t('direct_payment.default_business'),
        position: t('direct_payment.pay_to_business'),
        paymentAccounts: {},
      },
    ],
    [businessName, t],
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
      showToast(t('direct_payment.amount_too_low', { min: formatUsdAmount(MIN_AMOUNT) }), 'error')
      return false
    }
    if (activeAmount > MAX_AMOUNT) {
      showToast(t('direct_payment.amount_too_high', { max: formatUsdAmount(MAX_AMOUNT) }), 'error')
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
          businessId,
          businessPaymentMethodId: wallet.methodId,
          amount: activeAmount,
        })

        if (!result.paymentId) {
          throw new Error('Missing paymentId')
        }

        setCurrentPaymentId(result.paymentId)
        setActivePaymentMethod(result.paymentMethod || wallet.apiMethod)
        setStep('wallet_details')
      } catch (err) {
        logger.error('Failed to create direct payment', err)
        showToast(t(getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))), 'error')
        setStep('review')
      }
    },
    [
      activeAmount,
      businessId,
      createPaymentMutation,
      showToast,
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
      logger.error('Failed to confirm direct payment', err)
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))), 'error')
    }
  }, [confirmPaymentMutation, currentPaymentId, showToast, t])

  return {
    businessId,
    currentLanguage,
    setLanguage,
    t,
    showToast,
    pageQuery,
    pageData,
    businessName,
    logoUrl,
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
    businessRecipient,
    tipPaymentMethodsData,
    currentPaymentId,
    activePaymentMethod,
    handleSelectWallet,
    handleConfirmPayment,
    isCreating: createPaymentMutation.isPending,
    isConfirming: confirmPaymentMutation.isPending,
  }
}
