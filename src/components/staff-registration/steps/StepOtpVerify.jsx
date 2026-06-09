import React, { useState } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
import { renderLabel } from '../../../contexts/LanguageContext'

export default function StepOtpVerify({
  showOtpInput,
  regEmail, setRegEmail,
  regConfirmEmail, setRegConfirmEmail,
  regPassword, setRegPassword,
  regReferralLink, setRegReferralLink,
  regErrors, setRegErrors,
  showPassword, setShowPassword,
  otpCode, setOtpCode,
  otpError,
  resendTimer, setResendTimer,
  currentLanguage, t,
  isSelfServe,
  inviteData,
  termsAccepted, setTermsAccepted,
  handleRegisterSubmit,
  handleVerifyOtp,
  autoFillOtp,
  setStep,
  setJoinPath,
  setShowOtpInput,
  isDemoToolsEnabled = false,
}) {
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [modalType, setModalType] = useState('terms')
  return (
    <>
      {/* STEP 1: Register Account & Activate */}
      {!showOtpInput && (
        <form onSubmit={handleRegisterSubmit} className="space-y-6 py-4">
          <div className="text-center space-y-1.5">
            <h3 className="text-base font-extrabold text-nexoraText uppercase tracking-wide">
              {t('components.staff_registration.steps.StepOtpVerify.label1RegisterAccount')}
            </h3>
            <p className="text-xs text-nexoraMuted leading-relaxed max-w-sm mx-auto">
              {t('components.staff_registration.steps.StepOtpVerify.registerANewTechnician')}
            </p>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {renderLabel(t('components.staff_registration.steps.StepOtpVerify.emailAddress'))}
              </label>
              <input
                type="email"
                className={`mt-1.5 h-10 w-full rounded-lg border ${regErrors.email ? 'border-nexoraDanger focus:border-nexoraDanger focus:ring-2 focus:ring-nexoraDanger/20' : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'} px-3 text-xs outline-none transition-all`}
                placeholder={t('components.staff_registration.steps.StepOtpVerify.phExampleEmail')}
                value={regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value)
                  setRegErrors(prev => ({ ...prev, email: '' }))
                }}
                required
              />
              {regErrors.email && <p className="mt-1 text-[10px] font-bold text-nexoraDanger">{regErrors.email}</p>}
            </div>

            {/* Confirm Email */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {renderLabel(t('components.staff_registration.steps.StepOtpVerify.confirmEmailAddress'))}
              </label>
              <input
                type="email"
                className={`mt-1.5 h-10 w-full rounded-lg border ${regErrors.confirmEmail ? 'border-nexoraDanger focus:border-nexoraDanger focus:ring-2 focus:ring-nexoraDanger/20' : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'} px-3 text-xs outline-none transition-all`}
                placeholder={t('components.staff_registration.steps.StepOtpVerify.phExampleEmail')}
                value={regConfirmEmail}
                onChange={(e) => {
                  setRegConfirmEmail(e.target.value)
                  setRegErrors(prev => ({ ...prev, confirmEmail: '' }))
                }}
                required
              />
              {regErrors.confirmEmail && <p className="mt-1 text-[10px] font-bold text-nexoraDanger">{regErrors.confirmEmail}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {renderLabel(t('components.staff_registration.steps.StepOtpVerify.password'))}
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`h-10 w-full rounded-lg border ${regErrors.password ? 'border-nexoraDanger focus:border-nexoraDanger focus:ring-2 focus:ring-nexoraDanger/20' : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'} pl-3 pr-10 text-xs outline-none transition-all`}
                  placeholder={t('components.staff_registration.steps.StepOtpVerify.phPassword')}
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value)
                    setRegErrors(prev => ({ ...prev, password: '' }))
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nexoraSubtle hover:text-nexoraText focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {regErrors.password && <p className="mt-1 text-[10px] font-bold text-nexoraDanger">{regErrors.password}</p>}
            </div>

            {/* Referral Link */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {t('components.staff_registration.steps.StepOtpVerify.referralLinkSalon')}
              </label>
              <input
                type="text"
                className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-xs outline-none transition-all ${
                  inviteData?.biz
                    ? 'bg-nexoraSurfaceMuted text-nexoraSubtle border-nexoraBorder cursor-not-allowed'
                    : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:outline-none'
                }`}
                placeholder={t('components.staff_registration.steps.StepOtpVerify.phReferralCode')}
                value={regReferralLink}
                onChange={(e) => setRegReferralLink(e.target.value)}
                disabled={!!inviteData?.biz}
              />
            </div>

            {/* Implicit Consent Terms and Privacy Note */}
            <div className="text-[11px] text-nexoraMuted leading-normal text-center font-sans max-w-sm mx-auto pt-1 pb-2">
              {t('register.consent.prefix')} <span className="font-bold text-nexoraText">{t('register.consent.action')}</span>, {t('register.consent.middle')}{' '}
              <button
                type="button"
                onClick={() => {
                  setModalType('terms')
                  setShowTermsModal(true)
                }}
                className="text-nexoraTealAlt hover:underline font-bold"
              >
                {t('register.consent.terms')}
              </button>{' '}
              {t('register.consent.and')}{' '}
              <button
                type="button"
                onClick={() => {
                  setModalType('privacy')
                  setShowTermsModal(true)
                }}
                className="text-nexoraTealAlt hover:underline font-bold"
              >
                {t('register.consent.privacy')}
              </button>.
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-nexoraRule">
            <button
              type="button"
              onClick={() => {
                if (isSelfServe) {
                  setJoinPath(null)
                }
                setStep(0)
              }}
              className="h-10 px-4 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-nexoraSurfaceMuted transition"
            >
              {t('common.back')}
            </button>
            <button
              type="submit"
              className="flex-grow h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
            >
              {t('common.next')}
            </button>
          </div>
        </form>
      )}

      {showOtpInput && (
        <form onSubmit={handleVerifyOtp} className="space-y-6 py-4">
          <div className="text-center space-y-1.5">
            <h3 className="text-base font-extrabold text-nexoraText uppercase tracking-wide">
              {t('components.staff_registration.steps.StepOtpVerify.label1ActivateAccount')}
            </h3>
            <p className="text-xs text-nexoraMuted leading-relaxed max-w-sm mx-auto">
              {t('components.staff_registration.steps.StepOtpVerify.enterTheOtpCode')}
            </p>
          </div>

          <div className="space-y-4">
            {/* Single OTP Input */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {renderLabel(t('components.staff_registration.steps.StepOtpVerify.enterOtpCode'))}
              </label>
              <input
                type="text"
                className="mt-1.5 h-12 w-full rounded-lg border border-nexoraBorder px-4 text-center font-mono font-black text-lg text-nexoraText focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:outline-none transition-all"
                placeholder={t('components.staff_registration.steps.StepOtpVerify.phExampleOtp')}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value)
                }}
                required
              />
            </div>

            {otpError && <p className="text-xs font-bold text-center text-nexoraDanger">{otpError}</p>}

            <div className="text-center">
              <span className="text-[10px] text-nexoraSubtle font-bold block">
                {resendTimer > 0
                  ? `Resend code in ${resendTimer}s`
                  : (
                    <button
                      type="button"
                      onClick={() => setResendTimer(30)}
                      className="text-nexoraBrand hover:underline"
                    >
                      Resend Verification Code
                    </button>
                  )
                }
              </span>
            </div>
          </div>

          {isDemoToolsEnabled && (
            <div className="p-3 border border-dashed border-nexoraBrand/40 bg-nexoraBrandSoft/20 rounded-xl flex items-center justify-between gap-3 max-w-xs mx-auto">
              <span className="text-[10px] text-nexoraBrand font-bold">Simulator Helper:</span>
              <button
                type="button"
                onClick={autoFillOtp}
                className="px-2.5 py-1 bg-nexoraBrand text-white rounded text-[10px] font-black uppercase hover:bg-opacity-90 shadow-sm"
              >
                Auto-fill (1234)
              </button>
            </div>
          )}

          <div className="pt-4 flex gap-3 border-t border-nexoraRule">
            <button
              type="button"
              onClick={() => setShowOtpInput(false)}
              className="h-10 px-4 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-nexoraSurfaceMuted transition"
            >
              {t('common.back')}
            </button>
            <button
              type="submit"
              className="flex-grow h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
            >
              {t('components.staff_registration.steps.StepOtpVerify.verifyAndActivate')}
            </button>
          </div>
        </form>
      )}
      <TermsModal
        open={showTermsModal}
        currentLanguage={currentLanguage}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true)
          setRegErrors(prev => ({ ...prev, terms: '' }))
          setShowTermsModal(false)
        }}
        modalType={modalType}
        t={t}
      />
    </>
  )
}

// Terms & Conditions Modal Overlay
function TermsModal({ open, currentLanguage, onClose, onAccept, modalType, t }) {
  const legalSections = t(`register.legal.${modalType}.sections`)

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-nexoraText/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white border border-nexoraRule rounded-3xl max-w-xl w-full p-6 flex flex-col max-h-[85vh] text-left text-nexoraText shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-nexoraRule pb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-nexoraText">
            {modalType === 'privacy'
              ? (t('components.staff_registration.steps.StepOtpVerify.privacyPolicy'))
              : (t('components.staff_registration.steps.StepOtpVerify.termsOfService'))
            }
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-nexoraSubtle hover:text-nexoraText transition p-1.5 rounded-full hover:bg-nexoraSurfaceMuted"
            title="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-grow overflow-y-auto pr-2 py-4 space-y-4 text-xs text-nexoraMuted leading-relaxed max-h-[50vh] scrollbar-thin">
          {Array.isArray(legalSections) && legalSections.map((section) => (
            <React.Fragment key={section.title}>
              <h4 className="font-extrabold text-nexoraText">{section.title}</h4>
              <p>{section.body}</p>
            </React.Fragment>
          ))}
        </div>

        {/* Footer action buttons */}
        <div className="flex justify-end gap-3 border-t border-nexoraRule pt-4 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-nexoraBorder text-nexoraMuted rounded-xl font-bold hover:bg-nexoraSurfaceMuted transition"
          >
            {t('components.staff_registration.steps.StepOtpVerify.close')}
          </button>
          <button
            type="button"
            onClick={onAccept}
          className="px-5 py-2 bg-nexoraText hover:bg-nexoraText/90 text-white rounded-xl font-bold transition shadow-sm"
          >
            {t('components.staff_registration.steps.StepOtpVerify.iAccept')}
          </button>
        </div>
      </div>
    </div>
  )
}
