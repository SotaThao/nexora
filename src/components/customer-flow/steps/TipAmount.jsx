import React, { useState, useEffect } from 'react'
import { ArrowRight, Star, Copy, Users } from 'lucide-react'

const WalletLogos = {
  venmo: (
    <svg viewBox="0 0 448 512" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z" />
    </svg>
  ),
  cashapp: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.59 3.475a5.1 5.1 0 00-3.05-3.05c-1.31-.42-2.5-.42-4.92-.42H8.36c-2.4 0-3.61 0-4.9.4a5.1 5.1 0 00-3.05 3.06C0 4.765 0 5.965 0 8.365v7.27c0 2.41 0 3.6.4 4.9a5.1 5.1 0 003.05 3.05c1.3.41 2.5.41 4.9.41h7.28c2.41 0 3.61 0 4.9-.4a5.1 5.1 0 003.06-3.06c.41-1.3.41-2.5.41-4.9v-7.25c0-2.41 0-3.61-.41-4.91zm-6.17 4.63l-.93.93a.5.5 0 01-.67.01 5 5 0 00-3.22-1.18c-.97 0-1.94.32-1.94 1.21 0 .9 1.04 1.2 2.24 1.65 2.1.7 3.84 1.58 3.84 3.64 0 2.24-1.74 3.78-4.58 3.95l-.26 1.2a.49.49 0 01-.48.39H9.63l-.09-.01a.5.5 0 01-.38-.59l.28-1.27a6.54 6.54 0 01-2.88-1.57v-.01a.48.48 0 010-.68l1-.97a.49.49 0 01.67 0c.91.86 2.13 1.34 3.39 1.32 1.3 0 2.17-.55 2.17-1.42 0-.87-.88-1.1-2.54-1.72-1.76-.63-3.43-1.52-3.43-3.6 0-2.42 2.01-3.6 4.39-3.71l.25-1.23a.48.48 0 01.48-.38h1.78l.1.01c.26.06.43.31.37.57l-.27 1.37c.9.3 1.75.77 2.48 1.39l.02.02c.19.2.19.5 0 .68z" />
    </svg>
  ),
  zelle: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z" />
    </svg>
  ),
  paypal: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.09 6.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H6.22c-.65 0-1.13-.59-.99-1.22L8.53 5.4c.14-.63.7-.1 1.33-.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" />
      <path d="M16.92 3.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H3.06c-.65 0-1.13-.59-.99-1.22L5.37 2.4c.14-.63.7-1.1 1.33-1.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" opacity="0.6" />
    </svg>
  ),
  bankwire: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L1 7v2h22V7L12 2zm0 18H3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h-3zm-11 2h22v2H1v-2z" />
    </svg>
  ),
  applepay: (
    <div className="flex items-center gap-[1px] justify-center scale-90 origin-center shrink-0">
      <svg viewBox="0 0 170 170" className="h-[12px] w-[12px] fill-current text-white shrink-0" xmlns="http://www.w3.org/2000/svg">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.22-9.13-1.78-14.37-6.02-3.43-2.73-7.25-7.28-11.45-13.68-4.73-7.24-8.55-15.53-11.45-24.85-2.9-9.33-4.35-18.21-4.35-26.65 0-14.93 3.94-27.17 11.83-36.73 7.89-9.55 17.58-14.39 29.08-14.5 5.8-.11 11.9 1.67 18.3 5.35 6.4 3.68 11.13 5.52 14.18 5.52 2.34 0 6.81-1.67 13.43-5.02 6.62-3.34 12.52-4.85 17.68-4.52 13.25.67 23.95 5.57 32.09 14.72-11.48 6.91-17.11 16.28-16.89 28.1.22 9.58 3.84 17.6 10.87 24.08 7.02 6.47 15.21 9.94 24.57 10.42-2.12 6.13-4.68 12.26-7.69 18.38zM119.22 35.24c0-7.8-2.79-15.01-8.36-21.62C105.3 7 98 3.32 89.17 3.32c-.11.9-.11 1.78.11 2.68.22 5.58 2.51 11.23 6.85 16.94 4.35 5.71 9.76 9.47 16.23 11.3 1.34-5.36 6.86-9 6.86-9z"/>
      </svg>
      <span className="font-black text-[10px] tracking-tighter ml-[1px] leading-none select-none">Pay</span>
    </div>
  ),
  vlinkpay: (
    <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY" className="w-[28px] h-[28px] object-contain" />
  ),
}

export default function TipAmount({
  t,
  currentLanguage,
  tipScreenTitle,
  selectedStaffMembers,
  selectedTips,
  setSelectedTips,
  customTips,
  setCustomTips,
  activeTipAmount,
  initialStaffMember,
  setStep,
  selectedStaffHasAnyPayment,
  businessPaymentAccounts,
  selectedWalletObj,
  setSelectedWalletObj,
  setSelectedWallet,
  setTipRefNumber,
  bizName,
  qrCodeVal,
  tipRefNumber,
  showToast,
  handlePay,
}) {
  const isMulti = selectedStaffMembers.length > 1;
  const [tipMode, setTipMode] = useState('combine'); // 'combine' | 'split'
  const [combineTip, setCombineTip] = useState(15);
  const [combineCustom, setCombineCustom] = useState('');

  // Handle initialization for single staff
  useEffect(() => {
    if (!isMulti && selectedTips[selectedStaffMembers[0]?.id] === undefined) {
      setSelectedTips({ [selectedStaffMembers[0]?.id]: 15 });
    }
  }, [isMulti, selectedStaffMembers, selectedTips, setSelectedTips]);

  // When combineTip changes, distribute evenly to selectedTips
  useEffect(() => {
    if (isMulti && tipMode === 'combine') {
      const newTips = {};
      const newCustomTips = {};
      let totalAmount = 0;

      if (combineTip === 'custom') {
        totalAmount = parseFloat(combineCustom) || 0;
      } else {
        totalAmount = combineTip;
      }

      const splitAmount = totalAmount / selectedStaffMembers.length;

      selectedStaffMembers.forEach(m => {
        newTips[m.id] = 'custom';
        // Remove trailing zeros (e.g. 5.00 -> 5, 2.50 -> 2.5)
        newCustomTips[m.id] = parseFloat(splitAmount.toFixed(2)).toString();
      });
      setSelectedTips(newTips);
      setCustomTips(newCustomTips);
    }
  }, [tipMode, combineTip, combineCustom, isMulti, selectedStaffMembers, setSelectedTips, setCustomTips]);

  const renderSingleOrCombineBody = () => {
    const activeVal = isMulti ? combineTip : selectedTips[selectedStaffMembers[0]?.id];
    
    return (
      <>
        {/* Quick Tips */}
        <div className={`grid grid-cols-4 gap-1.5 mb-2.5`}>
          {(isMulti ? [10, 20, 30, 40] : [5, 10, 15, 20]).map(val => (
            <button
              key={val}
              type="button"
              onClick={() => {
                if (isMulti) {
                  setCombineTip(val);
                  setCombineCustom('');
                } else {
                  setSelectedTips({ ...selectedTips, [selectedStaffMembers[0].id]: val });
                  setCustomTips({ ...customTips, [selectedStaffMembers[0].id]: '' });
                }
              }}
              className={`py-1.5 rounded-lg border-2 text-[14px] font-semibold transition-all duration-150 ${
                activeVal === val
                  ? 'bg-nexoraBrand text-white border-nexoraBrand'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              ${val}
            </button>
          ))}
        </div>

        {/* Custom Input Field */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">$</span>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            placeholder="0"
            value={isMulti 
              ? (combineTip === 'custom' ? combineCustom : combineTip)
              : (selectedTips[selectedStaffMembers[0]?.id] === 'custom' ? (customTips[selectedStaffMembers[0]?.id] || '') : selectedTips[selectedStaffMembers[0]?.id])}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '');
              if (isMulti) {
                setCombineTip('custom');
                setCombineCustom(val);
              } else {
                setSelectedTips({ ...selectedTips, [selectedStaffMembers[0].id]: 'custom' });
                setCustomTips({ ...customTips, [selectedStaffMembers[0].id]: val });
              }
            }}
            className="w-full text-center pl-8 pr-3 py-2.5 text-2xl font-bold text-slate-800 bg-white border-2 border-slate-200 focus:border-nexoraBrand rounded-lg focus:outline-none transition-all placeholder-slate-200"
          />
          {isMulti && tipMode === 'combine' && activeTipAmount > 0 && (
            <div className="absolute -bottom-5 left-0 right-0 text-center text-[10px] font-bold text-nexoraBrand">
              = ${(activeTipAmount / selectedStaffMembers.length).toFixed(2)} / {currentLanguage === 'vi' ? 'người' : 'person'}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSplitBody = () => {
    const isScrollable = selectedStaffMembers.length >= 4;
    return (
      <div className="flex flex-col bg-white border border-nexoraBorder rounded-[16px] shadow-sm mb-3 overflow-hidden">
        <div className={`flex flex-col gap-0 pt-1 pb-1 ${isScrollable ? 'max-h-[220px] overflow-y-auto no-scrollbar' : ''}`}>
          {selectedStaffMembers.map((member, index) => {
            const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 5;
            const custTip = customTips[member.id] || '';
            const isDense = selectedStaffMembers.length >= 3;
            return (
              <div key={member.id} className={`flex items-center gap-2 w-full px-3 py-2 ${index !== selectedStaffMembers.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className={`flex items-center gap-2 ${isDense ? 'w-[70px]' : 'w-[85px]'} shrink-0`}>
                  {member.avatar ? (
                    <img src={member.avatar} alt="" className={`${isDense ? 'h-6 w-6 rounded-full' : 'h-8 w-8 rounded-[10px]'} object-cover border border-nexoraBorder shrink-0`} />
                  ) : (
                    <div className={`flex ${isDense ? 'h-6 w-6 rounded-full text-[10px]' : 'h-8 w-8 rounded-[10px] text-[13px]'} items-center justify-center bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] font-extrabold text-white shrink-0`}>
                      {member.nickname.charAt(0)}
                    </div>
                  )}
                  <span className={`font-bold text-nexoraText ${isDense ? 'text-[11px]' : 'text-[12px]'} truncate`}>{member.nickname}</span>
                </div>

                <div className={`flex items-center flex-1 justify-end ${isDense ? 'gap-1' : 'gap-1.5'}`}>
                  {[5, 10, 15, 20].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setSelectedTips({ ...selectedTips, [member.id]: val });
                        setCustomTips({ ...customTips, [member.id]: '' });
                      }}
                      className={`flex-1 border rounded-md ${isDense ? 'py-0.5 text-[11px]' : 'py-1 text-xs'} font-semibold transition-all duration-150 ${
                        selTip === val
                          ? 'bg-nexoraBrand text-white border-nexoraBrand'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}

                  <div className={`relative ${isDense ? 'w-11' : 'w-14'} shrink-0`}>
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={selTip === 'custom' ? custTip : ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setSelectedTips({ ...selectedTips, [member.id]: 'custom' });
                        setCustomTips({ ...customTips, [member.id]: val });
                      }}
                      className={`w-full bg-white border ${selTip === 'custom' ? 'border-nexoraBrand' : 'border-slate-200'} focus:border-nexoraBrand rounded-md pl-3 pr-1 ${isDense ? 'h-[22px]' : 'h-[26px]'} text-[11px] font-bold text-slate-800 focus:outline-none transition-all text-right`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="bg-slate-50 px-3 py-2 border-t border-slate-100 flex justify-between items-center shrink-0">
           <span className="font-bold text-[11px] uppercase text-nexoraSubtle">{currentLanguage === 'vi' ? 'TỔNG' : 'TOTAL'}</span>
           <span className="font-black text-[15px] text-nexoraText">${activeTipAmount.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  const getRecipientName = () => {
    return selectedStaffMembers.length === 1 ? selectedStaffMembers[0].fullName : bizName;
  };

  const renderInlineWalletDetails = () => {
    if (!selectedWalletObj) return null;

    const accountVal = selectedStaffMembers.length === 1
      ? selectedStaffMembers[0].paymentAccounts?.[selectedWalletObj.key]
      : businessPaymentAccounts?.[selectedWalletObj.key];

    if (selectedWalletObj.key === 'vlinkpay') {
      return (
        <div className="mt-4 flex flex-col gap-3 animate-fadeIn">
          {/* VLINKPAY Green Card */}
          <div className="p-3.5 rounded-[16px] border border-[#A7F3D0] bg-[#ECFDF5] flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-[11px] text-[#047857] uppercase tracking-wider">
                {currentLanguage === 'vi' ? 'TÀI KHOẢN VLINKPAY' : 'VLINKPAY ACCOUNT'}
              </span>
              <span className="bg-[#D1FAE5] text-[#059669] px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                VLINKPAY
              </span>
            </div>

            <div className="flex gap-3 items-center">
              {/* Symbolic QR Code */}
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VLK:0x3f9A8b2C1d4E5f6A7B8C9D0E1F2A3B4C5D6E7F8&color=000000" className="w-[72px] h-[72px] rounded-xl border border-[#A7F3D0] bg-white p-1 shadow-sm shrink-0 object-contain" alt="QR Code" />

              {/* Address Info */}
              <div className="flex-1 flex flex-col justify-center overflow-hidden">
                <span className="text-[10px] font-medium text-[#059669] opacity-80 mb-0.5">
                  {currentLanguage === 'vi' ? 'Địa chỉ ví' : 'Wallet Address'}
                </span>
                <span className="text-[12px] font-bold text-nexoraText break-all leading-tight mb-2">
                  VLK:0x3f9A8b2C1d4E5f6A7B8C9D0E1F2A3B4C5D6E7F8
                </span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText("VLK:0x3f9A8b2C1d4E5f6A7B8C9D0E1F2A3B4C5D6E7F8");
                    showToast(t('common.copied') || 'Copied!', 'success');
                  }}
                  className="flex items-center justify-center gap-1.5 w-full bg-white border border-[#A7F3D0] text-[#059669] py-1.5 rounded-lg text-[11px] font-bold shadow-sm hover:bg-[#D1FAE5] transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {currentLanguage === 'vi' ? 'Sao chép' : 'Copy address'}
                </button>
              </div>
            </div>
          </div>

          {/* Instruction Box */}
          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-[#475569] text-[12px] font-medium leading-relaxed">
            {currentLanguage === 'vi' ? (
              <>
                (1) Quét QR hoặc copy địa chỉ ví &middot; (2) Mở ví điện tử của bạn và chuyển <strong>${activeTipAmount.toFixed(2)}</strong> &middot; (3) Xác nhận đã chuyển
              </>
            ) : (
              <>
                (1) Scan QR or copy wallet address &middot; (2) Open your e-wallet and send <strong>${activeTipAmount.toFixed(2)}</strong> &middot; (3) Confirm below
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4 p-4 border rounded-[16px] flex flex-col gap-3 relative animate-fadeIn" style={{ backgroundColor: selectedWalletObj.key === 'applecash' ? '#F8F8F8' : `${selectedWalletObj.color}15`, borderColor: selectedWalletObj.color }}>
        <div className="flex justify-between items-center px-3 py-2.5 rounded-xl" style={{ backgroundColor: selectedWalletObj.color, color: 'white' }}>
          <span className="font-bold text-[13px] flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
               {selectedWalletObj.logo}
            </div>
            {selectedWalletObj.name} : {accountVal || 'N/A'}
          </span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(accountVal || getRecipientName());
              showToast(t('common.copied') || 'Copied!', 'success');
            }}
            className="text-[11px] font-extrabold bg-white px-3 py-1.5 rounded-lg shadow-sm hover:scale-105 transition-transform"
            style={{ color: selectedWalletObj.color }}
          >
            {currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}
          </button>
        </div>
        
        {qrCodeVal && (
          <div className="flex justify-center mt-2">
             <img src={qrCodeVal} className="w-32 h-32 rounded-lg shadow-sm border border-black/5" alt="QR Code" />
          </div>
        )}

        <p className="text-[11px] text-center font-medium opacity-80" style={{ color: selectedWalletObj.key === 'applecash' ? '#666' : selectedWalletObj.color }}>
          {currentLanguage === 'vi' 
            ? `Cô/chú gửi qua ${selectedWalletObj.name} - ${getRecipientName()} & chuyển $${activeTipAmount.toFixed(2)} - Cú Soạn để nhân viên nhận tiền được`
            : `Please send $${activeTipAmount.toFixed(2)} to ${getRecipientName()} via ${selectedWalletObj.name}.`}
        </p>
      </div>
    );
  };

  const isTipValid = activeTipAmount > 0;

  return (
    <div className="flex flex-col h-full animate-fadeIn pb-[100px]">
      <div className="flex-grow pb-4">
        {/* Header - Staff Info */}
        <div className="mb-3 flex flex-col items-center">
          {isMulti ? (
            <div className="flex items-center justify-between w-full bg-white border border-slate-100 p-2.5 rounded-[14px] shadow-sm">
              <div className="flex items-center gap-2.5">
                {selectedStaffMembers.length >= 3 ? (
                  <>
                    <div className="flex -space-x-2.5 ml-1">
                      {selectedStaffMembers.slice(0, 3).map((m, i) => (
                        <div key={m.id} className="relative rounded-full border-2 border-white overflow-hidden shadow-sm w-8 h-8" style={{ zIndex: 10 - i }}>
                          {m.avatar ? (
                            <img src={m.avatar} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-[10px] font-extrabold text-white">
                              {m.nickname.charAt(0)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col ml-1">
                      <span className="text-[12px] font-extrabold text-slate-800 leading-tight">
                        {selectedStaffMembers.length} {currentLanguage === 'vi' ? 'nhân viên' : 'staff selected'}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 truncate max-w-[110px]">
                        {selectedStaffMembers.slice(0, 2).map(m => m.nickname).join(', ')}
                        {selectedStaffMembers.length > 2 && ` +${selectedStaffMembers.length - 2}`}
                      </span>
                    </div>
                  </>
                ) : (
                  selectedStaffMembers.map(m => (
                    <div key={m.id} className="flex flex-col items-center gap-1">
                      {m.avatar ? (
                        <img src={m.avatar} className="w-9 h-9 rounded-[10px] object-cover shadow-sm border border-slate-100" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-[13px] font-extrabold text-white shadow-sm">
                          {m.nickname.charAt(0)}
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-slate-600 truncate max-w-[40px] text-center">{m.nickname}</span>
                    </div>
                  ))
                )}
              </div>
              <button 
                type="button"
                onClick={() => setStep('select_staff')}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-nexoraBrandSoft/10 text-nexoraBrand rounded-lg hover:bg-nexoraBrandSoft/20 transition-colors shrink-0"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">{currentLanguage === 'vi' ? 'Sửa' : 'Edit'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center w-full bg-white border border-nexoraBorder p-3 rounded-[14px] shadow-sm">
              <div className="flex items-center gap-3 flex-1">
                {selectedStaffMembers[0].avatar ? (
                  <img src={selectedStaffMembers[0].avatar} className="w-10 h-10 rounded-full object-cover border border-nexoraBorder" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-xs font-extrabold text-white">
                    {selectedStaffMembers[0].nickname.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-nexoraText text-[14px] leading-tight mb-0.5">
                    {selectedStaffMembers[0].fullName}
                  </h3>
                  <p className="text-xs text-nexoraSubtle font-medium">{selectedStaffMembers[0].position}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2.5 py-1 rounded-full border border-yellow-200">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-[11px] font-bold">5.0</span>
              </div>
            </div>
          )}
        </div>

        {/* Multi-tips Toggle */}
        {isMulti && (
          <div className="flex p-0.5 bg-slate-100 rounded-lg mb-3">
            <button
              type="button"
              onClick={() => setTipMode('combine')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                tipMode === 'combine' ? 'bg-white shadow-sm text-nexoraBrand' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {currentLanguage === 'vi' ? 'Chia đều' : 'Split Evenly'}
            </button>
            <button
              type="button"
              onClick={() => setTipMode('split')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                tipMode === 'split' ? 'bg-white shadow-sm text-nexoraBrand' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {currentLanguage === 'vi' ? 'Tip riêng từng thợ' : 'Separate Tips'}
            </button>
          </div>
        )}

        <div className="mb-4">
          {(!isMulti || tipMode === 'combine') ? renderSingleOrCombineBody() : renderSplitBody()}
        </div>

        {/* Payment Methods Grid */}
        <div className="text-left space-y-1 mb-2 opacity-100 transition-opacity" style={{ opacity: isTipValid ? 1 : 0.5 }}>
          <h3 className="font-extrabold text-[10px] text-nexoraSubtle uppercase tracking-wider">
            {currentLanguage === 'vi' ? 'PHƯƠNG THỨC THANH TOÁN' : 'PAYMENT METHOD'}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2" style={{ pointerEvents: isTipValid ? 'auto' : 'none', opacity: isTipValid ? 1 : 0.5 }}>
          {[
            { name: 'Zelle', key: 'zelle', color: '#7414CA', logo: WalletLogos.zelle },
            { name: 'Venmo', key: 'venmo', color: '#008CFF', logo: WalletLogos.venmo },
            { name: 'Cash App', key: 'cashapp', color: '#00D632', logo: WalletLogos.cashapp },
            { name: 'Apple Cash', key: 'applecash', color: '#000000', logo: WalletLogos.applepay },
            { name: 'Paypal', key: 'paypal', color: '#003087', logo: WalletLogos.paypal },
            { name: 'VLINKPAY', key: 'vlinkpay', color: '#2B59FF', iconBg: '#FFFFFF', logo: WalletLogos.vlinkpay }
          ].filter(wallet => {
            if (selectedStaffMembers.length === 1) {
              const staff = selectedStaffMembers[0]
              if (selectedStaffHasAnyPayment) {
                return !!staff.paymentAccounts?.[wallet.key]
              } else {
                return !!businessPaymentAccounts?.[wallet.key]
              }
            }
            return !!businessPaymentAccounts?.[wallet.key]
          }).map(wallet => {
            const isSelected = selectedWalletObj?.key === wallet.key;
            return (
              <button
                key={wallet.key}
                onClick={() => {
                  setSelectedWalletObj(wallet)
                  setSelectedWallet(wallet.name)
                  setTipRefNumber(Math.floor(1000 + Math.random() * 9000).toString())
                }}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg bg-white border-2 transition-all duration-200 group ${
                  isSelected 
                    ? 'border-nexoraBrand outline outline-2 outline-offset-2 outline-nexoraBrand scale-105 shadow-sm' 
                    : 'border-slate-100 hover:border-slate-300 hover:scale-[1.02]'
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-1 overflow-hidden"
                  style={{ backgroundColor: wallet.iconBg || wallet.color }}
                >
                  {wallet.logo}
                </div>
                <span className="text-[10px] font-medium text-slate-600 tracking-tight">{wallet.name}</span>
              </button>
            )
          })}
        </div>

        {/* Inline Wallet Details */}
        {renderInlineWalletDetails()}

      </div>

      {/* Bottom Footer (Sticky) */}
      <div className="absolute left-0 right-0 bottom-0 z-50 flex flex-col gap-2 px-4 pt-3 bg-white/94 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => {
            if (!selectedWalletObj) {
              showToast(currentLanguage === 'vi' ? 'Vui lòng chọn phương thức thanh toán' : 'Please select a payment method', 'error')
              return;
            }
            handlePay(selectedWalletObj.name)
          }}
          disabled={!isTipValid}
          className="w-full h-[52px] bg-gradient-to-r from-[#5B21B6] to-[#6D28D9] hover:opacity-90 disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-400 text-white font-extrabold text-[12px] uppercase tracking-wider rounded-[16px] flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(109,40,217,0.25)] transition-all active:scale-95"
        >
          {!selectedWalletObj 
            ? (currentLanguage === 'vi' ? 'CHỌN PHƯƠNG THỨC THANH TOÁN' : 'CHOOSE PAYMENT METHOD')
            : (currentLanguage === 'vi' ? `TÔI ĐÃ GỬI TÍP QUA ${selectedWalletObj.name.toUpperCase()} RỒI` : `I SENT TIP VIA ${selectedWalletObj.name.toUpperCase()}`)
          }
        </button>

        <button
          onClick={() => setStep('select_staff')}
          className="w-full h-[40px] bg-transparent text-slate-500 hover:text-slate-800 font-bold text-xs uppercase tracking-wider rounded-[12px] transition-colors active:scale-95"
        >
          {currentLanguage === 'vi' ? 'QUAY LẠI' : 'GO BACK'}
        </button>
      </div>
    </div>
  )
}
