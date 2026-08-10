import React, { type ReactNode, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { resolveTranslatedApiError } from '../../../../utils/resolveTranslatedApiError'
import SubscriptionCardPaymentForm from '../../modals/SubscriptionCardPaymentForm'
import { subscriptionModalKey } from '../../modals/subscriptionPaymentConstants'
import { CloseIcon, CreditCardIcon, ShieldCheckIcon } from '../BookingHubIcons'
import { PlanPaymentMethodsSkeleton } from '../BookingHubSkeletons'
import { BOOKING_HUB_EMPTY_CELL } from '../bookingHubFormatters'
import { PLAN_CARD_PAYMENT_SYMBOL, formatWalletBalanceUsd } from '../plans/constants'
import { useCheckoutModalLock } from './useCheckoutModalLock'
import {
  getCreditPackageNote,
  useCreditTopUpCheckout,
} from './useCreditTopUpCheckout'
import {
  CREDIT_PACKAGE_SELECTED_MARK,
  formatCreditPrice,
  getCreditNumberLocale,
  type CreditTopUpModalConfig,
} from './constants'

type Props = {
  open: boolean
  config: CreditTopUpModalConfig
  headerIcon: ReactNode
  preserveBodyLock?: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreditTopUpModal({
  open,
  config,
  headerIcon,
  preserveBodyLock = false,
  onClose,
  onSuccess,
}: Props) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const numberLocale = getCreditNumberLocale(currentLanguage)
  const { copyTk, copyKeys, cardCopyTk, domIdPrefix } = config
  const titleId = `${domIdPrefix}-modal-title`
  const descriptionId = `${domIdPrefix}-modal-description`
  const packageTitleId = `${domIdPrefix}-package-title`
  const paymentTitleId = `${domIdPrefix}-payment-title`
  const invoiceTitleId = `${domIdPrefix}-invoice-title`

  const {
    packages,
    methods,
    packagesQuery,
    methodsQuery,
    packageId,
    setPackageId,
    featuredPackageId,
    selectedSymbol,
    handleSelectPayment,
    selectedPackage,
    selectedPayment,
    isCardPayment,
    cardPaymentLabel,
    cardFormRef,
    initializeCardMutation,
    billingDefaults,
    setCardSubmitting,
    isSubmitting,
    canConfirm,
    handleConfirm,
    handleCardSuccess,
    handleCardError,
    retryCardInit,
  } = useCreditTopUpCheckout({
    open,
    packageType: config.packageType,
    copyTk,
    cardCopyTk,
    t,
    onClose,
    onSuccess: (pkg, payment) => {
      showToast(
        t(`${copyTk}.buySuccess`, {
          [config.successUnitsParam]: (pkg.creditUnits ?? 0).toLocaleString(numberLocale),
          payment: payment.name || payment.symbol,
        }),
        'success',
      )
      onSuccess?.()
    },
  })

  useCheckoutModalLock({
    open,
    onClose,
    locked: isSubmitting,
    preserveBodyLock,
    closeButtonRef: closeBtnRef,
  })

  const paymentLabel = isCardPayment
    ? cardPaymentLabel
    : selectedPayment
      ? selectedPayment.name || selectedPayment.symbol
      : BOOKING_HUB_EMPTY_CELL
  const packagesErrorMessage = resolveTranslatedApiError(
    t,
    packagesQuery.error,
    `${copyTk}.packagesError`,
  )
  const methodsErrorMessage = resolveTranslatedApiError(
    t,
    methodsQuery.error,
    `${copyTk}.paymentMethodsError`,
  )

  if (!open) return null

  const overlayProps = config.overlayDataAttr
    ? { [config.overlayDataAttr]: true }
    : {}

  const invoicePackageLabel = (() => {
    if (!selectedPackage) return BOOKING_HUB_EMPTY_CELL
    const unitsLabel = t(`${copyTk}.${copyKeys.packageUnits}`, {
      count: (selectedPackage.creditUnits ?? 0).toLocaleString(numberLocale),
    })
    if (!config.invoiceShowsPackageName) return unitsLabel
    return `${selectedPackage.name} · ${unitsLabel}`
  })()

  return (
    <div
      className="sms-credit-modal"
      role="presentation"
      {...overlayProps}
      onClick={(event) => {
        if (event.target !== event.currentTarget || isSubmitting) return
        onClose()
      }}
    >
      <div
        className="sms-credit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isSubmitting}
      >
        <div className="sms-credit-modal-head">
          <div>
            <div className="sms-credit-modal-title" id={titleId}>
              {headerIcon}
              <span>{t(`${copyTk}.${copyKeys.title}`)}</span>
            </div>
            <div className="sms-credit-modal-sub" id={descriptionId}>
              {t(`${copyTk}.${copyKeys.subtitle}`)}
            </div>
          </div>
          <button
            ref={closeBtnRef}
            className="sms-credit-close"
            type="button"
            aria-label={t(`${copyTk}.${copyKeys.closeAria}`)}
            disabled={isSubmitting}
            onClick={onClose}
          >
            <CloseIcon className="marketing-icon is-compact" />
          </button>
        </div>

        <div className="sms-credit-modal-body">
          <section className="sms-credit-section" aria-labelledby={packageTitleId}>
            <div className="sms-credit-section-label" id={packageTitleId}>
              {t(`${copyTk}.${copyKeys.choosePackage}`)}
            </div>
            {packagesQuery.isLoading ? (
              <PlanPaymentMethodsSkeleton rows={4} />
            ) : packagesQuery.isError ? (
              <div className="booking-empty-cell plan-payment-methods-state">
                <div>{packagesErrorMessage}</div>
                <button
                  className="booking-mini-button"
                  type="button"
                  onClick={() => void packagesQuery.refetch()}
                >
                  {t(`${copyTk}.retry`)}
                </button>
              </div>
            ) : packages.length === 0 ? (
              <div className="booking-empty-cell plan-payment-methods-state">
                {t(`${copyTk}.packagesEmpty`)}
              </div>
            ) : (
              <div className="sms-credit-package-grid">
                {packages.map((pkg) => {
                  const selected = pkg.id === packageId
                  const featured = pkg.id === featuredPackageId
                  const note = getCreditPackageNote(pkg, currentLanguage)
                  const units = (pkg.creditUnits ?? 0).toLocaleString(numberLocale)
                  return (
                    <button
                      key={pkg.id}
                      className={`sms-credit-package${selected ? ' is-selected' : ''}${featured ? ' is-featured' : ''}`}
                      type="button"
                      aria-pressed={selected}
                      disabled={isSubmitting}
                      onClick={() => setPackageId(pkg.id)}
                    >
                      <span className="sms-credit-package-check" aria-hidden="true">
                        {CREDIT_PACKAGE_SELECTED_MARK}
                      </span>
                      {featured ? (
                        <span className="sms-credit-package-badge">
                          {t(`${copyTk}.bestValue`)}
                        </span>
                      ) : null}
                      <span className="sms-credit-package-name">{pkg.name}</span>
                      <span className="sms-credit-package-amount">
                        {t(`${copyTk}.${copyKeys.packageUnits}`, { count: units })}
                      </span>
                      <span className="sms-credit-package-price">
                        {formatCreditPrice(pkg.price ?? 0)}
                      </span>
                      {note ? <span className="sms-credit-package-note">{note}</span> : null}
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <section className="sms-credit-section" aria-labelledby={paymentTitleId}>
            <div className="sms-credit-section-label" id={paymentTitleId}>
              {t(`${copyTk}.paymentMethod`)}
            </div>
            {methodsQuery.isLoading && !isCardPayment ? (
              <PlanPaymentMethodsSkeleton />
            ) : (
              <>
                {methodsQuery.isError && !isCardPayment ? (
                  <div className="booking-empty-cell plan-payment-methods-state">
                    <div>{methodsErrorMessage}</div>
                    <button
                      className="booking-mini-button"
                      type="button"
                      onClick={() => void methodsQuery.refetch()}
                    >
                      {t(`${copyTk}.retry`)}
                    </button>
                  </div>
                ) : null}

                {!methodsQuery.isError && methods.length === 0 && !isCardPayment ? (
                  <div className="booking-empty-cell plan-payment-methods-state">
                    {t(`${copyTk}.paymentMethodsEmpty`)}
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
                        disabled={isSubmitting}
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
                          <span>{t(`${copyTk}.balance`)}</span>
                          <strong>{formatWalletBalanceUsd(method)}</strong>
                        </span>
                      </button>
                    )
                  })}

                  <button
                    className={`sms-credit-payment${isCardPayment ? ' is-selected' : ''}`}
                    type="button"
                    aria-pressed={isCardPayment}
                    disabled={isSubmitting}
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
                          onClick={retryCardInit}
                        >
                          {t(`${copyTk}.retry`)}
                        </button>
                      </div>
                    ) : initializeCardMutation.data ? (
                      <SubscriptionCardPaymentForm
                        ref={cardFormRef}
                        clientSecret={initializeCardMutation.data.clientSecret}
                        publishableKey={initializeCardMutation.data.publishableKey}
                        billingDefaults={billingDefaults}
                        hideFooter
                        placeholderTk={cardCopyTk}
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
            aria-labelledby={invoiceTitleId}
          >
            <div className="sms-credit-section-label" id={invoiceTitleId}>
              {t(`${copyTk}.invoiceSummary`)}
            </div>
            <div className="sms-credit-invoice-row">
              <span>{t(`${copyTk}.${copyKeys.invoicePackage}`)}</span>
              <strong>{invoicePackageLabel}</strong>
            </div>
            <div className="sms-credit-invoice-row">
              <span>{t(`${copyTk}.invoicePayment`)}</span>
              <strong>{paymentLabel}</strong>
            </div>
            <div className="sms-credit-invoice-row sms-credit-invoice-total">
              <span>{t(`${copyTk}.invoiceTotal`)}</span>
              <strong>
                {selectedPackage
                  ? formatCreditPrice(selectedPackage.price ?? 0)
                  : BOOKING_HUB_EMPTY_CELL}
              </strong>
            </div>
          </section>
        </div>

        <div className="sms-credit-modal-foot">
          <button className="btn-outline" type="button" disabled={isSubmitting} onClick={onClose}>
            {t(`${copyTk}.cancel`)}
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {isSubmitting ? (
              <Loader2 className="marketing-icon is-compact animate-spin" aria-hidden="true" />
            ) : (
              <ShieldCheckIcon className="marketing-icon is-compact" />
            )}
            <span>
              {isSubmitting
                ? t(`${copyTk}.confirmPaymentPending`)
                : t(`${copyTk}.confirmPayment`)}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
