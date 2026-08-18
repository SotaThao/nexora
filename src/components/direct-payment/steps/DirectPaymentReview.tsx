import React, { useEffect, useRef } from 'react'
import { formatUsdAmount } from '../../../utils/currencyInput'
import PaymentTipSection from './PaymentTipSection'

export default function DirectPaymentReview({
  t,
  businessName,
  logoUrl,
  recipientName,
  recipientSubtitle,
  amountRangeHint,
  reviewTitle,
  reviewDesc,
  noMethodsTitle,
  noMethodsDesc,
  customAmount,
  onCustomAmountChange,
  activeAmount,
  walletOptions,
  isLoadingMethods,
  onSelectWallet,
  disablePaymentSelection,
  totalPaymentLabel,
  tip = null,
  tipTotal = 0,
  totalAmount = null,
  perStaffTipAmount = 0,
}) {
  const amountInputRef = useRef(null)
  const name = recipientName || businessName || t('direct_payment.default_business')
  const subtitle = recipientSubtitle === null
    ? null
    : (recipientSubtitle || t('direct_payment.pay_to_business'))
  const rangeHint = amountRangeHint ?? t('direct_payment.amount_range_hint')
  const title = reviewTitle || t('direct_payment.review_payment_title')
  const desc = reviewDesc || t('direct_payment.review_payment_desc')
  const emptyMethodsTitle = noMethodsTitle || t('direct_payment.no_methods_title')
  const emptyMethodsDesc = noMethodsDesc || t('direct_payment.no_methods_desc')
  // Bill + tips — the single amount the customer transfers.
  const payableTotal = Number.isFinite(totalAmount)
    ? totalAmount
    : (activeAmount || 0) + (tipTotal || 0)

  useEffect(() => {
    const input = amountInputRef.current
    if (!input) return
    const frame = window.requestAnimationFrame(() => {
      input.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="text-center space-y-1.5">
        <h2 className="font-sans text-lg font-black tracking-wide text-nexoraText uppercase">
          {title}
        </h2>
        <p className="text-xs text-nexoraMuted">{desc}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-nexoraBorder/70 px-3.5 py-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-10 w-10 rounded-xl object-cover border border-nexoraBorder shrink-0"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-nexoraElectric to-nexoraViolet text-sm font-black text-white shrink-0">
              {(name || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 text-left">
            <h4 className="truncate text-sm font-extrabold text-nexoraText">
              {name}
            </h4>
            {subtitle ? (
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-nexoraSubtle">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2.5 px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-nexoraSubtle">
            {t('direct_payment.amount_label')}
          </p>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-nexoraSubtle">$</span>
            <input
              ref={amountInputRef}
              type="text"
              inputMode="decimal"
              placeholder={t('direct_payment.custom_amount_placeholder')}
              className="h-12 w-full rounded-xl border border-nexoraBorder bg-white py-3 pl-8 pr-3 text-sm font-extrabold text-nexoraText outline-none transition-all focus:border-nexoraBrand"
              value={customAmount}
              onChange={(event) => onCustomAmountChange(event.target.value)}
              aria-label={t('direct_payment.amount_label')}
            />
          </div>
        </div>

        {tip ? (
          <PaymentTipSection t={t} tip={tip} perStaffAmount={perStaffTipAmount} />
        ) : null}

        {tipTotal > 0 ? (
          <div className="space-y-1 border-t border-nexoraBorder/70 px-3.5 py-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-nexoraMuted">
              <span>{t('direct_payment.tip_bill_label')}</span>
              <span>{formatUsdAmount(activeAmount > 0 ? activeAmount : 0)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-nexoraMuted">
              <span>{t('direct_payment.tip_tips_label')}</span>
              <span>{formatUsdAmount(tipTotal)}</span>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-nexoraBrandSoft bg-nexoraBrandSoft/35 px-3.5 py-3">
          <div>
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">
              {totalPaymentLabel || t('direct_payment.total_payment')}
            </h4>
            {rangeHint ? (
              <p className="mt-0.5 text-[10px] font-semibold text-nexoraMuted">
                {rangeHint}
              </p>
            ) : null}
          </div>
          <div className="text-lg font-black text-nexoraBrand">
            {formatUsdAmount(payableTotal > 0 ? payableTotal : 0)}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {isLoadingMethods && walletOptions.length === 0 ? (
          <div className="space-y-3 py-6 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-nexoraBrand border-t-transparent" />
            <p className="text-xs font-medium text-nexoraMuted">{t('common.loading')}</p>
          </div>
        ) : null}

        {walletOptions.map((wallet) => (
          <button
            key={wallet.methodId || wallet.key}
            type="button"
            disabled={disablePaymentSelection}
            onClick={() => onSelectWallet(wallet)}
            className="flex w-full items-center justify-between rounded-xl border border-nexoraBorder bg-white p-3 text-sm font-bold text-nexoraText shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${wallet.color}`}>
                {wallet.logo}
              </span>
              <span>{wallet.name}</span>
            </div>
            <span className="text-xs font-medium text-nexoraSubtle">{t('customer.choose_chevron')}</span>
          </button>
        ))}

        {!isLoadingMethods && walletOptions.length === 0 ? (
          <div className="rounded-xl border border-nexoraBorder bg-nexoraCanvas/70 px-4 py-3 text-center">
            <p className="text-sm font-bold text-nexoraText">{emptyMethodsTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-nexoraMuted">{emptyMethodsDesc}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
