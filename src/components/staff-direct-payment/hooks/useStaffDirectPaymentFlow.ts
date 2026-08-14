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
import { getApiErrorCode } from '../../../types/domain'
import { logger } from '../../../utils/logger'
import { toVlinkpayCryptoSymbolWire } from '../../payout/vlinkpayWallet'
import {
  DIRECT_PAYMENT_MIN_AMOUNT,
  STAFF_DIRECT_PAYMENT_MAX_AMOUNT,
  formatUsdAmount,
  parseDirectPaymentAmountInput,
  sanitizeDirectPaymentAmountInput,
} from '../../../utils/currencyInput'
import {
  DIRECT_PAYMENT_STEP,
  type DirectPaymentStep,
  isVlinkpayWallet,
  mapPageMethodsToWalletOptions,
  mergeCreatedPaymentMethod,
  resolveWalletVlinkpayCryptoAddresses,
  toWalletTipPaymentMethodsData,
} from '../../direct-payment/paymentFlowShared'

const MIN_AMOUNT = DIRECT_PAYMENT_MIN_AMOUNT
const MAX_AMOUNT = STAFF_DIRECT_PAYMENT_MAX_AMOUNT

export default function useStaffDirectPaymentFlow() {
  const { staffProfileId = '' } = useParams()
  const { currentLanguage, setLanguage, t } = useTranslation()
  const { showToast } = useNotification()

  const pageQuery = useStaffDirectPaymentPage(staffProfileId)
  const createPaymentMutation = useCreateStaffDirectPayment()
  const confirmPaymentMutation = useConfirmStaffDirectPayment()

  const [step, setStep] = useState<DirectPaymentStep>(DIRECT_PAYMENT_STEP.Review)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedWalletObj, setSelectedWalletObj] = useState<any>(null)
  const [selectedWallet, setSelectedWallet] = useState('')
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null)
  const [activePaymentMethod, setActivePaymentMethod] = useState<any>(null)

  const pageData = pageQuery.data
  const displayName = pageData?.displayName || ''
  const photoUrl = pageData?.photoUrl || null

  const activeAmount = useMemo(
    () => parseDirectPaymentAmountInput(customAmount),
    [customAmount],
  )

  const walletOptions = useMemo(
    () => mapPageMethodsToWalletOptions(pageData?.paymentMethods),
    [pageData?.paymentMethods],
  )

  const staffRecipient = useMemo(
    () => [
      {
        id: staffProfileId || 'staff',
        nickname: displayName || t('staff_direct_payment.default_staff'),
        fullName: displayName || t('staff_direct_payment.default_staff'),
        position: '',
        paymentAccounts: {},
      },
    ],
    [displayName, staffProfileId, t],
  )

  const tipPaymentMethodsData = useMemo(
    () => toWalletTipPaymentMethodsData(activePaymentMethod),
    [activePaymentMethod],
  )

  const businessVlinkpayCryptoAddresses = useMemo(
    () => resolveWalletVlinkpayCryptoAddresses(activePaymentMethod, selectedWalletObj),
    [activePaymentMethod, selectedWalletObj],
  )

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

  const createPaymentForWallet = useCallback(
    async (
      wallet: { methodId?: string; name?: string; apiMethod?: unknown },
      cryptoSymbol?: string,
    ) => {
      if (!wallet.methodId) {
        showToast(t('errors.generic'), 'error')
        return false
      }

      const result = await createPaymentMutation.mutateAsync({
        staffProfileId,
        staffPaymentMethodId: wallet.methodId,
        amount: activeAmount,
        ...(cryptoSymbol ? { cryptoSymbol } : {}),
      })

      if (!result.paymentId) {
        throw new Error('Missing paymentId')
      }

      setCurrentPaymentId(result.paymentId)
      setActivePaymentMethod(
        mergeCreatedPaymentMethod(wallet.apiMethod as any, result.paymentMethod),
      )
      return true
    },
    [activeAmount, createPaymentMutation, showToast, staffProfileId, t],
  )

  const handleSelectWallet = useCallback(
    async (wallet: { methodId?: string; name?: string; key?: string; apiMethod?: unknown }) => {
      if (!validateAmount()) return
      if (!wallet.methodId) {
        showToast(t('errors.generic'), 'error')
        return
      }

      setSelectedWalletObj(wallet)
      setSelectedWallet(wallet.name || '')

      if (isVlinkpayWallet(wallet)) {
        setCurrentPaymentId(null)
        setActivePaymentMethod(wallet.apiMethod || null)
        setStep(DIRECT_PAYMENT_STEP.WalletDetails)
        return
      }

      setStep(DIRECT_PAYMENT_STEP.Processing)
      try {
        await createPaymentForWallet(wallet)
        setStep(DIRECT_PAYMENT_STEP.WalletDetails)
      } catch (err) {
        logger.error('Failed to create staff direct payment', err)
        showToast(t(getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))), 'error')
        setStep(DIRECT_PAYMENT_STEP.Review)
      }
    },
    [createPaymentForWallet, showToast, t, validateAmount],
  )

  const handleCreateVlinkpayPayment = useCallback(async (cryptoSymbol: string) => {
    if (!selectedWalletObj?.methodId) {
      showToast(t('errors.generic'), 'error')
      return false
    }
    if (!toVlinkpayCryptoSymbolWire(cryptoSymbol)) {
      showToast(t('errors.TIP_CRYPTO_SYMBOL_REQUIRED'), 'error')
      return false
    }
    if (currentPaymentId) return true

    try {
      await createPaymentForWallet(selectedWalletObj, cryptoSymbol)
      return true
    } catch (err) {
      logger.error('Failed to create VlinkPay staff direct payment', err)
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))), 'error')
      return false
    }
  }, [createPaymentForWallet, currentPaymentId, selectedWalletObj, showToast, t])

  const handleResetVlinkpayPayment = useCallback(() => {
    setCurrentPaymentId(null)
  }, [])

  const handleConfirmPayment = useCallback(async () => {
    if (!currentPaymentId || confirmPaymentMutation.isPending) return

    try {
      await confirmPaymentMutation.mutateAsync(currentPaymentId)
      setStep(DIRECT_PAYMENT_STEP.Success)
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
    businessVlinkpayCryptoAddresses,
    currentPaymentId,
    activePaymentMethod,
    handleSelectWallet,
    handleCreateVlinkpayPayment,
    handleResetVlinkpayPayment,
    handleConfirmPayment,
    isCreating: createPaymentMutation.isPending,
    isConfirming: confirmPaymentMutation.isPending,
  }
}
