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
    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2B59FF' }}>
      <svg viewBox="0 0 24 24" className="h-[10px] w-[10px] fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L1 7v2h22V7L12 2zm0 18H3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h-3zm-11 2h22v2H1v-2z" />
      </svg>
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
      <div className="flex-grow space-y-4">
        
        {/* Success Banner */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-[12px] p-3 flex items-center gap-3">
          <div className="bg-emerald-500 rounded-full flex items-center justify-center w-7 h-7 shrink-0 shadow-sm">
            <CheckCircle2 className="text-white w-4 h-4" strokeWidth={3} />
          </div>
          <div>
            <h4 className="font-extrabold text-[13px] text-emerald-700">Tip Sent! 🎉</h4>
            <p className="text-[11px] font-medium text-emerald-600/90">{currentLanguage === 'vi' ? 'Cảm ơn sự hào phóng của bạn' : 'Thank you for your generosity!'}</p>
          </div>
        </div>

        {/* Tip Summary Box */}
        <div className="bg-white border border-nexoraBorder rounded-[16px] p-4 shadow-sm">
          {isMulti ? (
            <>
              <div className="flex items-center gap-3 border-b border-nexoraBorder pb-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-sm">
                  {bizName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-[13px] text-nexoraText leading-tight">{bizName}</h4>
                  <p className="text-[11px] text-nexoraSubtle font-medium">{selectedStaffMembers.map(s => s.nickname).join(', ')}</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {selectedStaffMembers.map(member => {
                  const selTip = selectedTips[member.id];
                  const tipAmt = selTip === 'custom' ? Number(customTips[member.id]) || 0 : selTip || 0;
                  return (
                    <div key={member.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {member.avatar ? (
                          <img src={member.avatar} className="w-6 h-6 rounded-full border border-nexoraBorder" />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-[9px] font-extrabold text-white">
                            {member.nickname.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-bold text-nexoraText">{member.nickname}</span>
                      </div>
                      <span className="text-xs font-extrabold text-nexoraText">${tipAmt.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {selectedStaffMembers[0].avatar ? (
                <img src={selectedStaffMembers[0].avatar} className="w-10 h-10 rounded-full border border-nexoraBorder" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-xs font-extrabold text-white">
                  {selectedStaffMembers[0].nickname.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-extrabold text-[13px] text-nexoraText leading-tight">{selectedStaffMembers[0].fullName}</h4>
                <p className="text-[11px] text-nexoraSubtle font-medium">{selectedStaffMembers[0].position}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-end mt-4 pt-4 border-t border-dashed border-nexoraBorder">
            <div>
              <span className="block text-[10px] font-bold text-nexoraSubtle uppercase tracking-wider mb-1">TOTAL TIP</span>
              <span className="text-[20px] font-black text-emerald-600">${activeTipAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-nexoraCanvas/50 border border-nexoraBorder px-2.5 py-1.5 rounded-lg shadow-sm">
              {WalletLogos[walletKey]}
              <span className="text-[11px] font-bold text-nexoraText">{selectedWallet}</span>
            </div>
          </div>
        </div>

        {/* Review Section */}
        <div className="bg-yellow-50 border border-yellow-200/50 rounded-[16px] p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-extrabold text-[13px] text-nexoraText">{currentLanguage === 'vi' ? 'Đánh giá dịch vụ' : 'Rate your experience'}</h3>
              <p className="text-[11px] font-medium text-nexoraSubtle">{currentLanguage === 'vi' ? 'Chia sẻ trải nghiệm của bạn' : 'Share your thoughts with us'}</p>
            </div>
            <span className="text-[11px] font-extrabold text-nexoraBrand">{currentLanguage === 'vi' ? 'Rất tốt' : 'Excellent'}</span>
          </div>

          <div className="flex justify-center gap-2">
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

          <div className="flex flex-wrap gap-2 pt-2">
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
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 border ${
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
            placeholder={currentLanguage === 'vi' ? 'Nhập đánh giá của bạn (tùy chọn)' : 'Tell us more (optional)'}
            className="w-full bg-white border border-nexoraBorder focus:border-nexoraBrand rounded-xl p-3 text-xs font-medium text-nexoraText focus:outline-none transition-all resize-none shadow-sm"
            rows="3"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 space-y-3">
        <button
          onClick={handleSubmitFeedback}
          className="w-full min-h-[52px] bg-gradient-to-r from-[#5B21B6] to-[#6D28D9] hover:opacity-95 text-white font-extrabold text-[12px] uppercase tracking-wider rounded-[12px] shadow-[0_4px_16px_rgba(109,40,217,0.25)] transition-all"
        >
          {currentLanguage === 'vi' ? 'GỬI ĐÁNH GIÁ' : 'SUBMIT REVIEW'}
        </button>

        <button
          onClick={() => {
            if (rating >= 4) setStep('google_yelp_review');
            else setStep('final_done');
          }}
          className="w-full py-3 bg-transparent text-nexoraMuted hover:text-nexoraText font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
        >
          {currentLanguage === 'vi' ? 'BỎ QUA' : 'SKIP'}
        </button>
      </div>
    </div>
  )
}
