import React from 'react'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import useCustomerFlow from './customer-flow/hooks/useCustomerFlow'
import SelectStaff from './customer-flow/steps/SelectStaff'
import TipAmount from './customer-flow/steps/TipAmount'
import Payment from './customer-flow/steps/Payment'
import WalletDetails from './customer-flow/steps/WalletDetails'
import Processing from './customer-flow/steps/Processing'
import SuccessPayment from './customer-flow/steps/SuccessPayment'
import LeaveReview from './customer-flow/steps/LeaveReview'
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
    activeTipAmount, tipScreenTitle, initialStaffMember, handleNextToPayment,
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
    <div className="min-h-dvh bg-nexoraCanvas text-nexoraText font-sans flex flex-col justify-between selection:bg-nexoraBrandSoft selection:text-nexoraBrand pb-8 relative">
      {/* Glow effects */}
      <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-nexoraBorder shadow-sm">
        <button
          onClick={() => setLanguage('vi')}
          className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'vi' ? 'bg-nexoraBrand text-white' : 'text-nexoraSubtle hover:text-nexoraText'}`}
        >
          VI
        </button>
        <span className="text-nexoraBorder text-xs">|</span>
        <button
          onClick={() => setLanguage('en')}
          className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'en' ? 'bg-nexoraBrand text-white' : 'text-nexoraSubtle hover:text-nexoraText'}`}
        >
          EN
        </button>
      </div>

      {/* Body content */}
      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-white border border-nexoraBorder rounded-2xl p-6 shadow-premium space-y-6">

          {scannedTouchpoint && scannedTouchpoint.isActive === false ? (
            <div className="text-center space-y-6 py-6 animate-fadeIn flex flex-col items-center">
              <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center shadow-inner mb-2 animate-bounce">
                <AlertTriangle className="h-8 w-8 text-amber-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-nexoraText">
                  {t('dashboard.touchpoint_stats.inactive_warning_title') || 'Station Inactive'}
                </h3>
                <p className="text-xs text-nexoraMuted leading-relaxed px-4">
                  {t('dashboard.touchpoint_stats.inactive_warning_desc') || 'This QR touchpoint is currently disabled by the owner.'}
                </p>
              </div>
              <button
                onClick={() => {
                  window.location.href = `${window.location.origin}${window.location.pathname}?biz=${encodeURIComponent(bizName)}`
                }}
                className="w-full mt-4 py-3 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted text-nexoraText font-extrabold text-xs uppercase tracking-wider rounded-xl transition"
              >
                {t('common.back') || 'Go Back'}
              </button>
            </div>
          ) : (
            <>
              {step === 'select_staff' && (
                <SelectStaff
                  t={t}
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
                  handleNextToPayment={handleNextToPayment}
                />
              )}

              {step === 'payment' && (
                <Payment
                  t={t}
                  selectedStaffMembers={selectedStaffMembers}
                  selectedStaffHasAnyPayment={selectedStaffHasAnyPayment}
                  businessPaymentAccounts={businessPaymentAccounts}
                  setSelectedWalletObj={setSelectedWalletObj}
                  setSelectedWallet={setSelectedWallet}
                  setTipRefNumber={setTipRefNumber}
                  setStep={setStep}
                />
              )}

              {step === 'wallet_details' && selectedWalletObj && (
                <WalletDetails
                  t={t}
                  currentLanguage={currentLanguage}
                  selectedWalletObj={selectedWalletObj}
                  selectedStaffMembers={selectedStaffMembers}
                  bizName={bizName}
                  activeTipAmount={activeTipAmount}
                  qrCodeVal={qrCodeVal}
                  businessPaymentAccounts={businessPaymentAccounts}
                  tipRefNumber={tipRefNumber}
                  showToast={showToast}
                  handlePay={handlePay}
                  setStep={setStep}
                />
              )}

              {step === 'processing' && (
                <Processing t={t} selectedWallet={selectedWallet} />
              )}

              {step === 'success_payment' && (
                <SuccessPayment
                  t={t}
                  selectedStaffMembers={selectedStaffMembers}
                  activeTipAmount={activeTipAmount}
                  setStep={setStep}
                />
              )}

              {step === 'leave_review' && (
                <LeaveReview
                  t={t}
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
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center space-y-2 relative z-10">
        <div className="flex items-center justify-center gap-1.5 text-xs text-nexoraSubtle">
          <ShieldCheck className="h-4 w-4 text-nexoraBrand" /> {t('customer.secure_footer')}
        </div>
        <p className="text-[10px] text-nexoraSubtle/70">{t('customer.copyright')}</p>
      </footer>
    </div>
  )
}
