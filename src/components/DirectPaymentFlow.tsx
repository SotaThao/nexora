import React from 'react'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import useDirectPaymentFlow from './direct-payment/hooks/useDirectPaymentFlow'
import DirectPaymentReview from './direct-payment/steps/DirectPaymentReview'
import WalletDetails from './customer-flow/steps/WalletDetails'
import Processing from './customer-flow/steps/Processing'
import DirectPaymentSuccess from './direct-payment/steps/DirectPaymentSuccess'

export default function DirectPaymentFlow() {
  const flow = useDirectPaymentFlow()

  const {
    currentLanguage,
    setLanguage,
    t,
    showToast,
    pageQuery,
    businessName,
    logoUrl,
    step,
    setStep,
    selectedAmount,
    setSelectedAmount,
    customAmount,
    setCustomAmount,
    activeAmount,
    walletOptions,
    selectedWalletObj,
    selectedWallet,
    businessRecipient,
    tipPaymentMethodsData,
    currentPaymentId,
    activePaymentMethod,
    handleSelectWallet,
    handleConfirmPayment,
  } = flow

  const disablePaymentSelection =
    activeAmount < 1 || activeAmount > 10000 || Number.isNaN(activeAmount)

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

          {pageQuery.isError ? (
            <div className="space-y-4 py-12 text-center animate-fadeIn">
              <AlertTriangle className="mx-auto h-12 w-12 text-nexoraDanger" />
              <h3 className="text-lg font-extrabold text-nexoraText">
                {t('direct_payment.page_not_found_title')}
              </h3>
              <p className="text-xs text-nexoraMuted">{t('direct_payment.page_not_found_desc')}</p>
            </div>
          ) : null}

          {pageQuery.isSuccess ? (
            <>
              {step === 'review' ? (
                <DirectPaymentReview
                  t={t}
                  businessName={businessName}
                  logoUrl={logoUrl}
                  selectedAmount={selectedAmount}
                  setSelectedAmount={setSelectedAmount}
                  customAmount={customAmount}
                  setCustomAmount={setCustomAmount}
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
                  selectedStaffMembers={businessRecipient}
                  selectedTips={{}}
                  customTips={{}}
                  bizName={businessName}
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
                  paymentLinkData={null}
                  tipPaymentMethodsData={tipPaymentMethodsData}
                />
              ) : null}

              {step === 'success' ? (
                <DirectPaymentSuccess
                  t={t}
                  businessName={businessName}
                  activeAmount={activeAmount}
                  selectedWalletObj={selectedWalletObj}
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
