import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import {
  useConfirmDirectPayment,
  useCreateDirectPayment,
  useDirectPaymentPage,
  useDirectPaymentTipContext,
} from '../../../data/hooks/usePublicDirectPayment'
import {
  useConfirmMultiStaffTip,
  useConfirmTip,
  useCreateMultiStaffTip,
  useCreateTip,
} from '../../../data/hooks/usePublicTouch'
import { MULTI_STAFF_TIP_MIN_COUNT } from '../../../constants/tipPresets'
import useDirectPaymentTip from './useDirectPaymentTip'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { getApiErrorCode } from '../../../types/domain'
import type { PublicDirectPaymentStaff } from '../../../types/domain'
import type { TipItem } from './useDirectPaymentTip'
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
const EMPTY_TIP_STAFF: PublicDirectPaymentStaff[] = []
const EMPTY_TIP_ITEMS: TipItem[] = []

export default function useDirectPaymentFlow() {
  const { businessId = '' } = useParams()
  const { currentLanguage, setLanguage, t } = useTranslation()
  const { showToast } = useNotification()

  /** Touchpoint context forwarded by /touch → /pay; source of the tippable staff list. */
  const touchContext = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const businessSlug = params.get('businessSlug') || ''
    const touchPointSlug = params.get('touchPointSlug') || ''
    return {
      businessSlug,
      touchPointSlug,
      sessionId: params.get('sessionId') || crypto.randomUUID(),
    }
  }, [])

  const pageQuery = useDirectPaymentPage(businessId)
  const createPaymentMutation = useCreateDirectPayment()
  const confirmPaymentMutation = useConfirmDirectPayment()
  const createMultiStaffTipMutation = useCreateMultiStaffTip()
  const confirmMultiStaffTipMutation = useConfirmMultiStaffTip()
  const createSingleTipMutation = useCreateTip()
  const confirmSingleTipMutation = useConfirmTip()

  const [step, setStep] = useState<DirectPaymentStep>(DIRECT_PAYMENT_STEP.Review)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedWalletObj, setSelectedWalletObj] = useState<any>(null)
  const [selectedWallet, setSelectedWallet] = useState('')
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null)
  const [activePaymentMethod, setActivePaymentMethod] = useState<any>(null)
  const [selectedCryptoSymbol, setSelectedCryptoSymbol] = useState<string | null>(null)
  const [currentTipId, setCurrentTipId] = useState<string | null>(null)
  /** Which endpoint created the tip — decides the matching confirm call. */
  const [currentTipKind, setCurrentTipKind] = useState<'single' | 'multi' | null>(null)

  const pageData = pageQuery.data
  const businessName = pageData?.businessName || ''
  const logoUrl = pageData?.logoUrl || null

  const tipContext = useDirectPaymentTipContext({
    page: pageData,
    businessSlug: touchContext.businessSlug,
    touchPointSlug: touchContext.touchPointSlug,
    sessionId: touchContext.sessionId,
  })
  const tipStaff = tipContext.staff.length ? tipContext.staff : EMPTY_TIP_STAFF
  const touchPointId = tipContext.touchPointId
  const tip = useDirectPaymentTip(tipStaff, tipContext.tipConstraints)
  /** Tipping needs both a staff list and the touch point the tip is booked against. */
  const canTip = tipStaff.length > 0 && Boolean(touchPointId)
  const tipTotal = canTip ? tip.tipTotal : 0
  const tipItems = canTip ? tip.tipItems : EMPTY_TIP_ITEMS
  const tipError = canTip ? tip.tipError : null

  const activeAmount = useMemo(
    () => parseDirectPaymentAmountInput(customAmount),
    [customAmount],
  )

  /** Bill + tips — the single amount the customer transfers. */
  const totalAmount = activeAmount + tipTotal

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
    if (tipError === 'min_item') {
      showToast(
        t('direct_payment.tip_min_item_error', {
          min: formatUsdAmount(tip.constraints.minItemAmount),
        }),
        'error',
      )
      return false
    }
    if (tipError === 'max_total') {
      showToast(
        t('direct_payment.tip_max_total_error', {
          max: formatUsdAmount(tip.constraints.maxTotalAmount),
        }),
        'error',
      )
      return false
    }
    return true
  }, [activeAmount, showToast, t, tip.constraints, tipError])

  const handleCustomAmountChange = useCallback((raw: string) => {
    setCustomAmount(sanitizeDirectPaymentAmountInput(raw, MAX_AMOUNT))
  }, [])

  const createPaymentForWallet = useCallback(
    async (
      wallet: { methodId?: string; name?: string; key?: string; apiMethod?: unknown },
      cryptoSymbol?: string,
    ) => {
      if (!wallet.methodId) {
        showToast(t('errors.generic'), 'error')
        return false
      }

      // Tip first — a rejected tip must not leave an orphan payment behind.
      // 2+ recipients → POST /api/v1/tips/multi-staff (business account, even split).
      // Exactly 1 → POST /api/v1/touch/tip (multi-staff rejects a single recipient).
      if (!currentTipId && tipItems.length > 0) {
        if (tipItems.length >= MULTI_STAFF_TIP_MIN_COUNT) {
          const tipResult = await createMultiStaffTipMutation.mutateAsync({
            businessId,
            touchPointId,
            businessPaymentMethodId: wallet.methodId,
            tipItems,
            ...(cryptoSymbol ? { cryptoSymbol } : {}),
          })
          setCurrentTipId(String(tipResult?.tipId || tipResult?.id || '') || null)
          setCurrentTipKind('multi')
        } else {
          const [singleItem] = tipItems
          const tipResult = await createSingleTipMutation.mutateAsync({
            touchPointId,
            staffProfileId: singleItem.staffProfileId,
            amount: singleItem.amount,
            paymentMethod: wallet.key || '',
            sessionId: touchContext.sessionId,
            ...(cryptoSymbol ? { cryptoSymbol } : {}),
          })
          setCurrentTipId(String(tipResult?.tipId || tipResult?.id || '') || null)
          setCurrentTipKind('single')
        }
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
      setActivePaymentMethod(
        mergeCreatedPaymentMethod(wallet.apiMethod as any, result.paymentMethod),
      )
      applyCreatedPaymentWalletState(wallet, cryptoSymbol, {
        setSelectedCryptoSymbol,
        setSelectedWalletObj,
      })
      return true
    },
    [
      activeAmount,
      businessId,
      createMultiStaffTipMutation,
      createPaymentMutation,
      createSingleTipMutation,
      currentTipId,
      showToast,
      t,
      tipItems,
      touchContext.sessionId,
      touchPointId,
    ],
  )

  const handleSelectWallet = useCallback(
    async (wallet: { methodId?: string; name?: string; key?: string; apiMethod?: unknown }) => {
      if (!wallet.methodId) {
        showToast(t('errors.generic'), 'error')
        return
      }

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
          setCurrentTipId(null)
          setCurrentTipKind(null)
          setActivePaymentMethod(selected.apiMethod || null)
          setSelectedCryptoSymbol(null)
        },
        logCreatePaymentError: (err) => {
          logger.error('Failed to create direct payment', err)
        },
      })
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
      logger.error('Failed to create VlinkPay direct payment', err)
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))), 'error')
      return false
    }
  }, [createPaymentForWallet, currentPaymentId, selectedWalletObj, showToast, t])

  const handleResetVlinkpayPayment = useCallback(() => {
    setCurrentPaymentId(null)
    setCurrentTipId(null)
    setCurrentTipKind(null)
    setSelectedCryptoSymbol(null)
  }, [])

  const handleConfirmPayment = useCallback(async () => {
    if (!currentPaymentId || confirmPaymentMutation.isPending) return

    try {
      await confirmPaymentMutation.mutateAsync(currentPaymentId)
      if (currentTipId) {
        // Best-effort: the payment is already confirmed, the tip confirm can be retried by BE ops.
        try {
          if (currentTipKind === 'single') {
            await confirmSingleTipMutation.mutateAsync(currentTipId)
          } else {
            await confirmMultiStaffTipMutation.mutateAsync(currentTipId)
          }
        } catch (tipErr) {
          logger.error('Failed to confirm tip', tipErr)
        }
      }
      setStep(DIRECT_PAYMENT_STEP.Success)
    } catch (err) {
      logger.error('Failed to confirm direct payment', err)
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))), 'error')
    }
  }, [
    confirmMultiStaffTipMutation,
    confirmPaymentMutation,
    confirmSingleTipMutation,
    currentPaymentId,
    currentTipId,
    currentTipKind,
    showToast,
    t,
  ])

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
    activePaymentMethod,
    selectedCryptoSymbol,
    handleSelectWallet,
    handleCreateVlinkpayPayment,
    handleResetVlinkpayPayment,
    handleConfirmPayment,
    isCreating: createPaymentMutation.isPending
      || createMultiStaffTipMutation.isPending
      || createSingleTipMutation.isPending,
    isConfirming: confirmPaymentMutation.isPending,
    tip,
    canTip,
    tipTotal,
    tipItems,
    tipError,
    totalAmount,
    perStaffTipAmount: canTip ? tip.perStaffAmount : 0,
    currentTipId,
  }
}
