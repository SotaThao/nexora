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
import { getApiErrorCode } from '../../../types/domain'
import { logger } from '../../../utils/logger'
import { toVlinkpayCryptoSymbolWire } from '../../payout/vlinkpayWallet'
import {
  DIRECT_PAYMENT_MAX_AMOUNT,
  DIRECT_PAYMENT_MIN_AMOUNT,
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
} from '../paymentFlowShared'

const MIN_AMOUNT = DIRECT_PAYMENT_MIN_AMOUNT
const MAX_AMOUNT = DIRECT_PAYMENT_MAX_AMOUNT

export default function useDirectPaymentFlow() {
  const { businessId = '' } = useParams()
  const { currentLanguage, setLanguage, t } = useTranslation()
  const { showToast } = useNotification()

  const pageQuery = useDirectPaymentPage(businessId)
  const createPaymentMutation = useCreateDirectPayment()
  const confirmPaymentMutation = useConfirmDirectPayment()

  const [step, setStep] = useState<DirectPaymentStep>(DIRECT_PAYMENT_STEP.Review)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedWalletObj, setSelectedWalletObj] = useState<any>(null)
  const [selectedWallet, setSelectedWallet] = useState('')
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null)
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null)
  const [activePaymentMethod, setActivePaymentMethod] = useState<any>(null)
  const [selectedCryptoSymbol, setSelectedCryptoSymbol] = useState<string | null>(null)

  const pageData = pageQuery.data
  const businessName = pageData?.businessName || ''
  const logoUrl = pageData?.logoUrl || null

  const activeAmount = useMemo(
    () => parseDirectPaymentAmountInput(customAmount),
    [customAmount],
  )

  const walletOptions = useMemo(
    () => mapPageMethodsToWalletOptions(pageData?.paymentMethods),
    [pageData?.paymentMethods],
  )

  const businessRecipient = useMemo(
    () => [
      {
        id: 'merchant',
        nickname: businessName || t('direct_payment.default_business'),
        fullName: businessName || t('direct_payment.default_business'),
        position: '',
        paymentAccounts: {},
      },
    ],
    [businessName, t],
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
        businessId,
        businessPaymentMethodId: wallet.methodId,
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
    [activeAmount, businessId, createPaymentMutation, showToast, t],
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
          logger.error('Failed to create direct payment', err)
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
      logger.error('Failed to create VlinkPay direct payment', err)
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
