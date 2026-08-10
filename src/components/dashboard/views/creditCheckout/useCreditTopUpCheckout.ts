import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useProfileSettings } from '../../../../data/hooks/useProfileSettings'
import { useSubscriptionCardOrderPoll } from '../../../../data/hooks/useSubscriptionCardOrderPoll'
import {
  invalidateCreditTopUpQueries,
  useInitializeCardPayment,
  usePurchaseCreditTopUp,
  useSubscriptionPackages,
  useSubscriptionPaymentMethods,
} from '../../../../data/hooks/useSubscriptionPayments'
import {
  SubscriptionPackageType,
  SubscriptionPaymentStatus,
  type SubscriptionPackage,
  type SubscriptionPaymentMethod,
} from '../../../../data/repositories/subscriptionPayments'
import { buildSubscriptionBillingDefaultsFromProfile } from '../../../../utils/subscriptionBillingDefaults'
import { resolveTranslatedApiError } from '../../../../utils/resolveTranslatedApiError'
import type { SubscriptionCardPaymentFormHandle } from '../../modals/SubscriptionCardPaymentForm'
import {
  PLAN_CARD_PAYMENT_SYMBOL,
  hasEnoughWalletBalance,
  isPlanCardPaymentSymbol,
} from '../plans/constants'
import { CREDIT_TOP_UP_CARD_COPY_TK } from './constants'
import { getErrorI18nKey } from '../../../../data/errorCodes'

/** Stable fallback — avoids new `[]` each render that retriggers effects. */
export const EMPTY_CREDIT_PACKAGES: SubscriptionPackage[] = []
export const EMPTY_CREDIT_PAYMENT_METHODS: SubscriptionPaymentMethod[] = []

const PURCHASE_STATUS_TOAST: Partial<
  Record<SubscriptionPaymentStatus, { key: string; type: 'error' | 'info' }>
> = {
  [SubscriptionPaymentStatus.Failed]: {
    key: 'purchaseFailed',
    type: 'error',
  },
  [SubscriptionPaymentStatus.Pending]: {
    key: 'purchasePending',
    type: 'info',
  },
}

export function pickFeaturedCreditPackageId(packages: SubscriptionPackage[]): string | null {
  if (packages.length === 0) return null
  let best = packages[0]
  for (const pkg of packages) {
    const bestUnits = best.creditUnits ?? -1
    const units = pkg.creditUnits ?? -1
    if (units > bestUnits) {
      best = pkg
      continue
    }
    if (units === bestUnits && (pkg.price ?? 0) > (best.price ?? 0)) {
      best = pkg
    }
  }
  return best.id || null
}

export function getCreditPackageNote(
  pkg: SubscriptionPackage,
  language: string,
): string {
  const features = language.toLowerCase().startsWith('vi') ? pkg.featuresVi : pkg.featuresEn
  const first = features.find((line) => line.trim())
  return first?.trim() ?? ''
}

export function buildCardPaymentMethodStub(label: string): SubscriptionPaymentMethod {
  return {
    name: label,
    symbol: PLAN_CARD_PAYMENT_SYMBOL,
    balance: 0,
    rate: 1,
    icon: '',
  }
}

type Translate = (key: string, params?: Record<string, string | number>) => string

type Options = {
  open: boolean
  packageType: SubscriptionPackageType
  /** i18n namespace owning purchaseFailed / purchasePending. */
  copyTk: string
  /** i18n namespace owning `cardMethodLabel`. Defaults to SMS campaigns. */
  cardCopyTk?: string
  t: Translate
  onSuccess?: (pkg: SubscriptionPackage, payment: SubscriptionPaymentMethod) => void
  onClose: () => void
}

export function useCreditTopUpCheckout({
  open,
  packageType,
  copyTk,
  cardCopyTk = CREDIT_TOP_UP_CARD_COPY_TK,
  t,
  onSuccess,
  onClose,
}: Options) {
  const { showToast } = useNotification()
  const queryClient = useQueryClient()
  const cardFormRef = useRef<SubscriptionCardPaymentFormHandle | null>(null)
  const [packageId, setPackageIdState] = useState<string | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [cardSubmitting, setCardSubmitting] = useState(false)

  const cardPaymentLabel = t(`${cardCopyTk}.cardMethodLabel`)
  const isCardPayment = isPlanCardPaymentSymbol(selectedSymbol)

  const packagesQuery = useSubscriptionPackages({
    enabled: open,
    packageType,
    staleTime: 60_000,
  })
  const methodsQuery = useSubscriptionPaymentMethods({ enabled: open })
  const purchaseMutation = usePurchaseCreditTopUp(packageType)
  const initializeCardMutation = useInitializeCardPayment()
  const { data: profile } = useProfileSettings({ enabled: open })
  const billingDefaults = useMemo(
    () => buildSubscriptionBillingDefaultsFromProfile(profile),
    [profile],
  )

  const packages = packagesQuery.data ?? EMPTY_CREDIT_PACKAGES
  const methods = methodsQuery.data ?? EMPTY_CREDIT_PAYMENT_METHODS
  const featuredPackageId = useMemo(
    () => pickFeaturedCreditPackageId(packages),
    [packages],
  )

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === packageId) ?? null,
    [packages, packageId],
  )

  const handleCardOrderPaid = useCallback(() => {
    if (!selectedPackage) return
    invalidateCreditTopUpQueries(queryClient, packageType)
    onSuccess?.(selectedPackage, buildCardPaymentMethodStub(cardPaymentLabel))
    onClose()
  }, [cardPaymentLabel, onClose, onSuccess, packageType, queryClient, selectedPackage])

  const {
    isPolling: isCardOrderPolling,
    beginPolling: beginCardOrderPolling,
    resetPolling: resetCardOrderPolling,
  } = useSubscriptionCardOrderPoll({ onPaid: handleCardOrderPaid })

  const setPackageId = useCallback((nextId: string | null) => {
    setPackageIdState((current) => (current === nextId ? current : nextId))
  }, [])

  const prevPackageIdRef = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevPackageIdRef.current
    prevPackageIdRef.current = packageId
    if (!open || !isCardPayment) return
    if (!prev || !packageId || prev === packageId) return
    initializeCardMutation.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isCardPayment, packageId])

  useEffect(() => {
    if (open) return
    setPackageIdState(null)
    setSelectedSymbol(null)
    setCardSubmitting(false)
    prevPackageIdRef.current = null
    resetCardOrderPolling()
    initializeCardMutation.reset()
    purchaseMutation.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on open→closed
  }, [open])

  useEffect(() => {
    if (!open) return
    if (packageId && packages.some((pkg) => pkg.id === packageId)) return
    setPackageIdState(featuredPackageId)
  }, [open, packages, packageId, featuredPackageId])

  useEffect(() => {
    if (!open) return
    if (selectedSymbol) return
    if (methods.length > 0) {
      setSelectedSymbol(methods[0].symbol)
      return
    }
    if (!methodsQuery.isLoading && !methodsQuery.isError) {
      setSelectedSymbol(PLAN_CARD_PAYMENT_SYMBOL)
    }
  }, [open, methods, methodsQuery.isLoading, methodsQuery.isError, selectedSymbol])

  useEffect(() => {
    if (!open || !isCardPayment || !selectedPackage?.id) return
    if (initializeCardMutation.data || initializeCardMutation.isPending) return
    initializeCardMutation.mutate(selectedPackage.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    isCardPayment,
    selectedPackage?.id,
    initializeCardMutation.data,
    initializeCardMutation.isPending,
  ])

  const selectedPayment = useMemo(
    () => methods.find((method) => method.symbol === selectedSymbol) ?? null,
    [methods, selectedSymbol],
  )

  const isSubmitting = isCardPayment
    ? cardSubmitting || isCardOrderPolling
    : purchaseMutation.isPending

  const canConfirmWallet =
    Boolean(selectedPackage?.id)
    && Boolean(selectedPayment)
    && !isCardPayment
    && !packagesQuery.isLoading
    && !packagesQuery.isError
    && !methodsQuery.isLoading
    && !methodsQuery.isError
    && packages.length > 0
    && methods.length > 0
    && !purchaseMutation.isPending
    && !isCardOrderPolling

  const canConfirmCard =
    isCardPayment
    && Boolean(selectedPackage?.id)
    && Boolean(initializeCardMutation.data)
    && !initializeCardMutation.isPending
    && !isCardOrderPolling
    && !cardSubmitting
    && !packagesQuery.isLoading
    && !packagesQuery.isError
    && packages.length > 0

  const canConfirm = isCardPayment ? canConfirmCard : canConfirmWallet

  const handleSelectPayment = useCallback((symbol: string) => {
    setSelectedSymbol(symbol)
    if (!isPlanCardPaymentSymbol(symbol)) {
      initializeCardMutation.reset()
    }
  }, [initializeCardMutation])

  const handleWalletConfirm = useCallback(() => {
    if (!selectedPackage?.id || !selectedPayment || !canConfirmWallet) return

    if (!hasEnoughWalletBalance(selectedPayment, selectedPackage.price)) {
      showToast(t(getErrorI18nKey('InsufficientBalance')), 'error')
      return
    }

    purchaseMutation.mutate(
      { packageId: selectedPackage.id, symbol: selectedPayment.symbol },
      {
        onSuccess: (result) => {
          const statusToast = PURCHASE_STATUS_TOAST[result.paymentStatus]
          if (statusToast) {
            showToast(t(`${copyTk}.${statusToast.key}`), statusToast.type)
          }
          if (
            result.paymentStatus === SubscriptionPaymentStatus.Failed
            || result.paymentStatus === SubscriptionPaymentStatus.Pending
          ) {
            return
          }
          onSuccess?.(selectedPackage, selectedPayment)
          onClose()
        },
        onError: (err) => {
          showToast(
            resolveTranslatedApiError(t, err, `${copyTk}.purchaseFailed`),
            'error',
          )
        },
      },
    )
  }, [
    canConfirmWallet,
    copyTk,
    onClose,
    onSuccess,
    purchaseMutation,
    selectedPackage,
    selectedPayment,
    showToast,
    t,
  ])

  const handleCardSuccess = useCallback(() => {
    if (!initializeCardMutation.data) return
    beginCardOrderPolling(initializeCardMutation.data.orderId)
  }, [beginCardOrderPolling, initializeCardMutation.data])

  const handleCardError = useCallback((message: string) => {
    showToast(message, 'error')
  }, [showToast])

  const handleConfirm = useCallback(() => {
    if (isCardPayment) {
      void cardFormRef.current?.submit()
      return
    }
    handleWalletConfirm()
  }, [handleWalletConfirm, isCardPayment])

  const retryCardInit = useCallback(() => {
    if (!selectedPackage?.id) return
    initializeCardMutation.mutate(selectedPackage.id)
  }, [initializeCardMutation, selectedPackage?.id])

  return {
    packages,
    methods,
    packagesQuery,
    methodsQuery,
    packageId,
    setPackageId,
    featuredPackageId,
    selectedSymbol,
    handleSelectPayment,
    selectedPackage,
    selectedPayment,
    isCardPayment,
    cardPaymentLabel,
    cardFormRef,
    initializeCardMutation,
    billingDefaults,
    setCardSubmitting,
    isSubmitting,
    canConfirm,
    handleConfirm,
    handleCardSuccess,
    handleCardError,
    retryCardInit,
  }
}
