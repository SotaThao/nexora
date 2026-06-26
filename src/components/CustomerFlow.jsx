import React from 'react'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import useCustomerFlow from './customer-flow/hooks/useCustomerFlow'
import SelectStaff from './customer-flow/steps/SelectStaff'
import TipAmount from './customer-flow/steps/TipAmount'
import Processing from './customer-flow/steps/Processing'
import SuccessPayment from './customer-flow/steps/SuccessPayment'
import ReviewRouting from './customer-flow/steps/ReviewRouting'
import FinalDone from './customer-flow/steps/FinalDone'

export default function CustomerFlow() {
  const flow = useCustomerFlow()

  const {
    currentLanguage, setLanguage, t, showToast,
    bizName, scannedTouchpoint,
    filteredStaff, selectedStaffMembers, searchQuery, setSearchQuery, handleToggleStaff,
    step, setStep,
    selectedTips, setSelectedTips, customTips, setCustomTips,
    activeTipAmount, tipScreenTitle, initialStaffMember,
    selectedStaffHasAnyPayment, businessPaymentAccounts,
    setSelectedWalletObj, setSelectedWallet, setTipRefNumber,
    selectedWalletObj, qrCodeVal, tipRefNumber, handlePay,
    selectedWallet,
    rating, handleRatingChange,
    positiveTagKeys, negativeTagKeys, selectedTags, handleTagToggle,
    comment, setComment, handleSubmitFeedback,
    reviewLinks,
    handleReset,
  } = flow

  return (
    <div className="min-h-dvh bg-[#F8FAFC] text-slate-900 font-sans flex items-center justify-center p-4 relative">
      
      {/* Language Switcher - Floating outside the mobile container */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
        <button
          onClick={() => setLanguage('vi')}
          className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'vi' ? 'bg-[#6C4DE6] text-white' : 'text-slate-500 hover:text-slate-900'}`}
        >
          VI
        </button>
        <span className="text-slate-300 text-xs">|</span>
        <button
          onClick={() => setLanguage('en')}
          className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'en' ? 'bg-[#6C4DE6] text-white' : 'text-slate-500 hover:text-slate-900'}`}
        >
          EN
        </button>
      </div>

      {/* Mobile App Container */}
      <div className="w-full max-w-[390px] h-[844px] max-h-[90vh] bg-[#F8FAFC] rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex flex-col relative overflow-hidden border border-slate-200">
        
        {/* Header */}
        <header className="bg-white px-5 py-3.5 flex justify-between items-center border-b border-slate-200 z-10 shrink-0">
          <div className="flex items-center">
            <img src="/assets/nexora-logo.png" alt="Nexora" className="h-[24px] w-auto object-contain" />
          </div>
          <div className="font-medium text-[15px] text-slate-900">Tip & Review</div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto px-5 pt-6 pb-[100px] no-scrollbar">
          {scannedTouchpoint && scannedTouchpoint.isActive === false ? (
            <div className="text-center space-y-6 py-6 animate-fadeIn flex flex-col items-center">
              <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center shadow-inner mb-2 animate-bounce">
                <AlertTriangle className="h-8 w-8 text-amber-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-slate-900">
                  {t('dashboard.touchpoint_stats.inactive_warning_title') || 'Station Inactive'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed px-4">
                  {t('dashboard.touchpoint_stats.inactive_warning_desc') || 'This QR touchpoint is currently disabled by the owner.'}
                </p>
              </div>
              <button
                onClick={() => {
                  window.location.href = `${window.location.origin}${window.location.pathname}?biz=${encodeURIComponent(bizName)}`
                }}
                className="w-full mt-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-extrabold text-xs uppercase tracking-wider rounded-xl transition"
              >
                {t('common.back') || 'Go Back'}
              </button>
            </div>
          ) : (
            <>
              {step === 'select_staff' && (
                <SelectStaff
                  t={t}
                  currentLanguage={currentLanguage}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filteredStaff={filteredStaff}
                  selectedStaffMembers={selectedStaffMembers}
                  handleToggleStaff={handleToggleStaff}
                  setStep={setStep}
                />
              )}

              {step === 'tip_amount' && selectedStaffMembers.length > 0 && (
                <TipAmount
                  t={t}
                  currentLanguage={currentLanguage}
                  tipScreenTitle={tipScreenTitle}
                  selectedStaffMembers={selectedStaffMembers}
                  selectedTips={selectedTips}
                  setSelectedTips={setSelectedTips}
                  customTips={customTips}
                  setCustomTips={setCustomTips}
                  activeTipAmount={activeTipAmount}
                  initialStaffMember={initialStaffMember}
                  setStep={setStep}
                  selectedStaffHasAnyPayment={selectedStaffHasAnyPayment}
                  businessPaymentAccounts={businessPaymentAccounts}
                  selectedWalletObj={selectedWalletObj}
                  setSelectedWalletObj={setSelectedWalletObj}
                  setSelectedWallet={setSelectedWallet}
                  setTipRefNumber={setTipRefNumber}
                  bizName={bizName}
                  qrCodeVal={qrCodeVal}
                  tipRefNumber={tipRefNumber}
                  showToast={showToast}
                  handlePay={handlePay}
                />
              )}

              {step === 'processing' && (
                <Processing t={t} selectedWallet={selectedWallet} />
              )}

              {step === 'success_payment' && (
                <SuccessPayment
                  t={t}
                  currentLanguage={currentLanguage}
                  selectedStaffMembers={selectedStaffMembers}
                  activeTipAmount={activeTipAmount}
                  selectedWallet={selectedWallet}
                  selectedTips={selectedTips}
                  customTips={customTips}
                  bizName={bizName}
                  rating={rating}
                  handleRatingChange={handleRatingChange}
                  positiveTagKeys={positiveTagKeys}
                  negativeTagKeys={negativeTagKeys}
                  selectedTags={selectedTags}
                  handleTagToggle={handleTagToggle}
                  comment={comment}
                  setComment={setComment}
                  handleSubmitFeedback={handleSubmitFeedback}
                  setStep={setStep}
                />
              )}

              {step === 'google_yelp_review' && (
                <ReviewRouting
                  t={t}
                  reviewLinks={reviewLinks}
                  setStep={setStep}
                />
              )}

              {step === 'final_done' && (
                <FinalDone t={t} handleReset={handleReset} />
              )}
            </>
          )}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .no-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .no-scrollbar::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }
      `}} />
    </div>
  )
}
