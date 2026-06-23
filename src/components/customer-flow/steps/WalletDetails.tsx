import React from 'react'
import { CheckCircle } from 'lucide-react'
import { WALLET_KEYS } from '../constants'

function getMemberTipAmount(
  memberId: string,
  selectedTips: Record<string, number | string>,
  customTips: Record<string, string>,
): number {
  const selTip = selectedTips[memberId] !== undefined ? selectedTips[memberId] : 15
  return selTip === 'custom' ? Number(customTips[memberId]) || 0 : Number(selTip)
}

function walletAccentColor(walletKey: string): string {
  if (walletKey === WALLET_KEYS.ZELLE) return '#7414CA'
  if (walletKey === WALLET_KEYS.VENMO) return '#008CFF'
  if (walletKey === WALLET_KEYS.CASHAPP) return '#00D632'
  return '#475569'
}

function CopyField({
  label,
  value,
  showToast,
  t,
  valueClassName = 'text-sm font-extrabold text-slate-800',
}: {
  label: string
  value: string
  showToast: (message: string, type: string) => void
  t: (key: string) => string
  valueClassName?: string
}) {
  return (
    <div className="group relative border border-nexoraBorder/80 rounded-xl px-4 py-2.5 bg-nexoraCanvas/10 hover:bg-nexoraCanvas/30 hover:border-nexoraBrand/30 transition-all flex flex-col justify-between min-h-[56px]">
      <span className="text-[10px] font-bold text-nexoraSubtle uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center justify-between mt-1 gap-2">
        <span className={`${valueClassName} break-all select-all`}>
          {value || 'N/A'}
        </span>
        {value ? (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(value)
              showToast(t('common.copied'), 'success')
            }}
            className="text-[10px] font-bold text-nexoraBrand hover:text-nexoraBrand/80 px-2 py-1 rounded bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft transition shrink-0"
          >
            {t('common.copy')}
          </button>
        ) : null}
      </div>
    </div>
  )
}

/**
 * WalletDetails — displays wallet payment info so the customer can
 * complete the tip via their external wallet app, then confirm.
 */
export default function WalletDetails({
  t,
  currentLanguage,
  selectedWalletObj,
  selectedStaffMembers,
  selectedTips,
  customTips,
  bizName,
  activeTipAmount,
  qrCodeVal,
  businessPaymentAccounts,
  tipRefNumber,
  currentTipId,
  showToast,
  handlePay,
  handleConfirmTip,
  isApiMode,
  setStep,
  paymentLinkData,
}) {
  const isMultiStaff = selectedStaffMembers.length > 1
  const accentColor = walletAccentColor(selectedWalletObj.key)

  const apiAccountVal = (() => {
    if (!paymentLinkData) return null
    const key = selectedWalletObj.key
    if (key === WALLET_KEYS.ZELLE) return paymentLinkData.zellePhone || paymentLinkData.zelleEmail || null
    if (key === WALLET_KEYS.APPLECASH) return paymentLinkData.appleCashPhone || null
    if (paymentLinkData.redirectUrl) {
      try {
        const segments = new URL(paymentLinkData.redirectUrl).pathname.split('/').filter(Boolean)
        if (!segments.length) return null
        const handle = segments[segments.length - 1]
        if (key === WALLET_KEYS.VENMO) return handle.startsWith('@') ? handle : `@${handle}`
        if (key === WALLET_KEYS.CASHAPP) return handle.startsWith('$') ? handle : `$${handle}`
        return handle
      } catch {
        return null
      }
    }
    return null
  })()

  const getFieldLabel = () => {
    if (selectedWalletObj.key === WALLET_KEYS.ZELLE) return t('components.customer_flow.steps.WalletDetails.emailPhone')
    if (selectedWalletObj.key === WALLET_KEYS.VENMO) return t('components.customer_flow.steps.WalletDetails.venmoUsername')
    if (selectedWalletObj.key === WALLET_KEYS.CASHAPP) return t('components.customer_flow.steps.WalletDetails.cashTag')
    if (selectedWalletObj.key === WALLET_KEYS.PAYPAL) return t('components.customer_flow.steps.WalletDetails.paypalEmailPhone')
    if (selectedWalletObj.key === WALLET_KEYS.BANKWIRE) return t('components.customer_flow.steps.WalletDetails.bankDetails')
    return t('components.customer_flow.steps.WalletDetails.account')
  }

  const accountVal = isMultiStaff
    ? businessPaymentAccounts?.[selectedWalletObj.key] || null
    : (selectedStaffMembers[0]?.paymentAccounts?.[selectedWalletObj.key] || apiAccountVal)

  const noteText = isMultiStaff
    ? (currentTipId ? `TIP-${String(currentTipId).slice(0, 8).toUpperCase()}` : `TIP-NEXORA-${tipRefNumber}`)
    : `TIP-${selectedStaffMembers[0].nickname.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${tipRefNumber}`

  const recipientName = isMultiStaff
    ? bizName
    : selectedStaffMembers[0].nickname

  const recipientFullName = isMultiStaff
    ? bizName
    : selectedStaffMembers[0].fullName

  const title = isMultiStaff
    ? t('components.customer_flow.steps.WalletDetails.multiStaffTitle', { wallet: selectedWalletObj.name })
    : t('components.customer_flow.steps.WalletDetails.singleStaffTitle', { wallet: selectedWalletObj.name })

  const subtitle = isMultiStaff
    ? t('components.customer_flow.steps.WalletDetails.multiStaffSubtitle', { business: bizName || recipientName })
    : (() => {
      const params = { recipient: recipientName }
      if (selectedWalletObj.key === WALLET_KEYS.ZELLE) return t('components.customer_flow.steps.WalletDetails.singleStaffSubtitle_zelle', params)
      if (selectedWalletObj.key === WALLET_KEYS.VENMO) return t('components.customer_flow.steps.WalletDetails.singleStaffSubtitle_venmo', params)
      if (selectedWalletObj.key === WALLET_KEYS.CASHAPP) return t('components.customer_flow.steps.WalletDetails.singleStaffSubtitle_cashapp', params)
      return t('components.customer_flow.steps.WalletDetails.singleStaffSubtitle_default', params)
    })()

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center space-y-1">
        <h3 className="font-extrabold text-xl text-nexoraText">
          {title}
        </h3>
        <p className="text-xs text-nexoraSubtle font-medium leading-relaxed">
          {subtitle}
        </p>
      </div>

      <div className="bg-white border border-nexoraBorder rounded-2xl p-6 shadow-sm space-y-5 flex flex-col items-center relative overflow-hidden">
        <div
          className="absolute -top-12 -left-12 w-24 h-24 rounded-full opacity-10 filter blur-xl"
          style={{ backgroundColor: accentColor }}
        />
        <div
          className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full opacity-10 filter blur-xl"
          style={{ backgroundColor: accentColor }}
        />

        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-md scale-105 transform transition duration-300 hover:rotate-3 ${selectedWalletObj.color}`}>
          <span className="scale-[1.5]">
            {selectedWalletObj.logo}
          </span>
        </div>

        <div className="text-center space-y-1">
          <div
            className="text-4xl font-black tracking-tight"
            style={{ color: accentColor }}
          >
            ${activeTipAmount.toFixed(2)}
          </div>
          <p className="text-[10px] text-nexoraSubtle font-semibold tracking-wider uppercase">
            {isMultiStaff
              ? t('components.customer_flow.steps.WalletDetails.totalCombinedTip')
              : t('components.customer_flow.steps.WalletDetails.tipAmount')}
          </p>
          {isMultiStaff ? (
            <p className="text-[10px] text-nexoraMuted font-semibold">
              {t('components.customer_flow.steps.TipAmount.provider_count', {
                count: selectedStaffMembers.length,
              })}
            </p>
          ) : null}
        </div>

        {isMultiStaff ? (
          <div className="w-full space-y-2">
            <p className="text-[10px] font-bold text-nexoraSubtle uppercase tracking-wider px-1">
              {t('components.customer_flow.steps.WalletDetails.tipBreakdown')}
            </p>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {selectedStaffMembers.map((member) => {
                const amount = getMemberTipAmount(member.id, selectedTips, customTips)
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 p-3 bg-nexoraCanvas/30 border border-nexoraBorder/70 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover border border-nexoraBorder shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-nexoraElectric to-nexoraViolet text-[10px] font-black text-white shrink-0">
                          {member.nickname.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-nexoraText truncate">{member.nickname}</p>
                        {member.position ? (
                          <p className="text-[10px] text-nexoraSubtle truncate">{member.position}</p>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-sm font-black text-nexoraText shrink-0">${amount.toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {qrCodeVal ? (
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-nexoraBorder/60 rounded-xl my-2 max-w-[200px] animate-fadeIn">
            <img
              src={qrCodeVal}
              alt={`${selectedWalletObj.name} QR Code`}
              className="h-32 w-32 object-contain rounded shadow-sm"
            />
            <p className="text-[9px] text-nexoraSubtle font-bold mt-2 text-center uppercase tracking-wider">
              {t('components.customer_flow.steps.WalletDetails.scanToPay')}
            </p>
          </div>
        ) : null}

        <div className="w-full border-t border-dashed border-nexoraBorder/60 my-1" />

        <div className="w-full space-y-3.5">
          <CopyField
            label={isMultiStaff
              ? t('components.customer_flow.steps.WalletDetails.businessName')
              : t('components.customer_flow.steps.WalletDetails.name')}
            value={recipientFullName}
            showToast={showToast}
            t={t}
          />

          <CopyField
            label={getFieldLabel()}
            value={accountVal || ''}
            showToast={showToast}
            t={t}
          />

          <CopyField
            label={t('components.customer_flow.steps.WalletDetails.noteRequired')}
            value={noteText}
            showToast={showToast}
            t={t}
            valueClassName="text-sm font-black text-red-600 font-mono tracking-wide"
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => isApiMode ? handleConfirmTip() : handlePay(selectedWalletObj.name)}
          className="w-full py-4 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-95 active:scale-[0.99] transition-all text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-nexoraElectric/25 flex items-center justify-center gap-1.5"
        >
          <CheckCircle className="h-5 w-5" />
          {t('components.customer_flow.steps.WalletDetails.yesISentThe')}
        </button>

        <button
          type="button"
          onClick={() => setStep('tip_amount')}
          className="w-full py-3 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraMuted font-extrabold text-xs uppercase tracking-wider rounded-xl"
        >
          {t('components.customer_flow.steps.WalletDetails.goBack')}
        </button>
      </div>
    </div>
  )
}
