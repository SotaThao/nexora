import React from 'react'
import {
  Sparkles, Building2, Users, Download,
  ArrowRight, ArrowLeft, AlertTriangle,
  ShieldCheck, Check, LogIn, X
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import useSetupWizard from './setup-wizard/hooks/useSetupWizard'
import Step1BusinessInfo from './setup-wizard/steps/Step1BusinessInfo'
import Step2StaffTouchpoints from './setup-wizard/steps/Step2StaffTouchpoints'
import Step3Download from './setup-wizard/steps/Step3Download'
import PayoutSetupModal from './setup-wizard/PayoutSetupModal'
import { getCustomerAppBaseUrl } from '../utils/webUrlBase'
import PersonalSetupWizard from './setup-wizard/PersonalSetupWizard'
import usePersonalSetupWizard from './setup-wizard/hooks/usePersonalSetupWizard'
import { buildPublicQrImageUrl } from '../data/repositories/publicQr'
import LanguageSwitcher from './ui/LanguageSwitcher'
import QrImage from './ui/QrImage'

export { renderTextWithGoldStars, getTouchpointIcon } from './setup-wizard/constants'

export default function SetupWizard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, session, refreshSession } = useAuth()

  const ssoPrefillData = location.state?.ssoPrefillData || session?.ssoPrefillData
  const isKyb = session?.verificationStatus === 'kyb_approved'

  const handleBackToLogin = async () => {
    await logout()
    navigate('/login')
  }

  const handleComplete = async () => {
    // Onboarding just flipped the account to Active server-side. Refresh the
    // auth session so hasCompletedOnboarding becomes true before we land on
    // /dashboard, otherwise the RequireOnboarded gate would bounce us back.
    try {
      await refreshSession()
    } catch {
      // Non-fatal: navigate anyway; the gate re-derives on next session load.
    }
    navigate('/dashboard')
  }

  const wizard = useSetupWizard({
    initialBusinessInfo: ssoPrefillData,
    onBackToLogin: handleBackToLogin,
    hasKyb: isKyb,
    hasCompletedOnboarding: session?.hasCompletedOnboarding === true,
  })

  const personalWizard = usePersonalSetupWizard({
    onBackToLogin: handleBackToLogin
  })

  if (session?.role === 'staff' || session?.role === 'personal') {
    return <PersonalSetupWizard wizard={personalWizard} />
  }

  const {
    currentLanguage, setLanguage, t,
    currentStep, setCurrentStep, isSsoLocked, isStepSaving,
    businessInfo, setBusinessInfo,
    merchantPaymentMethods,
    reviewLinks, setReviewLinks,
    staffList,
    newStaff, setNewStaff,
    touchPoints,
    newTouchpoint, setNewTouchpoint,
    editingTpId, setEditingTpId,
    editingTpName, setEditingTpName, editingTpNameError,
    editingTpType, setEditingTpType,
    previewingTp, setPreviewingTp,
    payoutSetupOpen, setPayoutSetupOpen,
    payoutSetupWallet,
    tempPayoutValues,
    isConsentChecked, setIsConsentChecked,
    errors,
    prefillDemo,
    handleLogoFile,
    validateStep,
    handleNext,
    handleBack,
    handleAddStaff,
    handleToggleWallet,
    openPayoutSetup,
    handlePayoutSubmit,
    handleRemoveStaff,
    handleAddTouchpoint,
    handleRemoveTouchpoint,
    handleStartEditTouchpoint,
    handleSaveTouchpoint,
    stepName
  } = wizard

  const handleCompleteSetup = () => {
    wizard.handleCompleteSetup(handleComplete)
  }

  const stepIcon = (step) => {
    switch (step) {
      case 1: return <Building2 className="w-5 h-5" />
      case 2: return <Users className="w-5 h-5" />
      case 3: return <Download className="w-5 h-5" />
      default: return null
    }
  }

  return (
    <div className="relative min-h-dvh bg-nexoraCanvas text-nexoraText font-sans overflow-x-hidden selection:bg-nexoraBrandSoft selection:text-nexoraBrand pb-12 print:bg-transparent print:p-0 print:pb-0 print:m-0">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 h-56 w-56 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(66,72,216,0.04)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96 no-print"></div>
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.02)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-[450px] sm:w-[450px] no-print"></div>

      {/* Main Container */}
      <div
        className="max-w-6xl mx-auto px-4 pb-6 sm:pb-8 relative z-10 flex flex-col min-h-dvh justify-between no-print"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
      >

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-nexoraBorder pb-6 mb-8 gap-4">
          <div className="flex min-w-0 items-center">
            <img src="/assets/logo-nexora.png" alt="Nexora Logo" className="h-11 w-auto max-w-[200px] object-contain" />
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <LanguageSwitcher />
          </div>
        </header>

        {/* Wizard Progress Bar */}
        <div className="mb-14 sm:mb-16 px-8 max-w-xl mx-auto w-full">
          <div className="relative flex items-center justify-between">
            {/* Connecting Track Line Container */}
            <div className="absolute left-5 right-5 top-5 -translate-y-1/2 h-[3px] -z-10">
              <div className="absolute inset-0 bg-slate-200/60 rounded-full"></div>
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-nexoraElectric via-nexoraElectricMid to-nexoraViolet rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
              ></div>
            </div>

            {[1, 2, 3].map((step) => {
              const isActive = step === currentStep
              const isCompleted = step < currentStep
              return (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 font-bold cursor-pointer text-sm shrink-0
                      ${isActive
                        ? 'bg-white border-nexoraBrand text-nexoraBrand shadow-[0_4px_12px_rgba(70,72,216,0.18)] ring-4 ring-nexoraBrandSoft/80 scale-110'
                        : isCompleted
                          ? 'bg-gradient-to-tr from-nexoraElectric to-nexoraViolet border-transparent text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    onClick={() => {
                      if (step <= currentStep || (step > currentStep && validateStep())) {
                        setCurrentStep(step)
                      }
                    }}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[3px]" /> : step}
                  </div>
                  <div className="absolute top-full mt-3 w-40 text-center left-1/2 -translate-x-1/2">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-nexoraElectric/80 mb-0.5 block">
              {t('common.step_number', { step })}
                    </span>
                    <span className={`text-[11px] font-extrabold tracking-wide transition-colors duration-300 block whitespace-nowrap
                      ${isActive ? 'text-nexoraBrand' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                      {stepName(step)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Wizard Panel (Step Body) */}
        <main className="flex-grow py-4">
          <div className="w-full bg-white rounded-2xl p-5 sm:p-8 md:p-10 border border-nexoraBorder shadow-premium relative overflow-hidden flex flex-col justify-between">

            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(70,72,216,0.03)] via-transparent to-transparent rounded-full pointer-events-none"></div>

            {/* Error Banner */}
            {(errors.staffList || errors.submit) && (
              <div className="mb-6 p-4 rounded-flox-cards bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <span>{errors.staffList || errors.submit}</span>
              </div>
            )}

            {/* Step Content */}
            {currentStep === 1 && (
              <Step1BusinessInfo
                t={t}
                currentLanguage={currentLanguage}
                isSsoLocked={isSsoLocked}
                businessInfo={businessInfo}
                setBusinessInfo={setBusinessInfo}
                reviewLinks={reviewLinks}
                setReviewLinks={setReviewLinks}
                errors={errors}
                setErrors={wizard.setErrors}
                handleLogoFile={handleLogoFile}
              />
            )}

            {currentStep === 2 && (
              <Step2StaffTouchpoints
                t={t}
                currentLanguage={currentLanguage}
                isSsoLocked={isSsoLocked}
                staffList={staffList}
                newStaff={newStaff}
                setNewStaff={setNewStaff}
                touchPoints={touchPoints}
                newTouchpoint={newTouchpoint}
                setNewTouchpoint={setNewTouchpoint}
                editingTpId={editingTpId}
                setEditingTpId={setEditingTpId}
                editingTpName={editingTpName}
                setEditingTpName={setEditingTpName}
                editingTpNameError={editingTpNameError}
                editingTpType={editingTpType}
                setEditingTpType={setEditingTpType}
                errors={errors}
                businessInfo={businessInfo}
                merchantPaymentMethods={merchantPaymentMethods}
                handleAddStaff={handleAddStaff}
                handleToggleWallet={handleToggleWallet}
                openPayoutSetup={openPayoutSetup}
                handleRemoveStaff={handleRemoveStaff}
                handleAddTouchpoint={handleAddTouchpoint}
                handleRemoveTouchpoint={handleRemoveTouchpoint}
                handleStartEditTouchpoint={handleStartEditTouchpoint}
                handleSaveTouchpoint={handleSaveTouchpoint}
                setPreviewingTp={setPreviewingTp}
              />
            )}

            {currentStep === 3 && (
              <Step3Download
                t={t}
                currentLanguage={currentLanguage}
                businessInfo={businessInfo}
                staffList={staffList}
                touchPoints={touchPoints}
                isConsentChecked={isConsentChecked}
                setIsConsentChecked={setIsConsentChecked}
              />
            )}

            {/* Navigation Buttons */}
            <div className="border-t border-nexoraRule mt-8 pt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {currentStep > 1 ? (
                <button
                  onClick={handleBack}
                  className="min-h-11 w-full justify-center px-5 py-2.5 rounded-flox-inputs border border-nexoraBorder hover:bg-nexoraCanvas bg-white text-nexoraText font-semibold text-sm flex items-center gap-1.5 transition-all shadow-sm sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                </button>
              ) : handleBackToLogin ? (
                <button
                  onClick={handleBackToLogin}
                  className="min-h-11 w-full justify-center px-5 py-2.5 rounded-flox-inputs border border-nexoraBorder hover:bg-nexoraCanvas bg-white text-nexoraText font-semibold text-sm flex items-center gap-1.5 transition-all shadow-sm sm:w-auto"
                >
                  <LogIn className="w-4 h-4 text-nexoraSubtle" /> {t('setup.back_to_login')}
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={isStepSaving}
                  className="min-h-11 w-full justify-center px-6 py-2.5 rounded-flox-buttons bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 transition-opacity text-white font-extrabold text-sm flex items-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(43,89,255,0.25)] sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isStepSaving ? t('common.saving') : t('common.next')} {!isStepSaving && <ArrowRight className="w-4 h-4" />}
                </button>
              ) : (
                <button
                  onClick={handleCompleteSetup}
                  disabled={!isConsentChecked}
                  className={`min-h-11 w-full justify-center px-8 py-3 rounded-flox-buttons text-white font-extrabold text-sm flex items-center gap-2 transition-all sm:w-auto
                    ${!isConsentChecked
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 transition-opacity shadow-[0_8px_25px_rgba(43,89,255,0.3)]'
                    }`}
                >
                  {t('setup.launch_dashboard_btn')} <ArrowRight className="w-[18px] h-[18px] stroke-[3px]" />
                </button>
              )}
            </div>

          </div>
        </main>

        {/* Footer info */}
        <footer className="text-center text-nexoraSubtle text-xs py-4 border-t border-nexoraRule mt-8">
          &copy; {new Date().getFullYear()} Nexora Touch by VLINKPAY. All rights reserved. Secured and compliant tip redirects.
        </footer>

      </div>

      <PayoutSetupModal
        open={payoutSetupOpen}
        walletKey={payoutSetupWallet}
        staffName={businessInfo.name || 'Business Name'}
        initialValue={tempPayoutValues.value}
        initialQrCode={tempPayoutValues.qrCode}
        onClose={() => setPayoutSetupOpen(false)}
        onSubmit={handlePayoutSubmit}
      />

      {/* Zoom QR Code Preview Modal */}
      {previewingTp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 modal-overlay-safe backdrop-blur-sm">
          <div className="w-full max-w-md overflow-x-hidden overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-scaleUp relative max-h-[min(92dvh,calc(100dvh-var(--app-safe-area-top)-var(--app-safe-area-bottom)-1.5rem))]">
            <button
              onClick={() => setPreviewingTp(null)}
              className="modal-close-btn absolute right-2 top-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title={t('setup.close')}
              aria-label={t('setup.close')}
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-800 mb-4 pr-8">
              {t('dashboard.touchpoints.tabs.stations')} - {previewingTp.name}
            </h3>

            <div className="flex w-full flex-col items-center">
              <div className="mx-auto flex aspect-[2/3] w-full max-w-sm min-w-0 flex-col items-center justify-between rounded-2xl bg-nexoraCanvas border border-nexoraBorder/80 p-4 text-nexoraText shadow-md qr-print-card">
                <div className="flex items-center gap-1 justify-center qr-print-brand-header">
                  <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-3.5 w-3.5 object-contain qr-print-brand-logo" />
                  <span className="text-[8px] font-black tracking-wider text-slate-800 qr-print-brand-text">NEXORA</span>
                </div>

                <div className="w-full text-center">
                  <div className="text-[10px] font-extrabold uppercase text-nexoraBrand tracking-wide qr-print-biz-name mx-auto">
                    {previewingTp.name}
                  </div>
                  <div className="text-[7.5px] font-bold text-nexoraMuted qr-print-staff-info mx-auto">
                    {businessInfo.name || 'Your Spa Salon'}
                  </div>
                </div>

                <div className="flex aspect-square w-full max-w-full min-w-0 items-center justify-center overflow-hidden rounded-lg border border-nexoraBorder/60 bg-white p-2 shadow-inner qr-print-qr-wrapper">
                  <QrImage
                    src={buildPublicQrImageUrl(
                      `${getCustomerAppBaseUrl()}?flow=customer&merchant=${encodeURIComponent(businessInfo.name || 'Your Business')}&tech=tp/${previewingTp.id}`,
                      300,
                    )}
                    alt="QR Preview"
                    className="h-full w-full max-h-full max-w-full qr-print-qr-image"
                  />
                </div>

                <div className="text-[8px] font-extrabold uppercase text-nexoraMuted tracking-wider qr-print-scan-text leading-tight mx-auto">
                  {t('customer.scan_to_tip_review')}
                </div>

                <div className="flex items-center gap-1 text-[7.5px] font-bold text-nexoraSubtle qr-print-footer">
                  <ShieldCheck className="h-2.5 w-2.5 text-nexoraBrand shrink-0" />
                  <span>{t('components.SetupWizard.secureRedirect')}</span>
                </div>
              </div>

              <div className="mt-4 w-full text-center">
                <p className="text-[10px] font-mono text-slate-400 select-all truncate bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                  {`${getCustomerAppBaseUrl()}?flow=customer&merchant=${encodeURIComponent(businessInfo.name || 'Your Business')}&tech=tp/${previewingTp.id}`}
                </p>
              </div>

              <div className="mt-5 flex justify-end gap-2 w-full border-t border-slate-100 pt-3">
                <button
                  onClick={() => setPreviewingTp(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition w-full"
                >
                  {t('setup.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print-only container */}
      <div className="print-only-container qr-modal-backdrop">
        <div className="qr-modal-container">
          <h2 className="qr-print-title">{t('components.SetupWizard.businessQrLobby')}</h2>
          <p className="qr-print-subtitle">{t('customer.step_form_title')}</p>

          <div className="qr-print-card">
            <div className="flex items-center gap-1 justify-center qr-print-brand-header">
              <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-3.5 w-3.5 object-contain qr-print-brand-logo" />
              <span className="text-[8px] font-black tracking-wider text-slate-800 qr-print-brand-text">NEXORA</span>
            </div>

            <div className="w-full text-center">
              <div className="text-[10px] font-extrabold uppercase text-nexoraBrand tracking-wide qr-print-biz-name mx-auto">{t('components.SetupWizard.generalLobbyQr')}</div>
              <div className="text-[7.5px] font-bold text-nexoraMuted qr-print-staff-info mx-auto">{businessInfo.name || 'Your Salon'}</div>
            </div>

            <div className="qr-print-qr-wrapper">
              <QrImage
                src={buildPublicQrImageUrl(
                  `${getCustomerAppBaseUrl()}?flow=customer&merchant=${encodeURIComponent(businessInfo.name || 'Your Business')}`,
                  150,
                )}
                alt="Scan QR code to tip and review"
                className="qr-print-qr-image"
              />
            </div>

            <div className="text-[8px] font-extrabold uppercase text-nexoraMuted tracking-wider qr-print-scan-text leading-tight mx-auto">
              {t('customer.scan_to_tip_review')}
            </div>

            <div className="flex items-center gap-1 text-[7.5px] font-bold text-nexoraSubtle qr-print-footer">
              <ShieldCheck className="h-2.5 w-2.5 text-nexoraBrand shrink-0" />
              <span>{t('components.SetupWizard.secureRedirect')}</span>
            </div>
          </div>

          <p className="qr-print-url">
            {window.location.host}/touch/tp-main
          </p>
        </div>
      </div>
    </div>
  )
}
