import { useEffect, useRef, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { isApiError } from '../../../types/domain'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { formatCurrency } from '../utils'
import {
  useSubscriptionPaymentMethods,
  usePurchaseSubscription,
  useInitializeCardPayment,
  useSubscriptionOrderStatusPoll,
} from '../../../data/hooks/useSubscriptionPayments'
import type { PurchasableSubscriptionPlan } from '../../../data/repositories/subscriptionPayments'
import SubscriptionCardPaymentForm, { type SubscriptionBillingDetails } from './SubscriptionCardPaymentForm'

// Reuses the same i18n keys ManagePlanView renders on the plan cards
// (`manage_plan.plans.<id>.name`), so the plan name shown here always
// matches the card the user clicked — no separate hardcoded label to drift.
const PLAN_ID: Record<PurchasableSubscriptionPlan, string> = {
  Starter: 'starter',
  Pro: 'pro',
}

const ORDER_STATUS_POLL_TIMEOUT_MS = 30_000

type PaymentTab = 'wallet' | 'card'

export default function SubscriptionPaymentModal({
  isOpen,
  plan,
  packageId,
  price,
  billingDefaults,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  plan: PurchasableSubscriptionPlan
  packageId: string
  price: number
  billingDefaults?: SubscriptionBillingDetails
  onClose: () => void
  onSuccess?: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [paymentTab, setPaymentTab] = useState<PaymentTab>('wallet')
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [pollTimedOut, setPollTimedOut] = useState(false)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    data: methods = [],
    isLoading: isMethodsLoading,
    isError: isMethodsError,
    refetch: refetchMethods,
  } = useSubscriptionPaymentMethods({ enabled: isOpen && paymentTab === 'wallet' })

  const purchaseMutation = usePurchaseSubscription()
  const initializeCardMutation = useInitializeCardPayment()
  const orderStatusQuery = useSubscriptionOrderStatusPoll(pendingOrderId, {
    enabled: !!pendingOrderId && !pollTimedOut,
  })

  useEffect(() => {
    if (!isOpen) {
      setSelectedSymbol(null)
      setPaymentTab('wallet')
      setPendingOrderId(null)
      setPollTimedOut(false)
      initializeCardMutation.reset()
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
      return
    }
    if (!selectedSymbol && methods.length > 0) {
      setSelectedSymbol(methods[0].symbol)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, methods, selectedSymbol])

  useEffect(() => {
    if (paymentTab !== 'card' || initializeCardMutation.data || initializeCardMutation.isPending) return
    initializeCardMutation.mutate(packageId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentTab, packageId])

  useEffect(() => {
    if (!pendingOrderId) return
    const status = orderStatusQuery.data?.paymentStatus
    if (status === 'Paid') {
      showToast(t('dashboard.modals.subscription_payment_success'), 'success')
      setPendingOrderId(null)
      onClose()
      onSuccess?.()
    } else if (status === 'Failed') {
      showToast(t('dashboard.modals.subscription_card_payment_error'), 'error')
      setPendingOrderId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOrderId, orderStatusQuery.data?.paymentStatus])

  useEffect(() => {
    if (!pendingOrderId) return
    pollTimeoutRef.current = setTimeout(() => setPollTimedOut(true), ORDER_STATUS_POLL_TIMEOUT_MS)
    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
    }
  }, [pendingOrderId])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!selectedSymbol) return
    purchaseMutation.mutate(
      { packageId, symbol: selectedSymbol },
      {
        onSuccess: () => {
          showToast(t('dashboard.modals.subscription_payment_success'), 'success')
          onClose()
          onSuccess?.()
        },
        onError: (err) => {
          const fallback = t('errors.unknown_error')
          let message = fallback
          if (isApiError(err)) {
            const i18nKey = getErrorI18nKey(err.errorCode)
            const translated = t(i18nKey)
            message = translated !== i18nKey ? translated : (err.message || fallback)
          }
          showToast(message, 'error')
        },
      },
    )
  }

  const handleCardSuccess = () => {
    if (!initializeCardMutation.data) return
    setPollTimedOut(false)
    setPendingOrderId(initializeCardMutation.data.orderId)
  }

  const handleCardError = (message: string) => {
    showToast(message, 'error')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/55 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-labelledby="subscription-payment-title"
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-nexoraBorder bg-white p-5 shadow-2xl sm:p-6"
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
          {t('dashboard.modals.subscription_payment_title')}
        </h2>
        <p className="mt-1 text-xs text-nexoraMuted">
          {t('dashboard.modals.subscription_payment_subtitle')}
        </p>

        {pendingOrderId ? (
          <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-nexoraBorder p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
            <p className="text-sm font-bold text-nexoraText">
              {t('dashboard.modals.subscription_card_payment_processing')}
            </p>
            {pollTimedOut && (
              <p className="text-xs text-nexoraMuted">
                {t('dashboard.modals.subscription_card_payment_processing_timeout')}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setPendingOrderId(null)
                onClose()
              }}
              className="mt-1 text-xs font-bold text-nexoraMuted underline"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-nexoraSurfaceMuted p-1">
              <button
                type="button"
                onClick={() => setPaymentTab('wallet')}
                className={[
                  'h-9 rounded-lg text-xs font-bold transition',
                  paymentTab === 'wallet' ? 'bg-white text-nexoraText shadow-sm' : 'text-nexoraMuted',
                ].join(' ')}
              >
                {t('dashboard.modals.subscription_payment_tab_wallet')}
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab('card')}
                className={[
                  'h-9 rounded-lg text-xs font-bold transition',
                  paymentTab === 'card' ? 'bg-white text-nexoraText shadow-sm' : 'text-nexoraMuted',
                ].join(' ')}
              >
                {t('dashboard.modals.subscription_payment_tab_card')}
              </button>
            </div>

            {paymentTab === 'wallet' ? (
              <div className="mt-3">
                {isMethodsLoading ? (
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-nexoraBorder p-4 text-xs text-nexoraMuted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('dashboard.modals.subscription_payment_methods_loading')}
                  </div>
                ) : isMethodsError ? (
                  <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                    <p>{t('dashboard.modals.subscription_payment_methods_error')}</p>
                    <button
                      type="button"
                      onClick={() => refetchMethods()}
                      className="mt-2 font-bold underline"
                    >
                      {t('dashboard.modals.subscription_payment_methods_retry')}
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
                          <span className="block text-[10px] uppercase text-nexoraMuted">balance</span>
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
                {t('dashboard.modals.subscription_invoice_summary')}
              </p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-nexoraMuted">{t('dashboard.modals.subscription_service_plan')}</span>
                <span className="font-bold text-nexoraText">{t(`manage_plan.plans.${PLAN_ID[plan]}.name`)}</span>
              </div>
              <div className="my-3 h-px w-full bg-nexoraBorder" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-nexoraText">
                  {t('dashboard.modals.subscription_total_due')}
                </span>
                <span className="text-lg font-black text-nexoraBrand">
                  {formatCurrency(price)}
                  <span className="text-xs font-semibold text-nexoraMuted">
                    {' / '}
                    {t('dashboard.modals.subscription_price_note_month')}
                  </span>
                </span>
              </div>
            </div>

            {paymentTab === 'card' && (
              <div className="mt-4">
                {initializeCardMutation.isPending ? (
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-nexoraBorder p-4 text-xs text-nexoraMuted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('dashboard.modals.subscription_payment_methods_loading')}
                  </div>
                ) : initializeCardMutation.isError ? (
                  <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                    <p>{t('dashboard.modals.subscription_card_init_error')}</p>
                    <button
                      type="button"
                      onClick={() => initializeCardMutation.mutate(packageId)}
                      className="mt-2 font-bold underline"
                    >
                      {t('dashboard.modals.subscription_payment_methods_retry')}
                    </button>
                  </div>
                ) : initializeCardMutation.data ? (
                  <SubscriptionCardPaymentForm
                    clientSecret={initializeCardMutation.data.clientSecret}
                    publishableKey={initializeCardMutation.data.publishableKey}
                    billingDefaults={billingDefaults}
                    onCancel={onClose}
                    onSuccess={handleCardSuccess}
                    onError={handleCardError}
                  />
                ) : null}
              </div>
            )}

            {paymentTab === 'wallet' && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={purchaseMutation.isPending}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-nexoraBorder bg-white px-4 text-sm font-bold text-nexoraMuted transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!selectedSymbol || purchaseMutation.isPending || isMethodsLoading || isMethodsError}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-sm font-bold text-white transition hover:bg-nexoraBrand/90 disabled:opacity-50"
                >
                  {purchaseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t('dashboard.modals.subscription_confirm_payment')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
