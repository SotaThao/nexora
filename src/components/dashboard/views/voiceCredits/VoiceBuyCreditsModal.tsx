import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  CloseIcon,
  PhoneIncomingIcon,
  ShieldCheckIcon,
} from '../BookingHubIcons'
import CreditPaymentMethodList from '../creditCheckout/CreditPaymentMethodList'
import { useCheckoutModalLock } from '../creditCheckout/useCheckoutModalLock'
import {
  SMS_CREDIT_PACKAGE_SELECTED_MARK,
  formatSmsCreditPrice,
  getSmsCreditNumberLocale,
  getSmsCreditPaymentLabel,
} from '../smsCampaigns/constants'
import {
  VOICE_CREDIT_DEFAULT_PACKAGE_ID,
  VOICE_CREDIT_DEFAULT_PAYMENT_ID,
  VOICE_CREDIT_PACKAGES_MOCK,
  VOICE_CREDIT_PAYMENTS_MOCK,
  type VoiceCreditPackageMock,
  type VoiceCreditPaymentMock,
} from './constants'

const TK = 'components.dashboard.views.BookingHubView.plans.credits'

type Props = {
  open: boolean
  submitting?: boolean
  preserveBodyLock?: boolean
  onClose: () => void
  /** Reserved for when Voice credit purchase checkout is enabled. */
  onConfirm?: (pkg: VoiceCreditPackageMock, payment: VoiceCreditPaymentMock) => void | Promise<void>
}

export default function VoiceBuyCreditsModal({
  open,
  submitting = false,
  preserveBodyLock = false,
  onClose,
}: Props) {
  const { t, currentLanguage } = useTranslation()
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const [packageId, setPackageId] = useState(VOICE_CREDIT_DEFAULT_PACKAGE_ID)
  const [paymentId, setPaymentId] = useState(VOICE_CREDIT_DEFAULT_PAYMENT_ID)

  useCheckoutModalLock({
    open,
    onClose,
    locked: submitting,
    preserveBodyLock,
    closeButtonRef: closeBtnRef,
  })

  useEffect(() => {
    if (!open) return
    setPackageId(VOICE_CREDIT_DEFAULT_PACKAGE_ID)
    setPaymentId(VOICE_CREDIT_DEFAULT_PAYMENT_ID)
  }, [open])

  const numberLocale = getSmsCreditNumberLocale(currentLanguage)

  const selectedPackage = useMemo(
    () =>
      VOICE_CREDIT_PACKAGES_MOCK.find((pkg) => pkg.id === packageId)
      ?? VOICE_CREDIT_PACKAGES_MOCK[0],
    [packageId],
  )
  const selectedPayment = useMemo(
    () =>
      VOICE_CREDIT_PAYMENTS_MOCK.find((method) => method.id === paymentId)
      ?? VOICE_CREDIT_PAYMENTS_MOCK[0],
    [paymentId],
  )

  const paymentLabel = getSmsCreditPaymentLabel(selectedPayment, '')

  if (!open) return null

  return (
    <div className="sms-credit-modal" role="presentation" data-voice-credit-modal>
      <div
        className="sms-credit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-credit-modal-title"
        aria-describedby="voice-credit-modal-description"
        aria-busy={submitting}
      >
        <div className="sms-credit-modal-head">
          <div>
            <div className="sms-credit-modal-title" id="voice-credit-modal-title">
              <PhoneIncomingIcon className="marketing-icon" />
              <span>{t(`${TK}.buyVoiceModalTitle`)}</span>
            </div>
            <div className="sms-credit-modal-sub" id="voice-credit-modal-description">
              {t(`${TK}.buyVoiceModalSubtitle`)}
            </div>
          </div>
          <button
            ref={closeBtnRef}
            className="sms-credit-close"
            type="button"
            aria-label={t(`${TK}.closeBuyVoiceModal`)}
            disabled={submitting}
            onClick={onClose}
          >
            <CloseIcon className="marketing-icon is-compact" />
          </button>
        </div>

        <div className="sms-credit-modal-body">
          <section className="sms-credit-section" aria-labelledby="voice-credit-package-title">
            <div className="sms-credit-section-label" id="voice-credit-package-title">
              {t(`${TK}.chooseVoicePackage`)}
            </div>
            <div className="sms-credit-package-grid">
              {VOICE_CREDIT_PACKAGES_MOCK.map((pkg) => {
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
                    {pkg.featured ? (
                      <span className="sms-credit-package-badge">{t(`${TK}.bestValue`)}</span>
                    ) : null}
                    <span className="sms-credit-package-name">{t(`${TK}.${pkg.nameKey}`)}</span>
                    <span className="sms-credit-package-amount">
                      {t(`${TK}.packageMinutes`, {
                        count: pkg.minutes.toLocaleString(numberLocale),
                      })}
                    </span>
                    <span className="sms-credit-package-price">
                      {formatSmsCreditPrice(pkg.price)}
                    </span>
                    <span className="sms-credit-package-note">{t(`${TK}.${pkg.noteKey}`)}</span>
                    <span className="sms-credit-package-check" aria-hidden="true">
                      {SMS_CREDIT_PACKAGE_SELECTED_MARK}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="sms-credit-section" aria-labelledby="voice-credit-payment-title">
            <div className="sms-credit-section-label" id="voice-credit-payment-title">
              {t(`${TK}.paymentMethod`)}
            </div>
            <CreditPaymentMethodList
              methods={VOICE_CREDIT_PAYMENTS_MOCK}
              selectedId={paymentId}
              disabled={submitting}
              t={t}
              copyTk={TK}
              onSelect={(nextId) => setPaymentId(nextId)}
            />
          </section>

          <section className="sms-credit-section sms-credit-invoice" aria-labelledby="voice-credit-invoice-title">
            <div className="sms-credit-section-label" id="voice-credit-invoice-title">
              {t(`${TK}.invoiceSummary`)}
            </div>
            <div className="sms-credit-invoice-row">
              <span>{t(`${TK}.invoiceVoicePackage`)}</span>
              <strong>
                {t(`${TK}.${selectedPackage.nameKey}`)} ·{' '}
                {t(`${TK}.packageMinutes`, {
                  count: selectedPackage.minutes.toLocaleString(numberLocale),
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
