import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { X, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { useHasStoreSetup } from '../../../data/hooks/useHasStoreSetup'
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
import { formatCurrency } from '../utils'
import { hasEnoughWalletBalance } from '../views/plans/constants'
import { getErrorI18nKey } from '../../../data/errorCodes'
import CompleteStoreSetupCardPrompt from './CompleteStoreSetupCardPrompt'
import SubscriptionCardPaymentForm, {
  type SubscriptionBillingDetails,
  type SubscriptionCardPaymentFormHandle,
} from './SubscriptionCardPaymentForm'
import {
  PURCHASABLE_PLAN_I18N_ID,
  SUBSCRIPTION_PAYMENT_DIALOG_MAX_WIDTH_CLASS,
  SUBSCRIPTION_PAYMENT_MODAL_TK,
  SubscriptionPaymentTab,
  type SubscriptionPaymentTabValue,
  WalletPurchaseNextStep,
  resolveWalletPurchaseNextStep,
  subscriptionModalKey,
  tryBeginOrderStatusPolling,
} from './subscriptionPaymentConstants'
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
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [paymentTab, setPaymentTab] = useState<SubscriptionPaymentTabValue>(
    SubscriptionPaymentTab.Wallet,
  )
  const [cardSubmitting, setCardSubmitting] = useState(false)
  const cardFormRef = useRef<SubscriptionCardPaymentFormHandle | null>(null)

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
    // Webhook may still flip Paid — refresh UI and close so the merchant sees the new plan if active.
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
    refetch: refetchMethods,
  } = useSubscriptionPaymentMethods({
    enabled: isOpen && paymentTab === SubscriptionPaymentTab.Wallet,
  })
  const methods = methodsData ?? EMPTY_PAYMENT_METHODS

  const purchaseMutation = usePurchaseSubscription()
  const initializeCardMutation = useInitializeCardPayment()
  const { hasSetup, isLoading: isSetupLoading, isResolved: isSetupResolved } = useHasStoreSetup({
    enabled: isOpen,
  })
  const { data: profile } = useProfileSettings({ enabled: isOpen })
  const resolvedBillingDefaults = useMemo(
    () => resolveSubscriptionBillingDefaults(billingDefaults, profile),
    [billingDefaults, profile],
  )

  useEffect(() => {
    if (isOpen) return
    setSelectedSymbol(null)
    setPaymentTab(SubscriptionPaymentTab.Wallet)
    resetCardOrderPolling()
    initializeCardMutation.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on open→closed only
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (!selectedSymbol && methods.length > 0) {
      setSelectedSymbol(methods[0].symbol)
    }
  }, [isOpen, methods, selectedSymbol])

  useEffect(() => {
    if (paymentTab !== SubscriptionPaymentTab.Card) return
    if (!isSetupResolved || !hasSetup) return
    if (initializeCardMutation.data || initializeCardMutation.isPending) return
    initializeCardMutation.mutate(packageId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentTab, packageId, hasSetup, isSetupResolved])

  useEffect(() => {
    if (
      paymentTab === SubscriptionPaymentTab.Card
      && isSetupResolved
      && !hasSetup
    ) {
      initializeCardMutation.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentTab, hasSetup, isSetupResolved])

  if (!isOpen) return null

  const isCardTab = paymentTab === SubscriptionPaymentTab.Card
  const modalKey = (suffix: string) => `${SUBSCRIPTION_PAYMENT_MODAL_TK}.${suffix}`
  const planNameKey = `manage_plan.plans.${PURCHASABLE_PLAN_I18N_ID[plan]}.name`

  const handleWalletConfirm = () => {
    if (!selectedSymbol) return
    const selectedPayment = methods.find((method) => method.symbol === selectedSymbol)
    if (!selectedPayment) return

    if (!hasEnoughWalletBalance(selectedPayment, price)) {
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
          // Purchase may have applied before the client saw the error — refresh active plan.
          refreshSubscriptionCaches()
        },
      },
    )
  }

  const handleCardSuccess = () => {
    tryBeginOrderStatusPolling(initializeCardMutation.data?.orderId, beginCardOrderPolling)
  }

  const handleCardError = (message: string) => {
    // Client-side Stripe errors can fire after the bank already authorized —
    // always verify against purchase-history when we have an orderId.
    if (tryBeginOrderStatusPolling(initializeCardMutation.data?.orderId, beginCardOrderPolling)) {
      return
    }
    showToast(message, 'error')
  }

  const canConfirmWallet =
    paymentTab === SubscriptionPaymentTab.Wallet
    && Boolean(selectedSymbol)
    && !purchaseMutation.isPending
    && !isMethodsLoading
    && !isMethodsError

  const canConfirmCard =
    isCardTab
    && hasSetup
    && Boolean(initializeCardMutation.data)
    && !initializeCardMutation.isPending
    && !isCardOrderPolling
    && !cardSubmitting

  const canConfirm = isCardTab ? canConfirmCard : canConfirmWallet
  const isConfirmPending = isCardTab
    ? cardSubmitting || isCardOrderPolling
    : purchaseMutation.isPending

  const handleFooterConfirm = () => {
    if (isCardTab) {
      void cardFormRef.current?.submit()
      return
    }
    handleWalletConfirm()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/55 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-labelledby="subscription-payment-title"
        className={[
          'relative w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-nexoraBorder bg-white p-5 shadow-2xl sm:p-6',
          SUBSCRIPTION_PAYMENT_DIALOG_MAX_WIDTH_CLASS,
        ].join(' ')}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-nexoraMuted transition hover:bg-slate-100 hover:text-nexoraText"
          aria-label={t('common.close')}
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id="subscription-payment-title" className="text-lg font-extrabold text-nexoraText">
          {t(modalKey('subscription_payment_title'))}
        </h2>
        <p className="mt-1 text-xs text-nexoraMuted">
          {t(modalKey('subscription_payment_subtitle'))}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-nexoraSurfaceMuted p-1">
          <button
            type="button"
            onClick={() => setPaymentTab(SubscriptionPaymentTab.Wallet)}
            className={[
              'h-9 rounded-lg text-xs font-bold transition',
              paymentTab === SubscriptionPaymentTab.Wallet
                ? 'bg-white text-nexoraText shadow-sm'
                : 'text-nexoraMuted',
            ].join(' ')}
          >
            {t(modalKey('subscription_payment_tab_wallet'))}
          </button>
          <button
            type="button"
            onClick={() => setPaymentTab(SubscriptionPaymentTab.Card)}
            className={[
              'h-9 rounded-lg text-xs font-bold transition',
              isCardTab ? 'bg-white text-nexoraText shadow-sm' : 'text-nexoraMuted',
            ].join(' ')}
          >
            {t(modalKey('subscription_payment_tab_card'))}
          </button>
        </div>

        {paymentTab === SubscriptionPaymentTab.Wallet ? (
          <div className="mt-3">
            {isMethodsLoading ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-nexoraBorder p-4 text-xs text-nexoraMuted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t(modalKey('subscription_payment_methods_loading'))}
              </div>
            ) : isMethodsError ? (
              <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                <p>{t(modalKey('subscription_payment_methods_error'))}</p>
                <button
                  type="button"
                  onClick={() => refetchMethods()}
                  className="mt-2 font-bold underline"
                >
                  {t(modalKey('subscription_payment_methods_retry'))}
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {methods.map((method) => (
                  <label
                    key={method.symbol}
                    className={[
                      'flex items-center justify-between rounded-xl border p-3 text-sm transition cursor-pointer',
                      selectedSymbol === method.symbol
                        ? 'border-nexoraBrand bg-nexoraBrand/5'
                        : 'border-nexoraBorder hover:border-nexoraBrand/40',
                    ].join(' ')}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="subscription-payment-symbol"
                        checked={selectedSymbol === method.symbol}
                        onChange={() => setSelectedSymbol(method.symbol)}
                        className="h-4 w-4"
                      />
                      {method.icon ? (
                        <img
                          src={method.icon}
                          alt=""
                          className="h-5 w-5 shrink-0 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : null}
                      <span className="font-bold text-nexoraText">{method.symbol}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-[10px] uppercase text-nexoraMuted">
                        {t(subscriptionModalKey('walletBalance'))}
                      </span>
                      <span className="font-bold text-nexoraText">
                        {formatCurrency(method.balance * method.rate)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-nexoraMuted">
            {t(modalKey('subscription_invoice_summary'))}
          </p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-nexoraMuted">{t(modalKey('subscription_service_plan'))}</span>
            <span className="font-bold text-nexoraText">{t(planNameKey)}</span>
          </div>
          <div className="my-3 h-px w-full bg-nexoraBorder" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-nexoraText">
              {t(modalKey('subscription_total_due'))}
            </span>
            <span className="text-lg font-black text-nexoraBrand">
              {formatCurrency(price)}
              <span className="text-xs font-semibold text-nexoraMuted">
                {' / '}
                {t(modalKey('subscription_price_note_month'))}
              </span>
            </span>
          </div>
        </div>

        {isCardTab ? (
          <div className="mt-4">
            {isSetupLoading || !isSetupResolved ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-nexoraBorder p-4 text-xs text-nexoraMuted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t(modalKey('subscription_payment_methods_loading'))}
              </div>
            ) : !hasSetup ? (
              <CompleteStoreSetupCardPrompt onBeforeNavigate={onClose} />
            ) : initializeCardMutation.isPending ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-nexoraBorder p-4 text-xs text-nexoraMuted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t(modalKey('subscription_payment_methods_loading'))}
              </div>
            ) : initializeCardMutation.isError ? (
              <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                <p>{t(subscriptionModalKey('cardInitError'))}</p>
                <button
                  type="button"
                  onClick={() => initializeCardMutation.mutate(packageId)}
                  className="mt-2 font-bold underline"
                >
                  {t(modalKey('subscription_payment_methods_retry'))}
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

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirmPending}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-nexoraBorder bg-white px-4 text-sm font-bold text-nexoraMuted transition hover:bg-slate-50 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleFooterConfirm}
            disabled={!canConfirm || isConfirmPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-sm font-bold text-white transition hover:bg-nexoraBrand/90 disabled:opacity-50"
          >
            {isConfirmPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t(subscriptionModalKey('confirmPayment'))}
          </button>
        </div>
        <div className="sr-only" aria-live="polite">
          {isConfirmPending ? t(subscriptionModalKey('cardPaymentProcessing')) : null}
        </div>
      </div>
    </div>
  )
}
