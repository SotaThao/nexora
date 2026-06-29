import React from 'react'
import { CheckCircle2, Star } from 'lucide-react'

const WalletLogos = {
  venmo: (
    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#008CFF' }}>
      <svg viewBox="0 0 448 512" className="h-[10px] w-[10px] fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z" />
      </svg>
    </div>
  ),
  cashapp: (
    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00D632' }}>
      <svg viewBox="0 0 24 24" className="h-[10px] w-[10px] fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.59 3.475a5.1 5.1 0 00-3.05-3.05c-1.31-.42-2.5-.42-4.92-.42H8.36c-2.4 0-3.61 0-4.9.4a5.1 5.1 0 00-3.05 3.06C0 4.765 0 5.965 0 8.365v7.27c0 2.41 0 3.6.4 4.9a5.1 5.1 0 003.05 3.05c1.3.41 2.5.41 4.9.41h7.28c2.41 0 3.61 0 4.9-.4a5.1 5.1 0 003.06-3.06c.41-1.3.41-2.5.41-4.9v-7.25c0-2.41 0-3.61-.41-4.91zm-6.17 4.63l-.93.93a.5.5 0 01-.67.01 5 5 0 00-3.22-1.18c-.97 0-1.94.32-1.94 1.21 0 .9 1.04 1.2 2.24 1.65 2.1.7 3.84 1.58 3.84 3.64 0 2.24-1.74 3.78-4.58 3.95l-.26 1.2a.49.49 0 01-.48.39H9.63l-.09-.01a.5.5 0 01-.38-.59l.28-1.27a6.54 6.54 0 01-2.88-1.57v-.01a.48.48 0 010-.68l1-.97a.49.49 0 01.67 0c.91.86 2.13 1.34 3.39 1.32 1.3 0 2.17-.55 2.17-1.42 0-.87-.88-1.1-2.54-1.72-1.76-.63-3.43-1.52-3.43-3.6 0-2.42 2.01-3.6 4.39-3.71l.25-1.23a.48.48 0 01.48-.38h1.78l.1.01c.26.06.43.31.37.57l-.27 1.37c.9.3 1.75.77 2.48 1.39l.02.02c.19.2.19.5 0 .68z" />
      </svg>
    </div>
  ),
  zelle: (
    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#7414CA' }}>
      <svg viewBox="0 0 24 24" className="h-[10px] w-[10px] fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z" />
      </svg>
    </div>
  ),
  paypal: (
    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#003087' }}>
      <svg viewBox="0 0 24 24" className="h-[10px] w-[10px] fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.09 6.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H6.22c-.65 0-1.13-.59-.99-1.22L8.53 5.4c.14-.63.7-.1 1.33-.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" />
        <path d="M16.92 3.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H3.06c-.65 0-1.13-.59-.99-1.22L5.37 2.4c.14-.63.7-1.1 1.33-1.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" opacity="0.6" />
      </svg>
    </div>
  ),
  applecash: (
    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-black">
      <svg viewBox="0 0 170 170" className="h-[8px] w-[8px] fill-white text-white shrink-0" xmlns="http://www.w3.org/2000/svg">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.22-9.13-1.78-14.37-6.02-3.43-2.73-7.25-7.28-11.45-13.68-4.73-7.24-8.55-15.53-11.45-24.85-2.9-9.33-4.35-18.21-4.35-26.65 0-14.93 3.94-27.17 11.83-36.73 7.89-9.55 17.58-14.39 29.08-14.5 5.8-.11 11.9 1.67 18.3 5.35 6.4 3.68 11.13 5.52 14.18 5.52 2.34 0 6.81-1.67 13.43-5.02 6.62-3.34 12.52-4.85 17.68-4.52 13.25.67 23.95 5.57 32.09 14.72-11.48 6.91-17.11 16.28-16.89 28.1.22 9.58 3.84 17.6 10.87 24.08 7.02 6.47 15.21 9.94 24.57 10.42-2.12 6.13-4.68 12.26-7.69 18.38zM119.22 35.24c0-7.8-2.79-15.01-8.36-21.62C105.3 7 98 3.32 89.17 3.32c-.11.9-.11 1.78.11 2.68.22 5.58 2.51 11.23 6.85 16.94 4.35 5.71 9.76 9.47 16.23 11.3 1.34-5.36 6.86-9 6.86-9z"/>
      </svg>
    </div>
  ),
  vlinkpay: (
    <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0">
      <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY" className="w-full h-full object-contain" />
    </div>
  ),
}

export default function SuccessPayment({
  t,
  currentLanguage,
  selectedStaffMembers,
  activeTipAmount,
  selectedWallet,
  selectedTips,
  customTips,
  bizName,
  rating,
  handleRatingChange,
  positiveTagKeys,
  negativeTagKeys,
  selectedTags,
  handleTagToggle,
  comment,
  setComment,
  handleSubmitFeedback,
  setStep,
}) {
  const isMulti = selectedStaffMembers.length > 1;

  const walletKey = Object.keys(WalletLogos).find(key => 
    selectedWallet.toLowerCase().includes(key.toLowerCase()) || 
    (key === 'applecash' && selectedWallet.toLowerCase().includes('apple'))
  ) || 'cashapp';

  return (
    <div className="flex flex-col h-full animate-fadeIn pb-4">
      <div className="flex-grow space-y-3 pb-2">
        
        {/* Success Banner */}
        <div className="flex items-center gap-3 animate-pop bg-white rounded-xl border border-slate-100 shadow-sm px-3 py-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-black text-slate-800">Tip Sent! 🎉</h1>
            <p className="text-[11px] text-slate-400">{currentLanguage === 'vi' ? 'Cảm ơn sự hào phóng của bạn' : 'Thank you for your generosity!'}</p>
          </div>
        </div>

        {/* Tip Summary Box */}
        <div className="bg-white border border-nexoraBorder rounded-[14px] p-3 shadow-sm">
          {isMulti ? (
            <>
              <div className="flex items-center gap-2.5 border-b border-nexoraBorder pb-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-sm">
                  {bizName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-[12px] text-nexoraText leading-tight">{bizName}</h4>
                  <p className="text-[10px] text-nexoraSubtle font-medium truncate max-w-[200px]">{selectedStaffMembers.map(s => s.nickname).join(', ')}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {selectedStaffMembers.map(member => {
                  const selTip = selectedTips[member.id];
                  const tipAmt = selTip === 'custom' ? Number(customTips[member.id]) || 0 : selTip || 0;
                  return (
                    <div key={member.id} className="flex justify-between items-center h-[32px]">
                      <div className="flex items-center gap-2">
                        {member.avatar ? (
                          <img src={member.avatar} className="w-5 h-5 rounded-full border border-nexoraBorder" />
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-[9px] font-extrabold text-white">
                            {member.nickname.charAt(0)}
                          </div>
                        )}
                        <span className="text-[11px] font-bold text-nexoraText">{member.nickname}</span>
                      </div>
                      <span className="text-[11px] font-extrabold text-nexoraText">${tipAmt.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              {selectedStaffMembers[0].avatar ? (
                <img src={selectedStaffMembers[0].avatar} className="w-8 h-8 rounded-full border border-nexoraBorder" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-[11px] font-extrabold text-white">
                  {selectedStaffMembers[0].nickname.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-extrabold text-[12px] text-nexoraText leading-tight">{selectedStaffMembers[0].fullName}</h4>
                <p className="text-[10px] text-nexoraSubtle font-medium">{selectedStaffMembers[0].position}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-end mt-3 pt-3 border-t border-dashed border-nexoraBorder">
            <div className="flex flex-col">
              <span className="block text-[9px] font-bold text-nexoraSubtle uppercase tracking-wider mb-0.5">TOTAL TIP</span>
              <span className="text-[16px] font-black text-emerald-600 leading-none">${activeTipAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-nexoraCanvas/50 border border-nexoraBorder px-2 py-1 rounded-[6px] shadow-sm">
              {WalletLogos[walletKey]}
              <span className="text-[10px] font-bold text-nexoraText">{selectedWallet}</span>
            </div>
          </div>
        </div>

        {/* Review Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mt-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 px-4 py-2.5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{currentLanguage === 'vi' ? 'Đánh giá dịch vụ' : 'Rate your experience'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{currentLanguage === 'vi' ? 'Hãy đánh giá trải nghiệm của bạn' : 'Share your thoughts with us'}</p>
            </div>
            <p className="text-sm font-semibold text-amber-500">
              {rating === 5 ? (currentLanguage === 'vi' ? 'Xuất sắc' : 'Excellent') : 
               rating === 4 ? (currentLanguage === 'vi' ? 'Rất tốt' : 'Very good') : 
               rating === 3 ? (currentLanguage === 'vi' ? 'Bình thường' : 'Good') : 
               rating === 2 ? (currentLanguage === 'vi' ? 'Chưa tốt' : 'Fair') : 
               rating === 1 ? (currentLanguage === 'vi' ? 'Tệ' : 'Poor') : ''}
            </p>
          </div>

          <div className="p-3 space-y-3">
            <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                className="transform transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-slate-300'}`}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-2 pb-1 overflow-x-auto whitespace-nowrap no-scrollbar" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            <style dangerouslySetInnerHTML={{__html: `
              .no-scrollbar::-webkit-scrollbar { display: none; }
            `}} />
            {(rating >= 4 ? positiveTagKeys : negativeTagKeys).map(key => {
              const tagText = rating >= 4 
                ? t(`customer.tags_positive.${key}`) 
                : t(`customer.tags_negative.${key}`);
              const isSelected = selectedTags.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTagToggle(key)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 border h-[32px] ${
                    isSelected 
                      ? (rating >= 4 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-red-100 text-red-800 border-red-300')
                      : 'bg-white text-nexoraSubtle border-nexoraBorder hover:bg-nexoraCanvas'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3 h-3" strokeWidth={3} />}
                  {tagText}
                </button>
              )
            })}
          </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={currentLanguage === 'vi' ? 'Nhập nhận xét hoặc chọn gợi ý bên trên...' : 'Tell us more (optional)'}
                className="w-full text-[13px] text-slate-700 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/10 placeholder-slate-300 transition-all duration-200 min-h-[52px] focus:min-h-[96px]"
              />
          </div>
        </div>
      </div>

      {/* Action Buttons (Sticky Footer) */}
      <div className="absolute left-0 right-0 bottom-0 z-50 grid grid-cols-[1fr_88px] gap-3 px-4 pt-3 bg-white/94 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-nexoraBrand to-[#16b7ff] rounded-[18px] blur-sm opacity-50 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
          <button
            onClick={handleSubmitFeedback}
            className="relative w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-nexoraBrand to-[#4f46e5] hover:bg-nexoraBrand/90 text-white font-extrabold text-[13px] py-3.5 px-4 rounded-[16px] shadow-[0_10px_24px_rgba(79,70,229,0.25)] transition-all duration-300 active:scale-95 h-[52px]"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            {currentLanguage === 'vi' ? 'Gửi đánh giá' : 'Submit review'}
          </button>
        </div>

        <button
          onClick={() => {
            if (rating >= 4) setStep('google_yelp_review');
            else setStep('final_done');
          }}
          className="w-full h-[52px] bg-[#eef2f7] hover:bg-[#e2e8f0] text-slate-600 hover:text-nexoraBrand text-[13px] font-extrabold rounded-[16px] transition-all duration-300 active:scale-95"
        >
          {currentLanguage === 'vi' ? 'Bỏ qua' : 'Skip'}
        </button>
      </div>
    </div>
  )
}
