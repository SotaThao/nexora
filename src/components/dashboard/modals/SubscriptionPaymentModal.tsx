import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { isApiError } from '../../../types/domain'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { formatCurrency } from '../utils'
import {
  useSubscriptionPaymentMethods,
  usePurchaseSubscription,
} from '../../../data/hooks/useSubscriptionPayments'
import type { PurchasableSubscriptionPlan } from '../../../data/repositories/subscriptionPayments'

// Reuses the same i18n keys ManagePlanView renders on the plan cards
// (`manage_plan.plans.<id>.name`), so the plan name shown here always
// matches the card the user clicked — no separate hardcoded label to drift.
const PLAN_ID: Record<PurchasableSubscriptionPlan, string> = {
  Starter: 'starter',
  Pro: 'pro',
}

export default function SubscriptionPaymentModal({
  isOpen,
  plan,
  price,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  plan: PurchasableSubscriptionPlan
  price: number
  onClose: () => void
  onSuccess?: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)

  const {
    data: methods = [],
    isLoading: isMethodsLoading,
    isError: isMethodsError,
    refetch: refetchMethods,
  } = useSubscriptionPaymentMethods({ enabled: isOpen })

  const purchaseMutation = usePurchaseSubscription()

  useEffect(() => {
    if (!isOpen) {
      setSelectedSymbol(null)
      return
    }
    if (!selectedSymbol && methods.length > 0) {
      setSelectedSymbol(methods[0].symbol)
    }
  }, [isOpen, methods, selectedSymbol])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!selectedSymbol) return
    purchaseMutation.mutate(
      { plan, symbol: selectedSymbol },
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

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/55 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-labelledby="subscription-payment-title"
        className="relative w-full max-w-md rounded-2xl border border-nexoraBorder bg-white p-5 shadow-2xl sm:p-6"
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

        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-nexoraMuted">
            {t('dashboard.modals.subscription_payment_method_label')}
          </p>

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
      </div>
    </div>
  )
}
