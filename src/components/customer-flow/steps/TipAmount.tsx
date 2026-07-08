import React from 'react'
import { getWalletOptions } from './Payment'

const QUICK_TIP_AMOUNTS = [5, 10, 15, 20, 30]

function resolveStaffTipAmount(memberId, selectedTips, customTips) {
  const selTip = selectedTips[memberId] !== undefined ? selectedTips[memberId] : 15
  return selTip === 'custom' ? Number(customTips[memberId]) || 0 : Number(selTip)
}

export default function TipAmount({
  t,
  selectedStaffMembers,
  selectedTips,
  setSelectedTips,
  customTips,
  setCustomTips,
  activeTipAmount,
  initialStaffMember,
  setStep,
  availablePaymentWalletKeys,
  isPaymentMethodsLoading,
  multiStaffPaymentBlocked,
  setSelectedWalletObj,
  setSelectedWallet,
  setTipRefNumber,
  isApiMode,
  handlePay,
  paymentMode = false,
}) {
  const walletOptions = getWalletOptions(availablePaymentWalletKeys)
  const staffTipRows = selectedStaffMembers.map((member) => ({
    member,
    amount: resolveStaffTipAmount(member.id, selectedTips, customTips),
  }))

  const hasInvalidAmount = staffTipRows.some(({ amount }) => Number.isNaN(amount) || amount < 0)
  const isTotalInvalid = activeTipAmount < 1
  const disablePaymentSelection = hasInvalidAmount || isTotalInvalid

  const handleSelectWallet = (wallet) => {
    if (disablePaymentSelection) return

    setSelectedWalletObj(wallet)
    setSelectedWallet(wallet.name)
    setTipRefNumber(Math.floor(1000 + Math.random() * 9000).toString())

    if (isApiMode && typeof handlePay === 'function') {
      handlePay(wallet.name, wallet.key)
    } else {
      setStep('wallet_details')
    }
  }

  const canEditTips = typeof setSelectedTips === 'function' && typeof setCustomTips === 'function'

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="text-center space-y-1.5">
        <h2 className="font-sans text-lg font-black tracking-wide text-nexoraText uppercase">
          {paymentMode
            ? t('direct_payment.review_payment_title')
            : t('customer.tip_review_payment_title')}
        </h2>
      </div>

      <div className="overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-sm">
        <div className="divide-y divide-nexoraBorder/70">
          {staffTipRows.map(({ member, amount }) => {
            const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
            const custTip = customTips[member.id] || ''
            return (
              <div key={member.id} className="px-3.5 py-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover border border-nexoraBorder shrink-0"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-nexoraElectric to-nexoraViolet text-xs font-black text-white shrink-0 shadow-sm">
                        {member.nickname?.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="truncate text-xs font-extrabold text-nexoraText">
                        {member.fullName || member.nickname}
                      </h4>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-nexoraSubtle">
                        {member.position}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-sm font-black text-nexoraBrand">
                    ${amount.toFixed(2)}
                  </div>
                </div>

                {canEditTips && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-nexoraSubtle uppercase tracking-wider">
                      {t('customer.inline_tip_label')}
                    </p>
                    <div className="grid grid-cols-6 gap-1.5">
                      {QUICK_TIP_AMOUNTS.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSelectedTips({ ...selectedTips, [member.id]: val })}
                          className={`py-1.5 rounded-lg text-[11px] font-black transition-all ${
                            selTip === val
                              ? 'bg-nexoraBrand text-white shadow shadow-nexoraBrand/30'
                              : 'bg-nexoraCanvas hover:bg-slate-50 text-nexoraText border border-nexoraBorder/60'
                          }`}
                        >
                          ${val}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTips({ ...selectedTips, [member.id]: 'custom' })
                          if (!customTips[member.id]) {
                            setCustomTips({ ...customTips, [member.id]: '' })
                          }
                        }}
                        className={`py-1.5 rounded-lg text-[11px] font-black transition-all ${
                          selTip === 'custom'
                            ? 'bg-nexoraBrand text-white shadow shadow-nexoraBrand/30'
                            : 'bg-nexoraCanvas hover:bg-slate-50 text-nexoraText border border-nexoraBorder/60'
                        }`}
                      >
                        {t('customer.custom_tip_btn')}
                      </button>
                    </div>
                    {selTip === 'custom' && (
                      <div>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-extrabold text-nexoraSubtle">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder={t('components.customer_flow.steps.TipAmount.phAmount')}
                            className={`w-full bg-white border ${amount < 1 && custTip !== '' ? 'border-red-500 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand'} rounded-lg pl-7 pr-3 py-2 text-xs font-extrabold text-nexoraText focus:outline-none transition-all`}
                            value={custTip}
                            onChange={(e) => setCustomTips({ ...customTips, [member.id]: e.target.value })}
                          />
                        </div>
                        {amount < 1 && custTip !== '' && (
                          <div className="mt-1.5 text-red-500 text-[10px] font-semibold pl-1">
                            {t('components.customer_flow.steps.TipAmount.minTipErr')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between border-t border-nexoraBrandSoft bg-nexoraBrandSoft/35 px-3.5 py-3">
          <div>
            <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
              {paymentMode
                ? t('direct_payment.total_payment')
                : t('components.customer_flow.steps.TipAmount.totalTip')}
            </h4>
            <p className="mt-0.5 text-[10px] font-semibold text-nexoraMuted">
              {t('components.customer_flow.steps.TipAmount.provider_count', { count: selectedStaffMembers.length })}
            </p>
          </div>
          <div className="text-lg font-black text-nexoraBrand">
            ${activeTipAmount.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {isPaymentMethodsLoading && walletOptions.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <div className="h-8 w-8 border-4 border-nexoraBrand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-nexoraMuted font-medium">{t('common.loading')}</p>
          </div>
        ) : null}

        {walletOptions.map((wallet) => (
          <button
            key={wallet.key}
            type="button"
            disabled={disablePaymentSelection}
            onClick={() => handleSelectWallet(wallet)}
            className="flex w-full items-center justify-between rounded-xl border border-nexoraBorder bg-white p-3 text-sm font-bold text-nexoraText shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${wallet.color}`}>
                {wallet.logo}
              </span>
              <span>{wallet.name}</span>
            </div>
            <span className="text-xs text-nexoraSubtle font-medium">{t('customer.choose_chevron')}</span>
          </button>
        ))}

        {!isPaymentMethodsLoading && walletOptions.length === 0 ? (
          <div className="rounded-xl border border-nexoraBorder bg-nexoraCanvas/70 px-4 py-3 text-center">
            <p className="text-sm font-bold text-nexoraText">
              {multiStaffPaymentBlocked === 'missing_business'
                ? t('customer.multi_staff_missing_business')
                : multiStaffPaymentBlocked === 'missing_payment_methods'
                  ? t('customer.multi_staff_missing_payment_method')
                  : t('customer.payment_empty_title')}
            </p>
            {multiStaffPaymentBlocked ? null : (
              <p className="mt-1 text-xs leading-relaxed text-nexoraMuted">{t('customer.payment_empty_desc')}</p>
            )}
          </div>
        ) : null}
      </div>

      {!initialStaffMember && (
        <button
          type="button"
          onClick={() => setStep('select_staff')}
          className="w-full py-3 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraMuted font-extrabold text-xs uppercase tracking-wider rounded-xl"
        >
          {t('common.back')}
        </button>
      )}
    </div>
  )
}
