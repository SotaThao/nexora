import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  CloseIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '../BookingHubIcons'
import CreditCardCheckoutForm from '../creditCheckout/CreditCardCheckoutForm'
import CreditPaymentMethodList from '../creditCheckout/CreditPaymentMethodList'
import { useCheckoutModalLock } from '../creditCheckout/useCheckoutModalLock'
import { useCreditCardForm } from '../creditCheckout/useCreditCardForm'
import {
  SMS_CAMPAIGN_TK,
  SmsCreditPaymentId,
  getSmsCreditPaymentLabel,
  type SmsCreditPaymentMock,
} from '../smsCampaigns/constants'
import {
  PAID_SERVICE_PLAN_TITLE_KEY,
  PLAN_PAYMENT_DEFAULT_METHOD_ID,
  PLAN_PAYMENT_METHODS,
  SERVICE_PLAN_MONTHLY_PRICE,
  formatPlanMonthlyTotal,
  type PaidServicePlanId,
} from './constants'

const TK = 'components.dashboard.views.BookingHubView.plans'
const CARD_TK = SMS_CAMPAIGN_TK

type Props = {
  open: boolean
  plan: PaidServicePlanId | null
  onClose: () => void
  onConfirm: (plan: PaidServicePlanId, payment: SmsCreditPaymentMock) => void
}

export default function PlanPaymentModal({ open, plan, onClose, onConfirm }: Props) {
  const { t } = useTranslation()
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const [paymentId, setPaymentId] = useState(PLAN_PAYMENT_DEFAULT_METHOD_ID)

  const isOpen = open && plan != null
  const isCardPayment = paymentId === SmsCreditPaymentId.Card
  const {
    form: cardFields,
    error: cardError,
    invalidField,
    reset: resetCardForm,
    setField: setCardField,
    registerField,
    validate: validateCardForm,
  } = useCreditCardForm({
    copyTk: CARD_TK,
    t,
    enabled: isCardPayment,
  })

  useCheckoutModalLock({
    open: isOpen,
    onClose,
    closeButtonRef: closeBtnRef,
  })

  useEffect(() => {
    if (!isOpen) return
    setPaymentId(PLAN_PAYMENT_DEFAULT_METHOD_ID)
    resetCardForm()
  }, [isOpen, resetCardForm])

  const selectedPayment = useMemo(
    () =>
      PLAN_PAYMENT_METHODS.find((method) => method.id === paymentId)
      ?? PLAN_PAYMENT_METHODS[0],
    [paymentId],
  )

  const planPrice = plan ? SERVICE_PLAN_MONTHLY_PRICE[plan] : 0
  const paymentLabel = getSmsCreditPaymentLabel(
    selectedPayment,
    t(`${CARD_TK}.cardMethodLabel`),
  )
  const planTitleKey = plan ? PAID_SERVICE_PLAN_TITLE_KEY[plan] : null

  const handlePaymentSelect = (nextPaymentId: SmsCreditPaymentId) => {
    setPaymentId(nextPaymentId)
    if (nextPaymentId !== SmsCreditPaymentId.Card) resetCardForm()
  }

  const handleConfirm = () => {
    if (!plan) return
    if (!validateCardForm()) return
    onConfirm(plan, selectedPayment)
  }

  if (!isOpen || !plan || !planTitleKey) return null

  return (
    <div
      className="sms-credit-modal plan-payment-modal"
      role="presentation"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
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
            aria-label={t(`${TK}.planPaymentClose`, { plan })}
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
            <CreditPaymentMethodList
              methods={PLAN_PAYMENT_METHODS}
              selectedId={paymentId}
              t={t}
              copyTk={CARD_TK}
              onSelect={handlePaymentSelect}
            />
            {isCardPayment ? (
              <CreditCardCheckoutForm
                form={cardFields}
                error={cardError}
                invalidField={invalidField}
                t={t}
                copyTk={CARD_TK}
                registerField={registerField}
                onFieldChange={setCardField}
              />
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
              <strong>{plan}</strong>
            </div>
            <div className="sms-credit-invoice-row">
              <span>{t(`${TK}.planInvoicePayment`)}</span>
              <strong>{paymentLabel}</strong>
            </div>
            <div className="sms-credit-invoice-row sms-credit-invoice-total">
              <span>{t(`${TK}.planInvoiceTotal`)}</span>
              <strong>{formatPlanMonthlyTotal(planPrice)}</strong>
            </div>
          </section>

          <div className="sr-only" aria-live="polite">
            {t(`${TK}.planPaymentStatus`, { plan, payment: paymentLabel })}
          </div>
        </div>

        <div className="sms-credit-modal-foot">
          <button className="btn-outline" type="button" onClick={onClose}>
            {t(`${CARD_TK}.cancel`)}
          </button>
          <button className="btn-primary" type="button" onClick={handleConfirm}>
            <ShieldCheckIcon className="marketing-icon is-compact" />
            <span>{t(`${TK}.planConfirm`, { plan })}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
