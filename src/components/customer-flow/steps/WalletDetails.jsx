import React from 'react'
import { CheckCircle } from 'lucide-react'

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
  setStep,
}) {
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
            {currentLanguage === 'vi' ? 'Số tiền chuyển khoản' : 'Tip Amount'}
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
              {currentLanguage === 'vi' ? 'Quét mã để chuyển khoản' : 'Scan to pay'}
            </p>
          </div>
        )}

        <div className="w-full border-t border-dashed border-nexoraBorder/60 my-1" />

        <div className="w-full space-y-3.5">
          {/* Name Field */}
          <div className="group relative border border-nexoraBorder/80 rounded-xl px-4 py-2.5 bg-nexoraCanvas/10 hover:bg-nexoraCanvas/30 hover:border-nexoraBrand/30 transition-all flex flex-col justify-between min-h-[56px]">
            <span className="text-[10px] font-bold text-nexoraSubtle uppercase tracking-wider">
              {currentLanguage === 'vi' ? 'Tên người nhận' : 'Name'}
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
                  showToast(t('common.copied') || 'Copied!', 'success');
                }}
                className="text-[10px] font-bold text-nexoraBrand hover:text-nexoraBrand/80 px-2 py-1 rounded bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft transition"
              >
                {t('common.copy') || 'Copy'}
              </button>
            </div>
          </div>

          {/* Account Field */}
          {(() => {
            const accountVal = selectedStaffMembers.length === 1
              ? selectedStaffMembers[0].paymentAccounts?.[selectedWalletObj.key]
              : businessPaymentAccounts?.[selectedWalletObj.key];

            const getFieldLabel = () => {
              if (selectedWalletObj.key === 'zelle') return currentLanguage === 'vi' ? 'Email / SĐT' : 'Email/Phone';
              if (selectedWalletObj.key === 'venmo') return currentLanguage === 'vi' ? 'Tài khoản Venmo' : 'Venmo Username';
              if (selectedWalletObj.key === 'cashapp') return currentLanguage === 'vi' ? 'Thẻ Cash App' : 'Cash Tag';
              if (selectedWalletObj.key === 'paypal') return currentLanguage === 'vi' ? 'Tài khoản PayPal' : 'PayPal Email/Phone';
              if (selectedWalletObj.key === 'bankwire') return currentLanguage === 'vi' ? 'Thông tin ngân hàng' : 'Bank details';
              return currentLanguage === 'vi' ? 'Tài khoản nhận' : 'Account';
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
                        showToast(t('common.copied') || 'Copied!', 'success');
                      }}
                      className="text-[10px] font-bold text-nexoraBrand hover:text-nexoraBrand/80 px-2 py-1 rounded bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft transition"
                    >
                      {t('common.copy') || 'Copy'}
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
                  {currentLanguage === 'vi' ? 'Nội dung (Bắt buộc)' : 'Note (Required)'}
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-black text-red-600 font-mono tracking-wide">
                    {noteText}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(noteText);
                      showToast(t('common.copied') || 'Copied!', 'success');
                    }}
                    className="text-[10px] font-bold text-nexoraBrand hover:text-nexoraBrand/80 px-2 py-1 rounded bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft transition"
                  >
                    {t('common.copy') || 'Copy'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Instructional Steps */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3 text-[11px] font-medium text-blue-800 text-center leading-relaxed mt-2">
            {(() => {
              const isVi = currentLanguage === 'vi';
              if (selectedWalletObj.key === 'zelle') {
                return isVi
                  ? '(1) Copy email Zelle · (2) Mở Zelle & chuyển tiền · (3) Sau đó nhấn xác nhận bên dưới'
                  : '(1) Copy Zelle email · (2) Open Zelle & send tip · (3) Then click confirm below';
              }
              if (selectedWalletObj.key === 'venmo') {
                return isVi
                  ? '(1) Copy tên Venmo · (2) Mở Venmo & chuyển tiền · (3) Sau đó nhấn xác nhận bên dưới'
                  : '(1) Copy Venmo name · (2) Open Venmo & send tip · (3) Then click confirm below';
              }
              if (selectedWalletObj.key === 'cashapp') {
                return isVi
                  ? '(1) Copy Cash Tag · (2) Mở Cash App & chuyển tiền · (3) Sau đó nhấn xác nhận bên dưới'
                  : '(1) Copy Cash Tag · (2) Open Cash App & send tip · (3) Then click confirm below';
              }
              if (selectedWalletObj.key === 'applepay' || selectedWalletObj.key === 'apple') {
                return isVi
                  ? '(1) Copy số điện thoại · (2) Mở Apple Cash & chuyển tiền · (3) Sau đó nhấn xác nhận bên dưới'
                  : '(1) Copy phone number · (2) Open Apple Cash & send tip · (3) Then click confirm below';
              }
              if (selectedWalletObj.key === 'paypal') {
                return isVi
                  ? '(1) Copy email PayPal · (2) Mở PayPal & chuyển tiền · (3) Sau đó nhấn xác nhận bên dưới'
                  : '(1) Copy PayPal email · (2) Open PayPal & send tip · (3) Then click confirm below';
              }
              return isVi
                ? '(1) Copy thông tin · (2) Mở ứng dụng & chuyển tiền · (3) Sau đó nhấn xác nhận bên dưới'
                : '(1) Copy details · (2) Open app & send tip · (3) Then click confirm below';
            })()}
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => handlePay(selectedWalletObj.name)}
          className="w-full py-4 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-95 active:scale-[0.99] transition-all text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-[#2B59FF]/25 flex items-center justify-center gap-1.5"
        >
          <CheckCircle className="h-5 w-5" />
          {currentLanguage === 'vi' ? 'Tôi Đã Gửi Tiền Tip' : 'Yes, I Sent The Tip'}
        </button>

        <button
          type="button"
          onClick={() => setStep('payment')}
          className="w-full py-3 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraMuted font-extrabold text-xs uppercase tracking-wider rounded-xl"
        >
          {currentLanguage === 'vi' ? 'Quay Lại' : 'Go Back'}
        </button>
      </div>
    </div>
  )
}
