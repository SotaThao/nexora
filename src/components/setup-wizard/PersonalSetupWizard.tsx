import React from 'react'
import { Check, LogIn, AlertTriangle, User, CreditCard, PartyPopper } from 'lucide-react'
import StepProfileSetup from '../register/steps/StepProfileSetup'
import StepPayoutSetup from '../register/steps/StepPayoutSetup'
import StepSuccess from '../register/steps/StepSuccess'
import PayoutEditModal from '../register/modals/PayoutEditModal'
import LanguageSwitcher from '../ui/LanguageSwitcher'

export default function PersonalSetupWizard({ wizard }) {
  const {
    t, currentLanguage, setLanguage,
    currentStep, setCurrentStep,
    errors,
    handleBackToLogin,
    stepName
  } = wizard

  const stepIcon = (step: number) => {
    switch (step) {
      case 1: return <User className="w-5 h-5" />
      case 2: return <CreditCard className="w-5 h-5" />
      case 3: return <PartyPopper className="w-5 h-5" />
      default: return null
    }
  }

  return (
    <div className="relative min-h-dvh bg-nexoraCanvas text-nexoraText font-sans overflow-x-hidden selection:bg-nexoraBrandSoft selection:text-nexoraBrand pb-12 print:bg-transparent print:p-0 print:pb-0 print:m-0">
      <div className="absolute top-1/4 left-1/4 h-56 w-56 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(66,72,216,0.04)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96 no-print"></div>
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.02)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-[450px] sm:w-[450px] no-print"></div>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 relative z-10 flex flex-col min-h-dvh justify-between no-print">
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-nexoraBorder pb-6 mb-8 gap-4">
          <div className="flex min-w-0 items-center">
            <img src="/assets/logo-nexora.png" alt="Nexora Logo" className="h-11 w-auto max-w-[200px] object-contain" />
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <LanguageSwitcher />
          </div>
        </header>

        <div className="mb-14 sm:mb-16 px-8 max-w-xl mx-auto w-full">
          <div className="relative flex items-center justify-between">
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 font-bold text-sm shrink-0
                      ${isActive
                        ? 'bg-white border-nexoraBrand text-nexoraBrand shadow-[0_4px_12px_rgba(70,72,216,0.18)] ring-4 ring-nexoraBrandSoft/80 scale-110'
                        : isCompleted
                          ? 'bg-gradient-to-tr from-nexoraElectric to-nexoraViolet border-transparent text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[3px]" /> : stepIcon(step)}
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

        <main className="flex-grow py-4">
          <div className="w-full bg-white rounded-2xl border border-nexoraBorder shadow-premium relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(70,72,216,0.03)] via-transparent to-transparent rounded-full pointer-events-none"></div>

            {errors.submit && (
              <div className="px-6 pt-6 sm:px-10 sm:pt-10">
                <div className="p-4 rounded-flox-cards bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <span>{t(errors.submit)}</span>
                </div>
              </div>
            )}

            {currentStep === 1 && <StepProfileSetup {...wizard} />}
            {currentStep === 2 && <StepPayoutSetup {...wizard} />}
            {currentStep === 3 && <StepSuccess {...wizard} />}
          </div>
        </main>
        
        {/* Modals for Payout Setup */}
        {wizard.editingMethod && React.createElement(PayoutEditModal as any, {
          editingMethod: wizard.editingMethod,
          setEditingMethod: wizard.setEditingMethod,
          editValue: wizard.editValue,
          setEditValue: wizard.setEditValue,
          editQrCode: wizard.editQrCode,
          setEditQrCode: wizard.setEditQrCode,
          editAccountName: wizard.editAccountName,
          setEditAccountName: wizard.setEditAccountName,
          isCapturing: wizard.isCapturing,
          modalError: wizard.modalError,
          setModalError: wizard.setModalError,
          currentLanguage: wizard.currentLanguage,
          savePayoutAccount: wizard.savePayoutAccount,
          handleModalImagePick: wizard.handleModalImagePick,
          handleModalTakePhoto: wizard.handleModalTakePhoto,
          handleModalClearQr: wizard.handleModalClearQr,
        })}

      </div>
    </div>
  )
}
