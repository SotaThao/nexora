import React, { useMemo } from 'react'
import { CheckCircle, Copy, Loader2 } from 'lucide-react'
import { WALLET_KEYS } from '../constants'
import VlinkpayTipPaymentPanel from './VlinkpayTipPaymentPanel'
import {
  emptyVlinkpayAddresses,
  mergeVlinkpayAddresses,
  resolveVlinkpayAddresses,
  type VlinkpayAddresses,
} from '../../payout/vlinkpayWallet'

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

function isPhoneNumber(value: string): boolean {
  return /^[\d\s\-\(\)\+\.]{7,}$/.test(value?.trim() ?? '')
}

function getCopyButtonLabel(walletKey: string, accountVal: string, t: (key: string) => string): string {
  if (walletKey === WALLET_KEYS.VENMO) return t('components.customer_flow.steps.WalletDetails.copyUsername')
  if (walletKey === WALLET_KEYS.CASHAPP) return t('components.customer_flow.steps.WalletDetails.copyCashTag')
  if (isPhoneNumber(accountVal)) return t('components.customer_flow.steps.WalletDetails.copyPhoneNumber')
  return t('components.customer_flow.steps.WalletDetails.copyEmail')
}

function getOpenAppStep(walletKey: string, walletName: string, t: (key: string) => string): string {
  if (walletKey === WALLET_KEYS.ZELLE) return t('components.customer_flow.steps.WalletDetails.stepOpenApp_zelle')
  if (walletKey === WALLET_KEYS.PAYPAL) return t('components.customer_flow.steps.WalletDetails.stepOpenApp_paypal')
  if (walletKey === WALLET_KEYS.VENMO) return t('components.customer_flow.steps.WalletDetails.stepOpenApp_venmo')
  if (walletKey === WALLET_KEYS.CASHAPP) return t('components.customer_flow.steps.WalletDetails.stepOpenApp_cashapp')
  if (walletKey === WALLET_KEYS.APPLECASH) return t('components.customer_flow.steps.WalletDetails.stepOpenApp_applecash')
  return t('components.customer_flow.steps.WalletDetails.stepOpenApp_default')
}

function buildInstructionSteps(
  walletKey: string,
  walletName: string,
  accountVal: string,
  recipientName: string,
  amount: number,
  t: (key: string, params?: Record<string, string | number>) => string,
  paymentMode = false,
): React.ReactNode[] {
  const step1Key = walletKey === WALLET_KEYS.VENMO
    ? 'components.customer_flow.steps.WalletDetails.stepCopyUsername'
    : walletKey === WALLET_KEYS.CASHAPP
      ? 'components.customer_flow.steps.WalletDetails.stepCopyCashTag'
      : isPhoneNumber(accountVal)
        ? 'components.customer_flow.steps.WalletDetails.stepCopyPhone'
        : 'components.customer_flow.steps.WalletDetails.stepCopyEmail'

  const step1Full = t(step1Key, { name: recipientName, wallet: walletName })
  const step3Full = paymentMode
    ? t('components.customer_flow.steps.WalletDetails.stepSendAmountPayment', { amount: amount.toFixed(2), name: recipientName })
    : t('components.customer_flow.steps.WalletDetails.stepSendAmount', { amount: amount.toFixed(2), name: recipientName })
  const step4Full = paymentMode
    ? t('components.customer_flow.steps.WalletDetails.stepConfirmPayment')
    : t('components.customer_flow.steps.WalletDetails.stepConfirm')
  const confirmLabel = paymentMode
    ? t('direct_payment.confirm_sent')
    : t('components.customer_flow.steps.WalletDetails.yesISentTheTip')

  const boldParts = (text: string, bolds: string[]): React.ReactNode => {
    const pattern = new RegExp(`(${bolds.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`)
    return text.split(pattern).map((part, i) =>
      bolds.includes(part) ? <strong key={i}>{part}</strong> : part
    )
  }

  return [
    boldParts(step1Full, [`${recipientName}'s`]),
    getOpenAppStep(walletKey, walletName, t),
    boldParts(step3Full, [`$${amount.toFixed(2)}`, recipientName]),
    boldParts(step4Full, [confirmLabel]),
  ]
}

function CopyField({
  label,
  value,
  showToast,
  t,
  valueClassName = 'text-sm font-extrabold text-slate-800',
  className = '',
  style,
}: {
  label: string
  value: string
  showToast: (message: string, type: string) => void
  t: (key: string) => string
  valueClassName?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`group relative border border-nexoraBorder/80 rounded-xl px-4 py-2.5 bg-nexoraCanvas/10 hover:bg-nexoraCanvas/30 hover:border-nexoraBrand/30 transition-all flex flex-col justify-between min-h-[56px] ${className}`}
      style={style}
    >
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
            className="text-nexoraBrand hover:text-nexoraBrand/80 px-2 py-1.5 rounded bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft transition shrink-0 flex items-center gap-1 text-[10px] font-bold"
          >
            <Copy className="h-3.5 w-3.5" />
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
  businessVlinkpayCryptoAddresses,
  tipRefNumber,
  currentTipId,
  showToast,
  handlePay,
  handleConfirmTip,
  isApiMode,
  setStep,
  paymentLinkData,
  tipPaymentMethodsData,
  backStep = 'tip_amount',
  paymentMode = false,
  paymentCopyScope = 'merchant',
  isConfirming = false,
  isProcessing = false,
  onCreateVlinkpayTip,
  onResetVlinkpayTip,
}) {
  const isMultiStaff = selectedStaffMembers.length > 1
  const accentColor = walletAccentColor(selectedWalletObj.key)

  const getFieldLabel = () => {
    if (selectedWalletObj.key === WALLET_KEYS.ZELLE) return t('components.customer_flow.steps.WalletDetails.emailPhone')
    if (selectedWalletObj.key === WALLET_KEYS.VENMO) return t('components.customer_flow.steps.WalletDetails.venmoUsername')
    if (selectedWalletObj.key === WALLET_KEYS.CASHAPP) return t('components.customer_flow.steps.WalletDetails.cashTag')
    if (selectedWalletObj.key === WALLET_KEYS.PAYPAL) return t('components.customer_flow.steps.WalletDetails.paypalEmailPhone')
    if (selectedWalletObj.key === WALLET_KEYS.BANKWIRE) return t('components.customer_flow.steps.WalletDetails.bankDetails')
    return t('components.customer_flow.steps.WalletDetails.account')
  }

  // Prefer account info from the tip payment methods API response
  const tipApiMethod = (() => {
    if (!Array.isArray(tipPaymentMethodsData) || tipPaymentMethodsData.length === 0) return null
    const walletKey = String(selectedWalletObj.key || '').toLowerCase()
    return tipPaymentMethodsData.find((pm) => {
      const uiKey = String(pm.uiKey || '').toLowerCase()
      const typeKey = String(pm.type || '').toLowerCase().replace(/\s+/g, '')
      return uiKey === walletKey || typeKey === walletKey
    }) || null
  })()
  const tipApiAccountVal = tipApiMethod?.accountInfo || null
  const accountHolderName = tipApiMethod?.accountName || null

  const legacyAccountVal = (() => {
    if (isMultiStaff) return businessPaymentAccounts?.[selectedWalletObj.key] || null
    const staffVal = selectedStaffMembers[0]?.paymentAccounts?.[selectedWalletObj.key] || null
    if (staffVal) return staffVal
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

  const accountVal = tipApiAccountVal || legacyAccountVal

  const noteText = isMultiStaff
    ? (currentTipId ? `TIP-${String(currentTipId).slice(0, 8).toUpperCase()}` : `TIP-NEXORA-${tipRefNumber}`)
    : `TIP-${selectedStaffMembers[0].nickname.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${tipRefNumber}`

  const recipientName = isMultiStaff
    ? bizName
    : selectedStaffMembers[0].nickname

  const isVlinkpay = selectedWalletObj.key === WALLET_KEYS.VLINKPAY
  const vlinkpayAddresses = useMemo(() => {
    if (!isVlinkpay) return null

    const empty = emptyVlinkpayAddresses()

    const fromStaff = !isMultiStaff
      ? resolveVlinkpayAddresses({
          cryptoAddresses: selectedStaffMembers[0]?.vlinkPayCryptoAddresses,
        })
      : empty

    const fromBusiness = resolveVlinkpayAddresses({
      cryptoAddresses: businessVlinkpayCryptoAddresses,
    })

    const fromTip = tipApiMethod
      ? resolveVlinkpayAddresses({
          cryptoAddresses: tipApiMethod.cryptoAddresses,
        })
      : empty

    const linkAddress = paymentLinkData?.cryptoAddress
    const fromLink = linkAddress?.address && linkAddress?.symbol
      ? resolveVlinkpayAddresses({
          cryptoAddresses: [{
            network: linkAddress.network || '',
            symbol: linkAddress.symbol,
            address: linkAddress.address,
          }],
        })
      : empty

    // Prefer real cryptoAddresses only — never raw accountInfo/page URLs.
    return mergeVlinkpayAddresses(fromStaff, fromBusiness, fromTip, fromLink)
  }, [
    isVlinkpay,
    isMultiStaff,
    tipApiMethod,
    selectedStaffMembers,
    businessVlinkpayCryptoAddresses,
    paymentLinkData,
  ])

  const confirmLabel = t(
    paymentMode
      ? 'direct_payment.confirm_sent'
      : 'components.customer_flow.steps.WalletDetails.yesISentTheTip',
  )
  const paySubtitleKey = paymentMode
    ? 'components.customer_flow.steps.WalletDetails.vlinkpayPaySubtitlePayment'
    : 'components.customer_flow.steps.WalletDetails.vlinkpayPaySubtitle'

  if (isVlinkpay && vlinkpayAddresses) {
    return (
      <VlinkpayTipPaymentPanel
        t={t}
        logo={selectedWalletObj.logo}
        amount={activeTipAmount}
        addresses={vlinkpayAddresses}
        showToast={showToast}
        confirmLabel={confirmLabel}
        paySubtitleKey={paySubtitleKey}
        tipReady={Boolean(currentTipId)}
        isCreatingTip={Boolean(isApiMode && isProcessing)}
        isConfirming={Boolean(isApiMode && isConfirming)}
        onConfirmAsset={
          isApiMode && typeof onCreateVlinkpayTip === 'function'
            ? onCreateVlinkpayTip
            : async () => true
        }
        onConfirmSent={() => {
          if (!isApiMode) {
            handlePay(selectedWalletObj.name)
            return
          }
          handleConfirmTip()
        }}
        onChangeAsset={() => {
          if (typeof onResetVlinkpayTip === 'function') onResetVlinkpayTip()
        }}
        onBack={() => setStep(backStep)}
      />
    )
  }

  const accountFieldStyle = {
    backgroundColor: `${accentColor}0D`,
    borderColor: `${accentColor}40`,
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white border border-nexoraBorder rounded-2xl p-6 shadow-sm space-y-5 flex flex-col items-center relative overflow-hidden">
        <div
          className="absolute -top-12 -left-12 w-24 h-24 rounded-full opacity-10 filter blur-xl"
          style={{ backgroundColor: accentColor }}
        />
        <div
          className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full opacity-10 filter blur-xl"
          style={{ backgroundColor: accentColor }}
        />

        <div className="flex items-center justify-center gap-4">
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-md scale-105 transform transition duration-300 hover:rotate-3 ${selectedWalletObj.color}`}>
            <span className="scale-[1.5]">
              {selectedWalletObj.logo}
            </span>
          </div>
          <div className="h-10 w-px bg-nexoraBorder" aria-hidden="true" />
          <div
            className="text-3xl font-black tracking-tight"
            style={{ color: accentColor }}
          >
            ${activeTipAmount.toFixed(2)}
          </div>
        </div>

        {isMultiStaff ? (
          <div className="text-center">
            <p className="text-[10px] text-nexoraMuted font-semibold">
              {t('components.customer_flow.steps.TipAmount.provider_count', {
                count: selectedStaffMembers.length,
              })}
            </p>
          </div>
        ) : null}

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

        <div className="w-full space-y-4">
          <CopyField
            label={t('components.customer_flow.steps.WalletDetails.accountHolder', { wallet: selectedWalletObj.name })}
            value={accountHolderName || recipientName}
            showToast={showToast}
            t={t}
            className="shadow-sm"
            style={accountFieldStyle}
          />

          <CopyField
            label={getFieldLabel()}
            value={accountVal || ''}
            showToast={showToast}
            t={t}
            className="shadow-sm"
            style={accountFieldStyle}
          />

          {accountVal && selectedWalletObj.key !== WALLET_KEYS.BANKWIRE ? (
            <ol className="space-y-2.5 pt-1">
              {buildInstructionSteps(
                selectedWalletObj.key,
                selectedWalletObj.name,
                accountVal,
                recipientName,
                activeTipAmount,
                t,
                paymentMode,
              ).map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-nexoraCanvas border border-nexoraBorder text-nexoraSubtle font-black text-[11px] flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-nexoraText leading-snug pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => isApiMode ? handleConfirmTip() : handlePay(selectedWalletObj.name)}
          disabled={isApiMode && isConfirming}
          className="w-full py-4 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-95 active:scale-[0.99] transition-all text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-nexoraElectric/25 flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
        >
          {isApiMode && isConfirming ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          {t(paymentMode ? 'direct_payment.confirm_sent' : 'components.customer_flow.steps.WalletDetails.yesISentTheTip')}
        </button>

        <button
          type="button"
          onClick={() => setStep(backStep)}
          className="w-full py-3 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraMuted font-extrabold text-xs uppercase tracking-wider rounded-xl"
        >
          {t('components.customer_flow.steps.WalletDetails.goBack')}
        </button>
      </div>
    </div>
  )
}
