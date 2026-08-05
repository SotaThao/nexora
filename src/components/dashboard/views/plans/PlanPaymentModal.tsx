import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import {
  usePurchaseVoiceAiPackage,
  useSubscriptionPaymentMethods,
} from '../../../../data/hooks/useSubscriptionPayments'
import {
  SubscriptionPaymentStatus,
  type SubscriptionPaymentMethod,
} from '../../../../data/repositories/subscriptionPayments'
import { getApiErrorCode, isApiError } from '../../../../types/domain'
import {
  CloseIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '../BookingHubIcons'
import { BOOKING_HUB_EMPTY_CELL } from '../bookingHubFormatters'
import { useCheckoutModalLock } from '../creditCheckout/useCheckoutModalLock'
import { PlanPaymentMethodsSkeleton } from '../BookingHubSkeletons'
import {
  PAID_SERVICE_PLAN_TITLE_KEY,
  formatPlanMonthlyTotal,
  formatWalletBalanceUsd,
  type VoiceAiCheckoutSelection,
} from './constants'

const TK = 'components.dashboard.views.BookingHubView.plans'

type Props = {
  open: boolean
  selection: VoiceAiCheckoutSelection | null
  onClose: () => void
  onSuccess: (selection: VoiceAiCheckoutSelection, payment: SubscriptionPaymentMethod) => void
}

type TranslateFn = (key: string, params?: any) => string

function resolveTranslatedApiError(
  t: TranslateFn,
  error: unknown,
  fallbackKey: string,
): string {
  const fallback = t(fallbackKey)
  if (!isApiError(error)) return fallback
  const i18nKey = getErrorI18nKey(error.errorCode)
  const translated = t(i18nKey)
  if (translated !== i18nKey) return translated
  return error.message || fallback
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

export default function PlanPaymentModal({ open, selection, onClose, onSuccess }: Props) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)

  const isOpen = open && selection != null
  const purchaseMutation = usePurchaseVoiceAiPackage()

  const {
    data: methods = [],
    isLoading: isMethodsLoading,
    isError: isMethodsError,
    error: methodsError,
    refetch: refetchMethods,
  } = useSubscriptionPaymentMethods({ enabled: isOpen })

  useCheckoutModalLock({
    open: isOpen,
    onClose,
    closeButtonRef: closeBtnRef,
  })

  useEffect(() => {
    if (!isOpen) {
      setSelectedSymbol(null)
      return
    }
    if (!selectedSymbol && methods.length > 0) {
      setSelectedSymbol(methods[0].symbol)
    }
  }, [isOpen, methods, selectedSymbol])

  const selectedPayment = useMemo(
    () => methods.find((method) => method.symbol === selectedSymbol) ?? null,
    [methods, selectedSymbol],
  )

  const paymentLabel = selectedPayment
    ? selectedPayment.name || selectedPayment.symbol
    : BOOKING_HUB_EMPTY_CELL
  const planTitleKey = selection ? PAID_SERVICE_PLAN_TITLE_KEY[selection.planId] : null
  const methodsErrorMessage = resolveTranslatedApiError(
    t,
    methodsError,
    `${TK}.planPaymentMethodsError`,
  )
  const canConfirm =
    Boolean(selection?.packageId)
    && Boolean(selectedPayment)
    && !isMethodsLoading
    && !isMethodsError
    && methods.length > 0
    && !purchaseMutation.isPending

  const handleConfirm = () => {
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

  if (!isOpen || !selection || !planTitleKey) return null

  return (
    <div
      className="sms-credit-modal plan-payment-modal"
      role="presentation"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        if (purchaseMutation.isPending) return
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
            disabled={purchaseMutation.isPending}
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
            ) : isMethodsError ? (
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
            ) : (
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
                      onClick={() => setSelectedSymbol(method.symbol)}
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
              </div>
            )}
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
            {t(`${TK}.planPaymentStatus`, {
              plan: selection.planId,
              payment: paymentLabel,
            })}
          </div>
        </div>

        <div className="sms-credit-modal-foot">
          <button
            className="btn-outline"
            type="button"
            disabled={purchaseMutation.isPending}
            onClick={onClose}
          >
            {t(`${TK}.planPaymentCancel`)}
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            <ShieldCheckIcon className="marketing-icon is-compact" />
            <span>
              {purchaseMutation.isPending
                ? t(`${TK}.planPurchaseSubmitting`)
                : t(`${TK}.planConfirm`, { plan: selection.planId })}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
