import React, { useMemo } from 'react'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { getErrorI18nKey } from '../data/errorCodes'
import { getApiErrorCode, isApiError } from '../types/domain'
import useStaffDirectPaymentFlow from './staff-direct-payment/hooks/useStaffDirectPaymentFlow'
import {
  DIRECT_PAYMENT_MIN_AMOUNT,
  STAFF_DIRECT_PAYMENT_MAX_AMOUNT,
} from '../utils/currencyInput'
import DirectPaymentReview from './direct-payment/steps/DirectPaymentReview'
import WalletDetails from './customer-flow/steps/WalletDetails'
import Processing from './customer-flow/steps/Processing'
import DirectPaymentSuccess from './direct-payment/steps/DirectPaymentSuccess'

export default function StaffDirectPaymentFlow() {
  const flow = useStaffDirectPaymentFlow()

  const {
    currentLanguage,
    setLanguage,
    t,
    showToast,
    pageQuery,
    displayName,
    photoUrl,
    step,
    setStep,
    selectedAmount,
    setSelectedAmount,
    customAmount,
    handleCustomAmountChange,
    activeAmount,
    walletOptions,
    selectedWalletObj,
    selectedWallet,
    staffRecipient,
    tipPaymentMethodsData,
    currentPaymentId,
    activePaymentMethod,
    handleSelectWallet,
    handleConfirmPayment,
  } = flow

  const disablePaymentSelection =
    activeAmount < DIRECT_PAYMENT_MIN_AMOUNT
    || activeAmount > STAFF_DIRECT_PAYMENT_MAX_AMOUNT
    || Number.isNaN(activeAmount)

  const pageErrorContent = useMemo(() => {
    if (!pageQuery.isError) return null
    const err = pageQuery.error
    const code = getApiErrorCode(err, '')
    const status = isApiError(err) ? err.status : 0

    if (code === 'STAFF_PROFILE_NOT_FOUND' || status === 404) {
      return {
        title: t('staff_direct_payment.page_not_found_title'),
        desc: t('staff_direct_payment.page_not_found_desc'),
      }
    }
    if (code === 'COMMON_RATE_LIMIT_EXCEEDED' || status === 429) {
      const message = t('errors.common_rate_limit_exceeded')
      return { title: message, desc: message }
    }

    const message = t(getErrorI18nKey(code || 'unknown_error'))
    return { title: message, desc: t('errors.generic') }
  }, [pageQuery.isError, pageQuery.error, t])

  return (
    <div className="relative flex min-h-dvh flex-col justify-between bg-nexoraCanvas pb-8 font-sans text-nexoraText selection:bg-nexoraBrandSoft selection:text-nexoraBrand">
      <div className="pointer-events-none absolute left-0 top-0 h-[30%] w-full bg-gradient-to-b from-blue-50/50 to-transparent" />

      <div className="absolute right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-nexoraBorder bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={() => setLanguage('vi')}
          className={`rounded px-2 py-0.5 text-xs font-bold transition ${currentLanguage === 'vi' ? 'bg-nexoraBrand text-white' : 'text-nexoraSubtle hover:text-nexoraText'}`}
        >
          VI
        </button>
        <span className="text-xs text-nexoraBorder">|</span>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`rounded px-2 py-0.5 text-xs font-bold transition ${currentLanguage === 'en' ? 'bg-nexoraBrand text-white' : 'text-nexoraSubtle hover:text-nexoraText'}`}
        >
          EN
        </button>
      </div>

      <main className="relative z-10 flex flex-grow items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-nexoraBorder bg-white p-6 shadow-premium">
          {pageQuery.isLoading ? (
            <div className="space-y-4 py-12 text-center animate-fadeIn">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-nexoraBrand border-t-transparent" />
              <p className="text-sm font-medium text-nexoraMuted">{t('common.loading')}</p>
            </div>
          ) : null}

          {pageErrorContent ? (
            <div className="space-y-4 py-12 text-center animate-fadeIn">
              <AlertTriangle className="mx-auto h-12 w-12 text-nexoraDanger" />
              <h3 className="text-lg font-extrabold text-nexoraText">
                {pageErrorContent.title}
              </h3>
              <p className="text-xs text-nexoraMuted">{pageErrorContent.desc}</p>
            </div>
          ) : null}

          {pageQuery.isSuccess ? (
            <>
              {step === 'review' ? (
                <DirectPaymentReview
                  t={t}
                  businessName={displayName}
                  logoUrl={photoUrl}
                  recipientName={displayName}
                  recipientSubtitle={t('staff_direct_payment.pay_to_staff')}
                  amountRangeHint=""
                  reviewTitle={t('staff_direct_payment.review_payment_title')}
                  reviewDesc={t('staff_direct_payment.review_payment_desc')}
                  noMethodsTitle={t('staff_direct_payment.no_methods_title')}
                  noMethodsDesc={t('staff_direct_payment.no_methods_desc')}
                  selectedAmount={selectedAmount}
                  setSelectedAmount={setSelectedAmount}
                  customAmount={customAmount}
                  onCustomAmountChange={handleCustomAmountChange}
                  activeAmount={activeAmount}
                  walletOptions={walletOptions}
                  isLoadingMethods={false}
                  onSelectWallet={handleSelectWallet}
                  disablePaymentSelection={disablePaymentSelection}
                />
              ) : null}

              {step === 'processing' ? (
                <Processing t={t} selectedWallet={selectedWallet} />
              ) : null}

              {step === 'wallet_details' && selectedWalletObj ? (
                <WalletDetails
                  t={t}
                  currentLanguage={currentLanguage}
                  selectedWalletObj={selectedWalletObj}
                  selectedStaffMembers={staffRecipient}
                  selectedTips={{}}
                  customTips={{}}
                  bizName={displayName}
                  activeTipAmount={activeAmount}
                  qrCodeVal={activePaymentMethod?.imageUrl || null}
                  businessPaymentAccounts={{}}
                  tipRefNumber={currentPaymentId ? String(currentPaymentId).slice(0, 8).toUpperCase() : 'PAY'}
                  currentTipId={currentPaymentId}
                  showToast={showToast}
                  handlePay={() => {}}
                  handleConfirmTip={handleConfirmPayment}
                  isApiMode
                  setStep={setStep}
                  backStep="review"
                  paymentMode
                  paymentCopyScope="staff"
                  paymentLinkData={null}
                  tipPaymentMethodsData={tipPaymentMethodsData}
                />
              ) : null}

              {step === 'success' ? (
                <DirectPaymentSuccess
                  t={t}
                  businessName={displayName}
                  activeAmount={activeAmount}
                  selectedWalletObj={selectedWalletObj}
                  successDescKey="staff_direct_payment.success_desc"
                />
              ) : null}
            </>
          ) : null}
        </div>
      </main>

      <footer className="relative z-10 space-y-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-nexoraSubtle">
          <ShieldCheck className="h-4 w-4 text-nexoraBrand" /> {t('customer.secure_footer')}
        </div>
        <p className="text-[10px] text-nexoraSubtle/70">{t('customer.copyright')}</p>
      </footer>
    </div>
  )
}
