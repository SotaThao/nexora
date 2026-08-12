import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { useProfileSettings } from '../../../data/hooks/useProfileSettings'
import { useSubscriptionCardOrderPoll } from '../../../data/hooks/useSubscriptionCardOrderPoll'
import {
  invalidateSubscriptionPurchaseQueries,
  useSubscriptionPaymentMethods,
  usePurchaseSubscription,
  useInitializeCardPayment,
} from '../../../data/hooks/useSubscriptionPayments'
import { resolveTranslatedApiError } from '../../../utils/resolveTranslatedApiError'
import { resolveSubscriptionBillingDefaults } from '../../../utils/subscriptionBillingDefaults'
import type {
  PurchasableSubscriptionPlan,
  SubscriptionPaymentMethod,
} from '../../../data/repositories/subscriptionPayments'
import { getErrorI18nKey } from '../../../data/errorCodes'
import SubscriptionCardPaymentForm, {
  type SubscriptionBillingDetails,
  type SubscriptionCardPaymentFormHandle,
} from './SubscriptionCardPaymentForm'
import {
  SUBSCRIPTION_PAYMENT_DOM_ID,
  WalletPurchaseNextStep,
  resolveCheckoutPaymentLabel,
  resolveWalletPurchaseNextStep,
  subscriptionModalKey,
  tipPlatformPlanNameI18nKey,
  tryBeginOrderStatusPolling,
} from './subscriptionPaymentConstants'
import {
  CloseIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  WalletCardsIcon,
} from '../views/BookingHubIcons'
import { PlanPaymentMethodsSkeleton } from '../views/BookingHubSkeletons'
import { BOOKING_HUB_EMPTY_CELL } from '../views/bookingHubFormatters'
import { useCheckoutModalLock } from '../views/creditCheckout/useCheckoutModalLock'
import {
  PLAN_CARD_PAYMENT_SYMBOL,
  formatPlanMonthlyTotal,
  formatWalletBalanceUsd,
  hasEnoughWalletBalance,
  isPlanCardPaymentSymbol,
} from '../views/plans/constants'
import '../views/booking-hub.css'

/** Stable fallback — avoid `data ?? []` allocating a new array each render. */
const EMPTY_PAYMENT_METHODS: SubscriptionPaymentMethod[] = []

type Props = {
  isOpen: boolean
  plan: PurchasableSubscriptionPlan
  packageId: string
  price: number
  billingDefaults?: SubscriptionBillingDetails
  onClose: () => void
  onSuccess?: () => void
}

export default function SubscriptionPaymentModal({
  isOpen,
  plan,
  packageId,
  price,
  billingDefaults,
  onClose,
  onSuccess,
}: Props) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const queryClient = useQueryClient()
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const cardFormRef = useRef<SubscriptionCardPaymentFormHandle | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [cardSubmitting, setCardSubmitting] = useState(false)

  const cardPaymentLabel = t(subscriptionModalKey('cardMethodLabel'))
  const isCardPayment = isPlanCardPaymentSymbol(selectedSymbol)
  const planNameKey = tipPlatformPlanNameI18nKey(plan)

  const refreshSubscriptionCaches = useCallback(() => {
    invalidateSubscriptionPurchaseQueries(queryClient)
  }, [queryClient])

  const finishCheckoutSuccess = useCallback(() => {
    refreshSubscriptionCaches()
    showToast(t(subscriptionModalKey('paymentSuccess')), 'success')
    onClose()
    onSuccess?.()
  }, [onClose, onSuccess, refreshSubscriptionCaches, showToast, t])

  const handleCardOrderTimeout = useCallback(() => {
    refreshSubscriptionCaches()
    onClose()
    onSuccess?.()
  }, [onClose, onSuccess, refreshSubscriptionCaches])

  const {
    isPolling: isCardOrderPolling,
    beginPolling: beginCardOrderPolling,
    resetPolling: resetCardOrderPolling,
  } = useSubscriptionCardOrderPoll({
    onPaid: finishCheckoutSuccess,
    onTimeout: handleCardOrderTimeout,
  })

  const {
    data: methodsData,
    isLoading: isMethodsLoading,
    isError: isMethodsError,
    error: methodsError,
    refetch: refetchMethods,
  } = useSubscriptionPaymentMethods({
    enabled: isOpen && !isCardPayment,
  })
  const methods = methodsData ?? EMPTY_PAYMENT_METHODS

  const purchaseMutation = usePurchaseSubscription()
  const initializeCardMutation = useInitializeCardPayment()
  const { data: profile } = useProfileSettings({ enabled: isOpen })
  const resolvedBillingDefaults = useMemo(
    () => resolveSubscriptionBillingDefaults(billingDefaults, profile),
    [billingDefaults, profile],
  )

  useCheckoutModalLock({
    open: isOpen,
    onClose,
    locked: purchaseMutation.isPending || isCardOrderPolling,
    closeButtonRef: closeBtnRef,
  })

  useEffect(() => {
    if (isOpen) return
    setSelectedSymbol(null)
    resetCardOrderPolling()
    initializeCardMutation.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on open→closed only
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (selectedSymbol) return
    if (methods.length > 0) {
      setSelectedSymbol(methods[0].symbol)
      return
    }
    if (!isMethodsLoading && !isMethodsError) {
      setSelectedSymbol(PLAN_CARD_PAYMENT_SYMBOL)
    }
  }, [isOpen, methods, isMethodsLoading, isMethodsError, selectedSymbol])

  useEffect(() => {
    if (!isOpen || !isCardPayment) return
    if (initializeCardMutation.data || initializeCardMutation.isPending) return
    initializeCardMutation.mutate(packageId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isCardPayment, packageId])

  const selectedPayment = useMemo(
    () => methods.find((method) => method.symbol === selectedSymbol) ?? null,
    [methods, selectedSymbol],
  )

  const paymentLabel = resolveCheckoutPaymentLabel({
    isCardPayment,
    cardPaymentLabel,
    selectedPayment,
    emptyLabel: BOOKING_HUB_EMPTY_CELL,
  })

  const methodsErrorMessage = resolveTranslatedApiError(
    t,
    methodsError,
    subscriptionModalKey('paymentMethodsError'),
  )

  const handleSelectPayment = (symbol: string) => {
    setSelectedSymbol(symbol)
    if (!isPlanCardPaymentSymbol(symbol)) {
      initializeCardMutation.reset()
    }
  }

  const handleWalletConfirm = () => {
    if (!selectedSymbol || isCardPayment) return
    const method = methods.find((item) => item.symbol === selectedSymbol)
    if (!method) return

    if (!hasEnoughWalletBalance(method, price)) {
      showToast(t(getErrorI18nKey('InsufficientBalance')), 'error')
      return
    }

    purchaseMutation.mutate(
      { packageId, symbol: selectedSymbol },
      {
        onSuccess: (result) => {
          const nextStep = resolveWalletPurchaseNextStep(result)
          if (nextStep === WalletPurchaseNextStep.Failed) {
            showToast(t(subscriptionModalKey('paymentFailed')), 'error')
            return
          }
          if (nextStep === WalletPurchaseNextStep.PollOrder) {
            beginCardOrderPolling(result.orderId)
            return
          }
          finishCheckoutSuccess()
        },
        onError: (err) => {
          showToast(
            resolveTranslatedApiError(t, err, 'errors.unknown_error'),
            'error',
          )
          refreshSubscriptionCaches()
        },
      },
    )
  }

  const handleCardSuccess = () => {
    tryBeginOrderStatusPolling(initializeCardMutation.data?.orderId, beginCardOrderPolling)
  }

  const handleCardError = (message: string) => {
    if (tryBeginOrderStatusPolling(initializeCardMutation.data?.orderId, beginCardOrderPolling)) {
      return
    }
    showToast(message, 'error')
  }

  const canConfirmWallet =
    !isCardPayment
    && Boolean(selectedSymbol)
    && Boolean(selectedPayment)
    && !purchaseMutation.isPending
    && !isMethodsLoading
    && !isMethodsError
    && !isCardOrderPolling

  const canConfirmCard =
    isCardPayment
    && Boolean(initializeCardMutation.data)
    && !initializeCardMutation.isPending
    && !isCardOrderPolling
    && !cardSubmitting

  const canConfirm = isCardPayment ? canConfirmCard : canConfirmWallet
  const isConfirmPending = isCardPayment
    ? cardSubmitting || isCardOrderPolling
    : purchaseMutation.isPending

  const handleConfirm = () => {
    if (isCardPayment) {
      void cardFormRef.current?.submit()
      return
    }
    handleWalletConfirm()
  }

  if (!isOpen) return null

  return (
    <div
      className="sms-credit-modal plan-payment-modal"
      role="presentation"
    >
      <div
        className="sms-credit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={SUBSCRIPTION_PAYMENT_DOM_ID.title}
        aria-describedby={SUBSCRIPTION_PAYMENT_DOM_ID.description}
      >
        <div className="sms-credit-modal-head">
          <div>
            <div className="sms-credit-modal-title" id={SUBSCRIPTION_PAYMENT_DOM_ID.title}>
              <WalletCardsIcon className="marketing-icon" />
              <span>{t(subscriptionModalKey('paymentTitle'))}</span>
            </div>
            <div
              className="sms-credit-modal-sub"
              id={SUBSCRIPTION_PAYMENT_DOM_ID.description}
            >
              {t(subscriptionModalKey('paymentSubtitle'))}
            </div>
          </div>
          <button
            ref={closeBtnRef}
            className="sms-credit-close"
            type="button"
            aria-label={t('common.close')}
            disabled={purchaseMutation.isPending || isCardOrderPolling}
            onClick={onClose}
          >
            <CloseIcon className="marketing-icon is-compact" />
          </button>
        </div>

        <div className="sms-credit-modal-body">
          <section
            className="sms-credit-section"
            aria-labelledby={SUBSCRIPTION_PAYMENT_DOM_ID.methodTitle}
          >
            <div
              className="sms-credit-section-label"
              id={SUBSCRIPTION_PAYMENT_DOM_ID.methodTitle}
            >
              {t(subscriptionModalKey('paymentMethodLabel'))}
            </div>

            {isMethodsLoading && !isCardPayment ? (
              <PlanPaymentMethodsSkeleton />
            ) : (
              <>
                {isMethodsError && !isCardPayment ? (
                  <div className="booking-empty-cell plan-payment-methods-state">
                    <div>{methodsErrorMessage}</div>
                    <button
                      className="booking-mini-button"
                      type="button"
                      onClick={() => void refetchMethods()}
                    >
                      {t(subscriptionModalKey('paymentMethodsRetry'))}
                    </button>
                  </div>
                ) : null}

                {!isMethodsError && methods.length === 0 && !isCardPayment ? (
                  <div className="booking-empty-cell plan-payment-methods-state">
                    {t(subscriptionModalKey('paymentMethodsEmpty'))}
                  </div>
                ) : null}

                <div className="sms-credit-payment-list">
                  {methods.map((method) => {
                    const selected = method.symbol === selectedSymbol
                    return (
                      <button
                        key={method.symbol}
                        className={`sms-credit-payment${selected ? ' is-selected' : ''}`}
                        type="button"
                        aria-pressed={selected}
                        disabled={purchaseMutation.isPending || isCardOrderPolling}
                        onClick={() => handleSelectPayment(method.symbol)}
                      >
                        <span className="sms-credit-payment-main">
                          <span className="sms-credit-radio" aria-hidden="true" />
                          {method.icon ? (
                            <img
                              className="sms-credit-token"
                              src={method.icon}
                              alt=""
                              width={28}
                              height={28}
                              aria-hidden="true"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : null}
                          <span className="sms-credit-payment-name">
                            {method.name || method.symbol}
                          </span>
                        </span>
                        <span className="sms-credit-payment-balance">
                          <span>{t(subscriptionModalKey('walletBalance'))}</span>
                          <strong>{formatWalletBalanceUsd(method)}</strong>
                        </span>
                      </button>
                    )
                  })}

                  <button
                    className={`sms-credit-payment${isCardPayment ? ' is-selected' : ''}`}
                    type="button"
                    aria-pressed={isCardPayment}
                    disabled={purchaseMutation.isPending || isCardOrderPolling}
                    onClick={() => handleSelectPayment(PLAN_CARD_PAYMENT_SYMBOL)}
                  >
                    <span className="sms-credit-payment-main">
                      <span className="sms-credit-radio" aria-hidden="true" />
                      <CreditCardIcon className="marketing-icon sms-credit-card-method-icon" />
                      <span className="sms-credit-payment-name">{cardPaymentLabel}</span>
                    </span>
                  </button>
                </div>

                {isCardPayment ? (
                  <div className="mt-4">
                    {initializeCardMutation.isPending ? (
                      <PlanPaymentMethodsSkeleton />
                    ) : initializeCardMutation.isError ? (
                      <div className="booking-empty-cell plan-payment-methods-state">
                        <div>{t(subscriptionModalKey('cardInitError'))}</div>
                        <button
                          className="booking-mini-button"
                          type="button"
                          onClick={() => initializeCardMutation.mutate(packageId)}
                        >
                          {t(subscriptionModalKey('paymentMethodsRetry'))}
                        </button>
                      </div>
                    ) : initializeCardMutation.data ? (
                      <SubscriptionCardPaymentForm
                        ref={cardFormRef}
                        clientSecret={initializeCardMutation.data.clientSecret}
                        publishableKey={initializeCardMutation.data.publishableKey}
                        billingDefaults={resolvedBillingDefaults}
                        hideFooter
                        onSubmittingChange={setCardSubmitting}
                        onCancel={onClose}
                        onSuccess={handleCardSuccess}
                        onError={handleCardError}
                      />
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </section>

          <section
            className="sms-credit-section sms-credit-invoice"
            aria-labelledby={SUBSCRIPTION_PAYMENT_DOM_ID.invoiceTitle}
          >
            <div
              className="sms-credit-section-label"
              id={SUBSCRIPTION_PAYMENT_DOM_ID.invoiceTitle}
            >
              {t(subscriptionModalKey('invoiceSummary'))}
            </div>
            <div className="sms-credit-invoice-row">
              <span>{t(subscriptionModalKey('servicePlan'))}</span>
              <strong>{t(planNameKey)}</strong>
            </div>
            <div className="sms-credit-invoice-row">
              <span>{t(subscriptionModalKey('invoicePayment'))}</span>
              <strong>{paymentLabel}</strong>
            </div>
            <div className="sms-credit-invoice-row sms-credit-invoice-total">
              <span>{t(subscriptionModalKey('totalDue'))}</span>
              <strong>
                {formatPlanMonthlyTotal(
                  price,
                  ` / ${t(subscriptionModalKey('priceNoteMonth'))}`,
                )}
              </strong>
            </div>
          </section>

          <div className="sr-only" aria-live="polite">
            {isConfirmPending ? t(subscriptionModalKey('cardPaymentProcessing')) : null}
          </div>
        </div>

        <div className="sms-credit-modal-foot">
          <button
            className="btn-outline"
            type="button"
            disabled={purchaseMutation.isPending || cardSubmitting || isCardOrderPolling}
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={!canConfirm || isConfirmPending}
            onClick={handleConfirm}
          >
            {isConfirmPending ? (
              <Loader2 className="marketing-icon is-compact animate-spin" aria-hidden="true" />
            ) : (
              <ShieldCheckIcon className="marketing-icon is-compact" />
            )}
            <span>
              {isConfirmPending
                ? t(subscriptionModalKey('cardPaymentProcessing'))
                : t(subscriptionModalKey('confirmPayment'))}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
