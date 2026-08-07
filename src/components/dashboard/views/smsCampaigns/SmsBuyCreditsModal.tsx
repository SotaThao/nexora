import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  CloseIcon,
  ShieldCheckIcon,
  WalletCardsIcon,
} from '../BookingHubIcons'
import CreditCardCheckoutForm from '../creditCheckout/CreditCardCheckoutForm'
import CreditPaymentMethodList from '../creditCheckout/CreditPaymentMethodList'
import { useCheckoutModalLock } from '../creditCheckout/useCheckoutModalLock'
import { useCreditCardForm } from '../creditCheckout/useCreditCardForm'
import {
  SMS_CAMPAIGN_TK,
  SMS_CREDIT_DEFAULT_PACKAGE_ID,
  SMS_CREDIT_DEFAULT_PAYMENT_ID,
  SMS_CREDIT_PACKAGE_SELECTED_MARK,
  SMS_CREDIT_PACKAGES_MOCK,
  SMS_CREDIT_PAYMENTS_MOCK,
  SmsCreditPaymentId,
  formatSmsCreditPrice,
  getSmsCreditNumberLocale,
  getSmsCreditPaymentLabel,
  type SmsCreditPackageMock,
  type SmsCreditPaymentMock,
} from './constants'

const TK = SMS_CAMPAIGN_TK

type Props = {
  open: boolean
  submitting?: boolean
  /** Keep `document.body` scroll lock when this modal closes (e.g. create campaign still open). */
  preserveBodyLock?: boolean
  onClose: () => void
  onConfirm?: (pkg: SmsCreditPackageMock, payment: SmsCreditPaymentMock) => void | Promise<void>
}

export default function SmsBuyCreditsModal({
  open,
  submitting = false,
  preserveBodyLock = false,
  onClose,
  onConfirm,
}: Props) {
  const { t, currentLanguage } = useTranslation()
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const [packageId, setPackageId] = useState(SMS_CREDIT_DEFAULT_PACKAGE_ID)
  const [paymentId, setPaymentId] = useState(SMS_CREDIT_DEFAULT_PAYMENT_ID)
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
    copyTk: TK,
    t,
    enabled: isCardPayment,
  })

  useCheckoutModalLock({
    open,
    onClose,
    locked: submitting,
    preserveBodyLock,
    closeButtonRef: closeBtnRef,
  })

  useEffect(() => {
    if (!open) return
    setPackageId(SMS_CREDIT_DEFAULT_PACKAGE_ID)
    setPaymentId(SMS_CREDIT_DEFAULT_PAYMENT_ID)
    resetCardForm()
  }, [open, resetCardForm])

  const numberLocale = getSmsCreditNumberLocale(currentLanguage)

  const selectedPackage = useMemo(
    () => SMS_CREDIT_PACKAGES_MOCK.find((pkg) => pkg.id === packageId) ?? SMS_CREDIT_PACKAGES_MOCK[0],
    [packageId],
  )
  const selectedPayment = useMemo(
    () => SMS_CREDIT_PAYMENTS_MOCK.find((method) => method.id === paymentId) ?? SMS_CREDIT_PAYMENTS_MOCK[0],
    [paymentId],
  )

  const paymentLabel = getSmsCreditPaymentLabel(
    selectedPayment,
    t(`${TK}.cardMethodLabel`),
  )

  const handlePaymentSelect = (nextPaymentId: SmsCreditPaymentId) => {
    setPaymentId(nextPaymentId)
    if (nextPaymentId !== SmsCreditPaymentId.Card) resetCardForm()
  }

  const handleConfirm = async () => {
    if (submitting || !onConfirm) return
    if (!validateCardForm()) return
    await onConfirm(selectedPackage, selectedPayment)
  }

  if (!open) return null

  return (
    <div
      className="sms-credit-modal"
      role="presentation"
      onClick={(event) => {
        if (event.target !== event.currentTarget || submitting) return
        onClose()
      }}
    >
      <div
        className="sms-credit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sms-credit-modal-title"
        aria-describedby="sms-credit-modal-description"
        aria-busy={submitting}
      >
        <div className="sms-credit-modal-head">
          <div>
            <div className="sms-credit-modal-title" id="sms-credit-modal-title">
              <WalletCardsIcon className="marketing-icon" />
              <span>{t(`${TK}.buyModalTitle`)}</span>
            </div>
            <div className="sms-credit-modal-sub" id="sms-credit-modal-description">
              {t(`${TK}.buyModalSubtitle`)}
            </div>
          </div>
          <button
            ref={closeBtnRef}
            className="sms-credit-close"
            type="button"
            aria-label={t(`${TK}.closeBuyModal`)}
            disabled={submitting}
            onClick={onClose}
          >
            <CloseIcon className="marketing-icon is-compact" />
          </button>
        </div>

        <div className="sms-credit-modal-body">
          <section className="sms-credit-section" aria-labelledby="sms-credit-package-title">
            <div className="sms-credit-section-label" id="sms-credit-package-title">
              {t(`${TK}.choosePackage`)}
            </div>
            <div className="sms-credit-package-grid">
              {SMS_CREDIT_PACKAGES_MOCK.map((pkg) => {
                const selected = pkg.id === packageId
                return (
                  <button
                    key={pkg.id}
                    className={`sms-credit-package${selected ? ' is-selected' : ''}${pkg.featured ? ' is-featured' : ''}`}
                    type="button"
                    aria-pressed={selected}
                    disabled={submitting}
                    onClick={() => setPackageId(pkg.id)}
                  >
                    <span className="sms-credit-package-check" aria-hidden="true">
                      {SMS_CREDIT_PACKAGE_SELECTED_MARK}
                    </span>
                    {pkg.featured ? (
                      <span className="sms-credit-package-badge">{t(`${TK}.bestValue`)}</span>
                    ) : null}
                    <span className="sms-credit-package-name">{t(`${TK}.${pkg.nameKey}`)}</span>
                    <span className="sms-credit-package-amount">
                      {t(`${TK}.packageCredits`, {
                        count: pkg.credits.toLocaleString(numberLocale),
                      })}
                    </span>
                    <span className="sms-credit-package-price">
                      {formatSmsCreditPrice(pkg.price)}
                    </span>
                    <span className="sms-credit-package-note">{t(`${TK}.${pkg.noteKey}`)}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="sms-credit-section" aria-labelledby="sms-credit-payment-title">
            <div className="sms-credit-section-label" id="sms-credit-payment-title">
              {t(`${TK}.paymentMethod`)}
            </div>
            <CreditPaymentMethodList
              methods={SMS_CREDIT_PAYMENTS_MOCK}
              selectedId={paymentId}
              disabled={submitting}
              t={t}
              onSelect={handlePaymentSelect}
            />
            {isCardPayment ? (
              <CreditCardCheckoutForm
                form={cardFields}
                error={cardError}
                invalidField={invalidField}
                disabled={submitting}
                t={t}
                registerField={registerField}
                onFieldChange={setCardField}
              />
            ) : null}
          </section>

          <section
            className="sms-credit-section sms-credit-invoice"
            aria-labelledby="sms-credit-invoice-title"
          >
            <div className="sms-credit-section-label" id="sms-credit-invoice-title">
              {t(`${TK}.invoiceSummary`)}
            </div>
            <div className="sms-credit-invoice-row">
              <span>{t(`${TK}.invoicePackage`)}</span>
              <strong>
                {t(`${TK}.packageCredits`, {
                  count: selectedPackage.credits.toLocaleString(numberLocale),
                })}
              </strong>
            </div>
            <div className="sms-credit-invoice-row">
              <span>{t(`${TK}.invoicePayment`)}</span>
              <strong>{paymentLabel}</strong>
            </div>
            <div className="sms-credit-invoice-row sms-credit-invoice-total">
              <span>{t(`${TK}.invoiceTotal`)}</span>
              <strong>{formatSmsCreditPrice(selectedPackage.price)}</strong>
            </div>
          </section>

          <div className="sr-only" aria-live="polite">
            {t(`${TK}.checkoutStatus`, {
              credits: selectedPackage.credits.toLocaleString(numberLocale),
              payment: paymentLabel,
            })}
          </div>
        </div>

        <div className="sms-credit-modal-foot">
          <button className="btn-outline" type="button" disabled={submitting} onClick={onClose}>
            {t(`${TK}.cancel`)}
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled
            aria-disabled="true"
          >
            <ShieldCheckIcon className="marketing-icon is-compact" />
            <span>{t(`${TK}.confirmPaymentComingSoon`)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
