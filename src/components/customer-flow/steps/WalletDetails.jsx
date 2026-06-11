import React from 'react'
import { CheckCircle } from 'lucide-react'

/**
 * WalletDetails — displays wallet payment info so the customer can
 * complete the tip via their external wallet app, then confirm.
 *
 * @param {object}   props
 * @param {Function} props.t                       - Translation function
 * @param {string}   props.currentLanguage          - Active language code
 * @param {object}   props.selectedWalletObj         - Wallet descriptor (key, name, logo, color)
 * @param {Array}    props.selectedStaffMembers      - Currently selected staff
 * @param {string}   props.bizName                   - Business display name
 * @param {number}   props.activeTipAmount            - Computed tip total
 * @param {string|null} props.qrCodeVal              - QR code image URL (if available)
 * @param {object}   props.businessPaymentAccounts   - Business-level payment accounts
 * @param {string}   props.tipRefNumber              - Tip reference number
 * @param {Function} props.showToast                 - Toast notification helper
 * @param {Function} props.handlePay                 - Handler for simulation payment
 * @param {Function} props.handleConfirmTip          - Handler to confirm tip in API mode
 * @param {boolean}  props.isApiMode                 - Whether the flow is in API mode
 * @param {Function} props.setStep                   - Step navigation setter
 */
export default function WalletDetails({
  t,
  currentLanguage,
  selectedWalletObj,
  selectedStaffMembers,
  bizName,
  activeTipAmount,
  qrCodeVal,
  businessPaymentAccounts,
  tipRefNumber,
  showToast,
  handlePay,
  handleConfirmTip,
  isApiMode,
  setStep,
  paymentLinkData,
}) {
  /**
   * API mode: derive the receiving account identifier from the
   * GET /touch/payment-link response (redirectUrl / zelle / apple cash fields).
   */
  const apiAccountVal = (() => {
    if (!paymentLinkData) return null
    const key = selectedWalletObj.key
    if (key === 'zelle') return paymentLinkData.zellePhone || paymentLinkData.zelleEmail || null
    if (key === 'applecash') return paymentLinkData.appleCashPhone || null
    if (paymentLinkData.redirectUrl) {
      try {
        const segments = new URL(paymentLinkData.redirectUrl).pathname.split('/').filter(Boolean)
        if (!segments.length) return null
        const handle = segments[segments.length - 1]
        if (key === 'venmo') return handle.startsWith('@') ? handle : `@${handle}`
        if (key === 'cashapp') return handle.startsWith('$') ? handle : `$${handle}`
        return handle
      } catch {
        return null
      }
    }
    return null
  })()
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center space-y-1">
        <h3 className="font-extrabold text-xl text-nexoraText">
          {currentLanguage === 'vi'
            ? `Gửi tiền Tip qua ${selectedWalletObj.name}`
            : `Send Tip via ${selectedWalletObj.name}`}
        </h3>
        <p className="text-xs text-nexoraSubtle font-medium leading-relaxed">
          {(() => {
            const recipientName = selectedStaffMembers.length === 1
              ? selectedStaffMembers[0].nickname
              : bizName;

            if (currentLanguage === 'vi') {
              if (selectedWalletObj.key === 'zelle') return `Mở ứng dụng ngân hàng của bạn và gửi tới ${recipientName}.`;
              if (selectedWalletObj.key === 'venmo') return `Mở ứng dụng Venmo và gửi tới ${recipientName}.`;
              if (selectedWalletObj.key === 'cashapp') return `Mở ứng dụng Cash App và gửi tới ${recipientName}.`;
              return `Mở ứng dụng ví và gửi tới ${recipientName}.`;
            } else {
              if (selectedWalletObj.key === 'zelle') return `Open your bank app and send to ${recipientName}.`;
              if (selectedWalletObj.key === 'venmo') return `Open your Venmo app and send to ${recipientName}.`;
              if (selectedWalletObj.key === 'cashapp') return `Open your Cash App and send to ${recipientName}.`;
              return `Open your wallet app and send to ${recipientName}.`;
            }
          })()}
        </p>
      </div>

      <div className="bg-white border border-nexoraBorder rounded-2xl p-6 shadow-sm space-y-5 flex flex-col items-center relative overflow-hidden">
        <div
          className="absolute -top-12 -left-12 w-24 h-24 rounded-full opacity-10 filter blur-xl"
          style={{ backgroundColor: selectedWalletObj.key === 'zelle' ? '#7414CA' : selectedWalletObj.key === 'venmo' ? '#008CFF' : selectedWalletObj.key === 'cashapp' ? '#00D632' : '#475569' }}
        />
        <div
          className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full opacity-10 filter blur-xl"
          style={{ backgroundColor: selectedWalletObj.key === 'zelle' ? '#7414CA' : selectedWalletObj.key === 'venmo' ? '#008CFF' : selectedWalletObj.key === 'cashapp' ? '#00D632' : '#475569' }}
        />

        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-md scale-105 transform transition duration-300 hover:rotate-3 ${selectedWalletObj.color}`}>
          <span className="scale-[1.5]">
            {selectedWalletObj.logo}
          </span>
        </div>

        <div className="text-center space-y-1">
          <div
            className="text-4xl font-black tracking-tight"
            style={{
              color: selectedWalletObj.key === 'zelle'
                ? '#7414CA'
                : selectedWalletObj.key === 'venmo'
                  ? '#008CFF'
                  : selectedWalletObj.key === 'cashapp'
                    ? '#00D632'
                    : '#1E293B'
            }}
          >
            ${activeTipAmount.toFixed(2)}
          </div>
          <p className="text-[10px] text-nexoraSubtle font-semibold tracking-wider uppercase">
            {t('components.customer_flow.steps.WalletDetails.tipAmount')}
          </p>
        </div>

        {/* QR Code (if available) */}
        {qrCodeVal && (
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
        )}

        <div className="w-full border-t border-dashed border-nexoraBorder/60 my-1" />

        <div className="w-full space-y-3.5">
          {/* Name Field */}
          <div className="group relative border border-nexoraBorder/80 rounded-xl px-4 py-2.5 bg-nexoraCanvas/10 hover:bg-nexoraCanvas/30 hover:border-nexoraBrand/30 transition-all flex flex-col justify-between min-h-[56px]">
            <span className="text-[10px] font-bold text-nexoraSubtle uppercase tracking-wider">
              {t('components.customer_flow.steps.WalletDetails.name')}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-extrabold text-slate-800">
                {selectedStaffMembers.length === 1
                  ? selectedStaffMembers[0].fullName
                  : bizName}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nameText = selectedStaffMembers.length === 1
                    ? selectedStaffMembers[0].fullName
                    : bizName;
                  navigator.clipboard.writeText(nameText);
                  showToast(t('common.copied'), 'success');
                }}
                className="text-[10px] font-bold text-nexoraBrand hover:text-nexoraBrand/80 px-2 py-1 rounded bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft transition"
              >
                {t('common.copy')}
              </button>
            </div>
          </div>

          {/* Account Field */}
          {(() => {
            const accountVal = (selectedStaffMembers.length === 1
              ? selectedStaffMembers[0].paymentAccounts?.[selectedWalletObj.key]
              : businessPaymentAccounts?.[selectedWalletObj.key]) || apiAccountVal;

            const getFieldLabel = () => {
              if (selectedWalletObj.key === 'zelle') return t('components.customer_flow.steps.WalletDetails.emailPhone');
              if (selectedWalletObj.key === 'venmo') return t('components.customer_flow.steps.WalletDetails.venmoUsername');
              if (selectedWalletObj.key === 'cashapp') return t('components.customer_flow.steps.WalletDetails.cashTag');
              if (selectedWalletObj.key === 'paypal') return t('components.customer_flow.steps.WalletDetails.paypalEmailPhone');
              if (selectedWalletObj.key === 'bankwire') return t('components.customer_flow.steps.WalletDetails.bankDetails');
              return t('components.customer_flow.steps.WalletDetails.account');
            };

            return (
              <div className="group relative border border-nexoraBorder/80 rounded-xl px-4 py-2.5 bg-nexoraCanvas/10 hover:bg-nexoraCanvas/30 hover:border-nexoraBrand/30 transition-all flex flex-col justify-between min-h-[56px]">
                <span className="text-[10px] font-bold text-nexoraSubtle uppercase tracking-wider">
                  {getFieldLabel()}
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-extrabold text-slate-800 break-all select-all">
                    {accountVal || 'N/A'}
                  </span>
                  {accountVal && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(accountVal);
                        showToast(t('common.copied'), 'success');
                      }}
                      className="text-[10px] font-bold text-nexoraBrand hover:text-nexoraBrand/80 px-2 py-1 rounded bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft transition"
                    >
                      {t('common.copy')}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Reference Note Field */}
          {(() => {
            const noteText = selectedStaffMembers.length === 1
              ? `TIP-${selectedStaffMembers[0].nickname.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${tipRefNumber}`
              : `TIP-NEXORA-${tipRefNumber}`;

            return (
              <div className="group relative border border-nexoraBorder/80 rounded-xl px-4 py-2.5 bg-nexoraCanvas/10 hover:bg-nexoraCanvas/30 hover:border-nexoraBrand/30 transition-all flex flex-col justify-between min-h-[56px]">
                <span className="text-[10px] font-bold text-nexoraSubtle uppercase tracking-wider">
                  {t('components.customer_flow.steps.WalletDetails.noteRequired')}
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-black text-red-600 font-mono tracking-wide">
                    {noteText}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(noteText);
                      showToast(t('common.copied'), 'success');
                    }}
                    className="text-[10px] font-bold text-nexoraBrand hover:text-nexoraBrand/80 px-2 py-1 rounded bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft transition"
                  >
                    {t('common.copy')}
                  </button>
                </div>
              </div>
            );
          })()}
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
          onClick={() => setStep('payment')}
          className="w-full py-3 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraMuted font-extrabold text-xs uppercase tracking-wider rounded-xl"
        >
          {t('components.customer_flow.steps.WalletDetails.goBack')}
        </button>
      </div>
    </div>
  )
}
