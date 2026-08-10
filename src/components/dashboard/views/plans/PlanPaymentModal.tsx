import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useProfileSettings } from '../../../../data/hooks/useProfileSettings'
import { useSubscriptionCardOrderPoll } from '../../../../data/hooks/useSubscriptionCardOrderPoll'
import {
  useInitializeCardPayment,
  usePurchaseVoiceAiPackage,
  useSubscriptionPaymentMethods,
} from '../../../../data/hooks/useSubscriptionPayments'
import { resolveSubscriptionBillingDefaults } from '../../../../utils/subscriptionBillingDefaults'
import { resolveTranslatedApiError } from '../../../../utils/resolveTranslatedApiError'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  SubscriptionPaymentStatus,
  type SubscriptionPaymentMethod,
} from '../../../../data/repositories/subscriptionPayments'
import SubscriptionCardPaymentForm, {
  type SubscriptionBillingDetails,
  type SubscriptionCardPaymentFormHandle,
} from '../../modals/SubscriptionCardPaymentForm'
import { subscriptionModalKey, tryBeginOrderStatusPolling } from '../../modals/subscriptionPaymentConstants'
import {
  CloseIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '../BookingHubIcons'
import { BOOKING_HUB_EMPTY_CELL } from '../bookingHubFormatters'
import { useCheckoutModalLock } from '../creditCheckout/useCheckoutModalLock'
import { PlanPaymentMethodsSkeleton } from '../BookingHubSkeletons'
import { SMS_CAMPAIGN_TK } from '../smsCampaigns/constants'
import {
  PAID_SERVICE_PLAN_TITLE_KEY,
  PLAN_CARD_PAYMENT_SYMBOL,
  formatPlanMonthlyTotal,
  formatWalletBalanceUsd,
  isPlanCardPaymentSymbol,
  type VoiceAiCheckoutSelection,
} from './constants'

const TK = 'components.dashboard.views.BookingHubView.plans'

/** Stable fallback — `data ?? []` would allocate a new array every render and retrigger effects. */
const EMPTY_PAYMENT_METHODS: SubscriptionPaymentMethod[] = []

type Props = {
  open: boolean
  selection: VoiceAiCheckoutSelection | null
  billingDefaults?: SubscriptionBillingDetails
  onClose: () => void
  onSuccess: (selection: VoiceAiCheckoutSelection, payment: SubscriptionPaymentMethod) => void
}

const PURCHASE_STATUS_TOAST: Partial<
  Record<SubscriptionPaymentStatus, { key: string; type: 'error' | 'info' }>
> = {
  [SubscriptionPaymentStatus.Failed]: {
    key: 'planPurchaseFailed',
    type: 'error',
  },
  [SubscriptionPaymentStatus.Pending]: {
    key: 'planPurchasePending',
    type: 'info',
  },
}

export default function PlanPaymentModal({
  open,
  selection,
  billingDefaults,
  onClose,
  onSuccess,
}: Props) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const cardFormRef = useRef<SubscriptionCardPaymentFormHandle | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [cardSubmitting, setCardSubmitting] = useState(false)

  const isOpen = open && selection != null
  const cardPaymentLabel = t(`${SMS_CAMPAIGN_TK}.cardMethodLabel`)

  const handleCardOrderPaid = useCallback(() => {
    if (!selection) return
    onSuccess(selection, {
      name: cardPaymentLabel,
      symbol: PLAN_CARD_PAYMENT_SYMBOL,
      balance: 0,
      rate: 1,
      icon: '',
    })
    onClose()
  }, [cardPaymentLabel, onClose, onSuccess, selection])

  const handleCardOrderTimeout = useCallback(() => {
    onClose()
  }, [onClose])

  const {
    isPolling: isCardOrderPolling,
    beginPolling: beginCardOrderPolling,
    resetPolling: resetCardOrderPolling,
  } = useSubscriptionCardOrderPoll({
    onPaid: handleCardOrderPaid,
    onTimeout: handleCardOrderTimeout,
  })
  const { data: profile } = useProfileSettings({ enabled: isOpen })
  const resolvedBillingDefaults = useMemo(
    () => resolveSubscriptionBillingDefaults(billingDefaults, profile),
    [billingDefaults, profile],
  )
  const isCardPayment = isPlanCardPaymentSymbol(selectedSymbol)
  const purchaseMutation = usePurchaseVoiceAiPackage()
  const initializeCardMutation = useInitializeCardPayment()

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

  useCheckoutModalLock({
    open: isOpen,
    onClose,
    locked: purchaseMutation.isPending || isCardOrderPolling,
    closeButtonRef: closeBtnRef,
  })

  // Reset local checkout state only when the modal actually closes — calling
  // mutation.reset() on every closed render caused Maximum update depth loops.
  useEffect(() => {
    if (isOpen) return
    setSelectedSymbol(null)
    resetCardOrderPolling()
    initializeCardMutation.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run on open→closed only
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
    if (!isOpen || !isCardPayment || !selection?.packageId) return
    if (initializeCardMutation.data || initializeCardMutation.isPending) return
    initializeCardMutation.mutate(selection.packageId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isCardPayment, selection?.packageId])

  const selectedPayment = useMemo(
    () => methods.find((method) => method.symbol === selectedSymbol) ?? null,
    [methods, selectedSymbol],
  )

  const paymentLabel = isCardPayment
    ? cardPaymentLabel
    : selectedPayment
      ? selectedPayment.name || selectedPayment.symbol
      : BOOKING_HUB_EMPTY_CELL
  const planTitleKey = selection ? PAID_SERVICE_PLAN_TITLE_KEY[selection.planId] : null
  const methodsErrorMessage = resolveTranslatedApiError(
    t,
    methodsError,
    `${TK}.planPaymentMethodsError`,
  )
  const canConfirmWallet =
    Boolean(selection?.packageId)
    && Boolean(selectedPayment)
    && !isCardPayment
    && !isMethodsLoading
    && !isMethodsError
    && methods.length > 0
    && !purchaseMutation.isPending
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

  const handleWalletConfirm = () => {
    if (!selection?.packageId || !selectedPayment) return

    purchaseMutation.mutate(
      { packageId: selection.packageId, symbol: selectedPayment.symbol },
      {
        onSuccess: (result) => {
          const statusToast = PURCHASE_STATUS_TOAST[result.paymentStatus]
          if (statusToast) {
            showToast(t(`${TK}.${statusToast.key}`), statusToast.type)
            if (result.paymentStatus === SubscriptionPaymentStatus.Failed) return
          }
          onSuccess(selection, selectedPayment)
        },
        onError: (err) => {
          showToast(
            resolveTranslatedApiError(t, err, `${TK}.planPurchaseFailed`),
            'error',
          )
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

  const handleConfirm = () => {
    if (isCardPayment) {
      void cardFormRef.current?.submit()
      return
    }
    handleWalletConfirm()
  }

  const handleSelectPayment = (symbol: string) => {
    setSelectedSymbol(symbol)
    if (!isPlanCardPaymentSymbol(symbol)) {
      initializeCardMutation.reset()
    }
  }

  if (!isOpen || !selection || !planTitleKey) return null

  return (
    <div
      className="sms-credit-modal plan-payment-modal"
      role="presentation"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        if (purchaseMutation.isPending || isCardOrderPolling) return
        onClose()
      }}
    >
      <div
        className="sms-credit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-payment-modal-title"
        aria-describedby="plan-payment-modal-description"
      >
        <div className="sms-credit-modal-head">
          <div>
            <div className="sms-credit-modal-title" id="plan-payment-modal-title">
              <SparklesIcon className="marketing-icon" />
              <span>{t(`${TK}.${planTitleKey}`)}</span>
            </div>
            <div className="sms-credit-modal-sub" id="plan-payment-modal-description">
              {t(`${TK}.planPaymentSubtitle`)}
            </div>
          </div>
          <button
            ref={closeBtnRef}
            className="sms-credit-close"
            type="button"
            aria-label={t(`${TK}.planPaymentClose`, { plan: selection.planId })}
            disabled={purchaseMutation.isPending || isCardOrderPolling}
            onClick={onClose}
          >
            <CloseIcon className="marketing-icon is-compact" />
          </button>
        </div>

        <div className="sms-credit-modal-body">
              <section className="sms-credit-section" aria-labelledby="plan-payment-method-title">
                <div className="sms-credit-section-label" id="plan-payment-method-title">
                  {t(`${TK}.planPaymentMethod`)}
                </div>

                {isMethodsLoading ? (
                  <PlanPaymentMethodsSkeleton />
                ) : (
                  <>
                    {isMethodsError ? (
                      <div className="booking-empty-cell plan-payment-methods-state">
                        <div>{methodsErrorMessage}</div>
                        <button
                          className="booking-mini-button"
                          type="button"
                          onClick={() => void refetchMethods()}
                        >
                          {t(`${TK}.planPaymentMethodsRetry`)}
                        </button>
                      </div>
                    ) : methods.length === 0 ? (
                      <div className="booking-empty-cell plan-payment-methods-state">
                        {t(`${TK}.planPaymentMethodsEmpty`)}
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
                          disabled={purchaseMutation.isPending}
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
                            <span>{t(`${TK}.planPaymentBalance`)}</span>
                            <strong>{formatWalletBalanceUsd(method)}</strong>
                          </span>
                        </button>
                      )
                    })}

                    <button
                      className={`sms-credit-payment${isCardPayment ? ' is-selected' : ''}`}
                      type="button"
                      aria-pressed={isCardPayment}
                      disabled={purchaseMutation.isPending}
                      onClick={() => handleSelectPayment(PLAN_CARD_PAYMENT_SYMBOL)}
                    >
                      <span className="sms-credit-payment-main">
                        <span className="sms-credit-radio" aria-hidden="true" />
                        <CreditCardIcon className="marketing-icon sms-credit-card-method-icon" />
                        <span className="sms-credit-payment-name">{cardPaymentLabel}</span>
                      </span>
                    </button>
                    </div>
                  </>
                )}

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
                          onClick={() => {
                            if (selection.packageId) initializeCardMutation.mutate(selection.packageId)
                          }}
                        >
                          {t(`${TK}.planPaymentMethodsRetry`)}
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
              </section>

              <section
                className="sms-credit-section sms-credit-invoice"
                aria-labelledby="plan-payment-invoice-title"
              >
                <div className="sms-credit-section-label" id="plan-payment-invoice-title">
                  {t(`${TK}.planPaymentInvoice`)}
                </div>
                <div className="sms-credit-invoice-row">
                  <span>{t(`${TK}.planInvoicePlan`)}</span>
                  <strong>{selection.name || selection.planId}</strong>
                </div>
                <div className="sms-credit-invoice-row">
                  <span>{t(`${TK}.planInvoicePayment`)}</span>
                  <strong>{paymentLabel}</strong>
                </div>
                <div className="sms-credit-invoice-row sms-credit-invoice-total">
                  <span>{t(`${TK}.planInvoiceTotal`)}</span>
                  <strong>
                    {formatPlanMonthlyTotal(selection.price, t(`${TK}.perMonth`))}
                  </strong>
                </div>
              </section>

              <div className="sr-only" aria-live="polite">
                {isConfirmPending
                  ? t(subscriptionModalKey('cardPaymentProcessing'))
                  : t(`${TK}.planPaymentStatus`, {
                      plan: selection.planId,
                      payment: paymentLabel,
                    })}
              </div>
        </div>

        <div className="sms-credit-modal-foot">
            <button
              className="btn-outline"
              type="button"
              disabled={purchaseMutation.isPending || cardSubmitting}
              onClick={onClose}
            >
              {t(`${TK}.planPaymentCancel`)}
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
                  ? t(`${TK}.planPurchaseSubmitting`)
                  : t(`${TK}.planConfirm`, { plan: selection.planId })}
              </span>
            </button>
          </div>
      </div>
    </div>
  )
}
