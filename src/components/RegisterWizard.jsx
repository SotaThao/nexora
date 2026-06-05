import React from 'react'
import { Check } from 'lucide-react'
import { useRegisterForm } from './register/hooks/useRegisterForm'
import StepRoleSelect from './register/steps/StepRoleSelect'
import StepCredentials from './register/steps/StepCredentials'
import StepOtpVerify from './register/steps/StepOtpVerify'
import StepProfileSetup from './register/steps/StepProfileSetup'
import StepPayoutSetup from './register/steps/StepPayoutSetup'
import StepSuccess from './register/steps/StepSuccess'
import TermsModal from './register/modals/TermsModal'
import PayoutEditModal from './register/modals/PayoutEditModal'

export default function RegisterWizard(props) {
  const form = useRegisterForm(props)
  const {
    currentStep, role, currentLanguage, setLanguage, t, getStepName,
    showTermsModal, setShowTermsModal, setTermsAccepted, setErrors,
    modalType,
    editingMethod, setEditingMethod,
    editValue, setEditValue,
    editQrCode, setEditQrCode,
    editAccountName, setEditAccountName,
    isCapturing, modalError, setModalError,
    savePayoutAccount, handleModalFileChange, handleModalTakePhoto, handleModalClearQr,
  } = form

  return (
    <div className="min-h-dvh bg-slate-50 text-inkBlue font-sans antialiased relative overflow-x-hidden selection:bg-nexoraBrandSoft selection:text-nexoraBrand">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 h-56 w-56 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(66,72,216,0.04)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96"></div>
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.02)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-[450px] sm:w-[450px]"></div>

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

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10 flex flex-col justify-center min-h-dvh">
        {/* Branding header */}
        <div className="text-center mb-6">
          <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="w-12 h-12 mx-auto object-contain mb-2" />
          <h2 className="font-sans text-xl font-bold tracking-wide sm:text-2xl text-nexoraText">
            NEXORA <span className="ml-1.5 inline-flex align-middle text-nexoraBrand font-sans text-xs tracking-widest font-black uppercase bg-nexoraBrand/10 px-2 py-0.5 rounded border border-nexoraBrand/30">TOUCH</span>
          </h2>
          <p className="text-xs text-nexoraSubtle font-light tracking-wide mt-1">Cổng đăng ký Merchant Nexora & VLINKPAY KYB</p>
        </div>

        {/* Wizard Steps indicator */}
        {currentStep > 0 && (
          <div className="max-w-xl mx-auto w-full mb-10 px-4">
            <div className="relative flex items-center justify-between">
              {/* Connecting Track Line */}
              <div className="absolute left-0 top-5 -translate-y-1/2 w-full h-[3px] bg-slate-200/60 rounded-full -z-10"></div>
              <div
                className="absolute left-0 top-5 -translate-y-1/2 h-[3px] bg-gradient-to-r from-nexoraElectric via-nexoraElectricMid to-nexoraViolet rounded-full -z-10 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (role === 'business' ? 1 : 3)) * 100}%` }}
              ></div>

              {(role === 'business' ? [1, 2] : [1, 2, 3, 4]).map((step) => {
                const isActive = step === currentStep
                const isCompleted = step < currentStep
                return (
                  <div key={step} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 font-bold text-sm
                        ${isActive
                          ? 'bg-white border-nexoraBrand text-nexoraBrand shadow-[0_4px_12px_rgba(70,72,216,0.18)] ring-4 ring-nexoraBrandSoft/80 scale-110'
                          : isCompleted
                            ? 'bg-gradient-to-tr from-nexoraElectric to-nexoraViolet border-transparent text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5 stroke-[3px]" /> : step}
                    </div>
                    <div className="text-center mt-2.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-nexoraElectric/80 mb-0.5 block">
                        {currentLanguage === 'vi' ? `Bước ${step}` : `Step ${step}`}
                      </span>
                      <span className={`text-[11px] font-extrabold tracking-wide transition-colors duration-300 block
                        ${isActive ? 'text-nexoraBrand' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                        {getStepName(step)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Main Card container */}
        <div className="bg-white rounded-2xl border border-nexoraBorder shadow-premium overflow-hidden transition-all duration-500">
          {currentStep === 0 && <StepRoleSelect {...form} />}
          {currentStep === 1 && <StepCredentials {...form} />}
          {currentStep === 2 && role === 'business' && <StepOtpVerify {...form} />}
          {currentStep === 2 && role === 'personal' && <StepProfileSetup {...form} />}
          {currentStep === 3 && role === 'personal' && <StepPayoutSetup {...form} />}
          {currentStep === 4 && role === 'personal' && <StepSuccess {...form} />}
        </div>
      </div>

      {/* Terms & Conditions Modal Overlay */}
      <TermsModal
        open={showTermsModal}
        currentLanguage={currentLanguage}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true)
          setErrors(prev => ({ ...prev, terms: '' }))
          setShowTermsModal(false)
        }}
        modalType={modalType}
      />

      {/* Payout Configuration Edit Modal Overlay */}
      <PayoutEditModal
        editingMethod={editingMethod}
        setEditingMethod={setEditingMethod}
        editValue={editValue}
        setEditValue={setEditValue}
        editQrCode={editQrCode}
        setEditQrCode={setEditQrCode}
        editAccountName={editAccountName}
        setEditAccountName={setEditAccountName}
        isCapturing={isCapturing}
        modalError={modalError}
        setModalError={setModalError}
        currentLanguage={currentLanguage}
        savePayoutAccount={savePayoutAccount}
        handleModalFileChange={handleModalFileChange}
        handleModalTakePhoto={handleModalTakePhoto}
        handleModalClearQr={handleModalClearQr}
      />
    </div>
  )
}
