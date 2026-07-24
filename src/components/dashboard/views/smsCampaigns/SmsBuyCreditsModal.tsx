import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  CloseIcon,
  ShieldCheckIcon,
  WalletCardsIcon,
} from '../BookingHubIcons'
import {
  SMS_CAMPAIGN_TK,
  SMS_CREDIT_PACKAGES_MOCK,
  SMS_CREDIT_PAYMENTS_MOCK,
  SmsCreditPaymentId,
  type SmsCreditPackageMock,
  type SmsCreditPaymentMock,
} from './constants'
import { SmsCreditPackageCode } from '../../../../data/merchantVoice/domain'

const TK = SMS_CAMPAIGN_TK

type Props = {
  open: boolean
  submitting?: boolean
  onClose: () => void
  /** Reserved for when purchase checkout is enabled. */
  onConfirm?: (pkg: SmsCreditPackageMock, payment: SmsCreditPaymentMock) => void | Promise<void>
}

export default function SmsBuyCreditsModal({
  open,
  submitting = false,
  onClose,
}: Props) {
  const { t, currentLanguage } = useTranslation()
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const [packageId, setPackageId] = useState(SmsCreditPackageCode.Sms500)
  const [paymentId, setPaymentId] = useState(SmsCreditPaymentId.Usdv)

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = ''
      return undefined
    }

    document.body.style.overflow = 'hidden'
    setPackageId(SmsCreditPackageCode.Sms500)
    setPaymentId(SmsCreditPaymentId.Usdv)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    requestAnimationFrame(() => closeBtnRef.current?.focus())

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, submitting])

  const numberLocale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US'

  const selectedPackage = useMemo(
    () => SMS_CREDIT_PACKAGES_MOCK.find((pkg) => pkg.id === packageId) ?? SMS_CREDIT_PACKAGES_MOCK[0],
    [packageId],
  )
  const selectedPayment = useMemo(
    () => SMS_CREDIT_PAYMENTS_MOCK.find((method) => method.id === paymentId) ?? SMS_CREDIT_PAYMENTS_MOCK[0],
    [paymentId],
  )

  if (!open) return null

  return (
    <div
      className="sms-credit-modal"
      role="presentation"
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
                    {pkg.featured ? (
                      <span className="sms-credit-package-badge">{t(`${TK}.bestValue`)}</span>
                    ) : null}
                    <span className="sms-credit-package-name">{t(`${TK}.${pkg.nameKey}`)}</span>
                    <span className="sms-credit-package-amount">
                      {t(`${TK}.packageCredits`, {
                        count: pkg.credits.toLocaleString(numberLocale),
                      })}
                    </span>
                    <span className="sms-credit-package-price">${pkg.price}</span>
                    <span className="sms-credit-package-note">{t(`${TK}.${pkg.noteKey}`)}</span>
                    <span className="sms-credit-package-check" aria-hidden="true">✓</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="sms-credit-section" aria-labelledby="sms-credit-payment-title">
            <div className="sms-credit-section-label" id="sms-credit-payment-title">
              {t(`${TK}.paymentMethod`)}
            </div>
            <div className="sms-credit-payment-list">
              {SMS_CREDIT_PAYMENTS_MOCK.map((method) => {
                const selected = method.id === paymentId
                return (
                  <button
                    key={method.id}
                    className={`sms-credit-payment${selected ? ' is-selected' : ''}`}
                    type="button"
                    aria-pressed={selected}
                    disabled={submitting}
                    onClick={() => setPaymentId(method.id)}
                  >
                    <span className="sms-credit-payment-main">
                      <span className="sms-credit-radio" aria-hidden="true" />
                      <img
                        className="sms-credit-token"
                        src={method.asset}
                        alt=""
                        width={28}
                        height={28}
                      />
                      <span className="sms-credit-payment-name">{method.label}</span>
                    </span>
                    <span className="sms-credit-payment-balance">
                      <span>{t(`${TK}.balance`)}</span>
                      <strong>{method.balance}</strong>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="sms-credit-section sms-credit-invoice" aria-labelledby="sms-credit-invoice-title">
            <div className="sms-credit-section-label" id="sms-credit-invoice-title">
              {t(`${TK}.invoiceSummary`)}
            </div>
            <div className="sms-credit-invoice-row">
              <span>{t(`${TK}.invoicePackage`)}</span>
              <strong>
                {t(`${TK}.${selectedPackage.nameKey}`)} ·{' '}
                {t(`${TK}.packageCredits`, {
                  count: selectedPackage.credits.toLocaleString(numberLocale),
                })}
              </strong>
            </div>
            <div className="sms-credit-invoice-row">
              <span>{t(`${TK}.invoicePayment`)}</span>
              <strong>{selectedPayment.label}</strong>
            </div>
            <div className="sms-credit-invoice-row sms-credit-invoice-total">
              <span>{t(`${TK}.invoiceTotal`)}</span>
              <strong>${selectedPackage.price}</strong>
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
