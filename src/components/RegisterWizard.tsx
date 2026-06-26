import React from 'react'
import { Check } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useRegisterForm } from './register/hooks/useRegisterForm'
import LanguageSwitcher from './ui/LanguageSwitcher'
import HomepageLink from './ui/HomepageLink'
import StepRoleSelect from './register/steps/StepRoleSelect'
import StepCredentials from './register/steps/StepCredentials'
import StepOtpVerify from './register/steps/StepOtpVerify'
import StepProfileSetup from './register/steps/StepProfileSetup'
import StepPayoutSetup from './register/steps/StepPayoutSetup'
import StepSuccess from './register/steps/StepSuccess'
import TermsModal from './register/modals/TermsModal'
import PayoutEditModal from './register/modals/PayoutEditModal'
import apiAuthAdapter from '../auth/adapters/apiAuthAdapter'
import { loadPendingRegistration } from '../auth/pendingRegistration'
import { useClearMerchantSetup } from '../data/hooks/useMerchantSetup'
import { useClearProfileSettings } from '../data/hooks/useProfileSettings'
import { logger } from '../utils/logger'

export default function RegisterWizard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshSession } = useAuth()
  const clearMerchantSetupMutation = useClearMerchantSetup()
  const clearProfileSettingsMutation = useClearProfileSettings()

  const showPersonalSuccessPopup = location.state?.showPersonalSuccessPopup || false
  const ssoEmail = location.state?.ssoEmail || ''
  const pendingRegistration = loadPendingRegistration(location.state?.resumeEmail)
  // `resumeOtpVerification` chỉ điều khiển nhảy thẳng tới bước OTP + prefill.
  // Việc TỰ ĐỘNG gửi lại email xác thực chỉ được phép ở luồng login-resume rõ ràng
  // (`location.state.resumeOtpVerification`), KHÔNG phải ngay sau khi đăng ký — vì
  // signup đã tự gửi OTP. Một `pendingRegistration` vừa lưu (vừa signup) nếu không
  // tách ra sẽ khiến reload bước OTP gọi lại `send-verification-email` → OTP trùng.
  const resumeFromLogin = Boolean(location.state?.resumeOtpVerification)
  const resumeOtpVerification = !showPersonalSuccessPopup && (
    resumeFromLogin || Boolean(pendingRegistration)
  )
  const autoSendVerificationOnResume = !showPersonalSuccessPopup && resumeFromLogin
  const resumeEmail = location.state?.resumeEmail || pendingRegistration?.email || ''
  const resumePassword = location.state?.resumePassword || pendingRegistration?.password || ''
  const resumeRole = location.state?.resumeRole || pendingRegistration?.role || null

  const handleRegisterAndLogin = async (registeredEmail) => {
    clearMerchantSetupMutation.mutate()
    clearProfileSettingsMutation.mutate()

    const ssoPrefillData = {
      email: registeredEmail,
      name: '',
      industry: '',
      address: '',
      phone: '',
      website: '',
      logo: null,
      paymentAccounts: { venmo: '', cashapp: '', zelle: '', vlinkpay: '' },
      reviewLinks: { googleReview: '', yelpReview: '', facebookReview: '', feedbackEmail: registeredEmail }
    }

    try {
      await refreshSession()
    } catch (e) {
      logger.error('Failed to get session in handleRegisterAndLogin', e)
    }
    
    if (form.role === 'personal') {
      navigate('/staff', { replace: true })
    } else {
      navigate('/onboarding', { state: { ssoPrefillData, isNewRegistration: true } })
    }
  }

  const formProps = {
    ssoEmail,
    isRedirectedFromSession: !!ssoEmail,
    initialStep: showPersonalSuccessPopup ? 3 : 0,
    initialRole: showPersonalSuccessPopup ? 'personal' : 'personal',
    resumeOtpVerification,
    autoSendVerificationOnResume,
    resumeEmail,
    resumePassword,
    resumeRole,
    onBackToLogin: () => {
      navigate(-1)
    },
    onRegisterSuccess: () => navigate('/login'),
    onRegisterAndLogin: handleRegisterAndLogin,
    onKybSuccess: () => {}
  }

  const form = useRegisterForm(formProps)
  const {
    currentStep, role, currentLanguage, setLanguage, t, getStepName,
    showTermsModal, setShowTermsModal, setTermsAccepted, setErrors,
    modalType,
    editingMethod, setEditingMethod,
    editValue, setEditValue,
    editQrCode, setEditQrCode,
    editAccountName, setEditAccountName,
    isCapturing, modalError, setModalError,
    savePayoutAccount, handleModalImagePick, handleModalTakePhoto, handleModalClearQr,
  } = form


  return (
    <div className="min-h-dvh bg-slate-50 text-inkBlue font-sans antialiased relative overflow-x-hidden selection:bg-nexoraBrandSoft selection:text-nexoraBrand">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 h-56 w-56 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(66,72,216,0.04)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96"></div>
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.02)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-[450px] sm:w-[450px]"></div>

      {/* Language Switcher */}
      <div className="absolute top-[max(1rem,var(--app-safe-area-top))] right-[max(1rem,var(--app-safe-area-right))] z-50">
        <LanguageSwitcher />
      </div>
      <HomepageLink />

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10 flex flex-col justify-center min-h-dvh">
        {/* Branding header */}
        <div className="text-center mb-6">
          <a href="/" className="inline-block">
            <img src="/assets/logo-nexora.png" alt="Nexora Logo" className="h-12 w-auto max-w-[220px] mx-auto object-contain" />
          </a>
        </div>

        {/* Wizard Steps indicator */}
        {currentStep > 0 && (
          <div className="mb-14 sm:mb-16 px-8 max-w-xl mx-auto w-full">
            <div className="relative flex items-center justify-between">
              {/* Connecting Track Line Container */}
              <div className="absolute left-5 right-5 top-5 -translate-y-1/2 h-[3px] -z-10">
                <div className="absolute inset-0 bg-slate-200/60 rounded-full"></div>
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-nexoraElectric via-nexoraElectricMid to-nexoraViolet rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStep - 1) / (role === 'business' ? 1 : 2)) * 100}%` }}
                ></div>
              </div>

              {(role === 'business' ? [1, 2] : [1, 2, 3]).map((step) => {
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
                      {isCompleted ? <Check className="w-5 h-5 stroke-[3px]" /> : step}
                    </div>
                    <div className="absolute top-full mt-3 w-32 text-center left-1/2 -translate-x-1/2">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-nexoraElectric/80 mb-0.5 block">
              {t('common.step_number', { step })}
                      </span>
                      <span className={`text-[11px] font-extrabold tracking-wide transition-colors duration-300 block whitespace-nowrap
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
          {currentStep === 2 && <StepOtpVerify {...form} />}
          {currentStep === 3 && role === 'personal' && <StepProfileSetup {...form} />}
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
      {React.createElement(PayoutEditModal as any, {
        editingMethod,
        setEditingMethod,
        editValue,
        setEditValue,
        editQrCode,
        setEditQrCode,
        editAccountName,
        setEditAccountName,
        isCapturing,
        modalError,
        setModalError,
        currentLanguage,
        savePayoutAccount,
        handleModalImagePick,
        handleModalTakePhoto,
        handleModalClearQr,
      })}
    </div>
  )
}
