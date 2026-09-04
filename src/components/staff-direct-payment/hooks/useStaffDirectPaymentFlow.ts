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
  applyCreatedPaymentWalletState,
  mapPageMethodsToWalletOptions,
  mergeCreatedPaymentMethod,
  runDirectPaymentWalletSelect,
  resolveWalletVlinkpayCryptoAddresses,
  toWalletTipPaymentMethodsData,
  resolveDirectPaymentAmountError,
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
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null)
  const [activePaymentMethod, setActivePaymentMethod] = useState<any>(null)
  const [selectedCryptoSymbol, setSelectedCryptoSymbol] = useState<string | null>(null)

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

  const amountError = resolveDirectPaymentAmountError(
    customAmount,
    activeAmount,
    MIN_AMOUNT,
    MAX_AMOUNT,
  )
  const amountErrorText = useMemo(() => {
    if (amountError === 'too_low') {
      return t('staff_direct_payment.amount_too_low', { min: formatUsdAmount(MIN_AMOUNT) })
    }
    if (amountError === 'too_high') {
      return t('staff_direct_payment.amount_too_high', { max: formatUsdAmount(MAX_AMOUNT) })
    }
    return null
  }, [amountError, t])

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
      setConfirmedAmount(result.amount)
      setActivePaymentMethod(
        mergeCreatedPaymentMethod(wallet.apiMethod as any, result.paymentMethod),
      )
      applyCreatedPaymentWalletState(wallet, cryptoSymbol, {
        setSelectedCryptoSymbol,
        setSelectedWalletObj,
      })
      return true
    },
    [activeAmount, createPaymentMutation, showToast, staffProfileId, t],
  )

  const handleSelectWallet = useCallback(
    async (wallet: { methodId?: string; name?: string; key?: string; apiMethod?: unknown }) => {
      if (createPaymentMutation.isPending) return
      if (!wallet.methodId) {
        showToast(t('errors.generic'), 'error')
        return
      }

      setConfirmedAmount(null)
      await runDirectPaymentWalletSelect(wallet, {
        validateAmount,
        setSelectedWalletObj,
        setSelectedWallet,
        setStep,
        createPaymentForWallet,
        onCreatePaymentError: (err) => {
          showToast(t(getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))), 'error')
        },
        onVlinkpayAwaitAsset: (selected) => {
          setCurrentPaymentId(null)
          setActivePaymentMethod(selected.apiMethod || null)
          setSelectedCryptoSymbol(null)
        },
        logCreatePaymentError: (err) => {
          logger.error('Failed to create staff direct payment', err)
        },
      })
    },
    [createPaymentForWallet, createPaymentMutation.isPending, showToast, t, validateAmount],
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
    setSelectedCryptoSymbol(null)
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
    amountError,
    amountErrorText,
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
    confirmedAmount,
    activePaymentMethod,
    selectedCryptoSymbol,
    handleSelectWallet,
    handleCreateVlinkpayPayment,
    handleResetVlinkpayPayment,
    handleConfirmPayment,
    isCreating: createPaymentMutation.isPending,
    isConfirming: confirmPaymentMutation.isPending,
  }
}
