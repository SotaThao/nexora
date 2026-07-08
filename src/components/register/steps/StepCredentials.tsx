import React from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Copy, Loader2 } from 'lucide-react'

export default function StepCredentials(props) {
  const {
    // form state
    email, setEmail,
    confirmEmail, setConfirmEmail,
    password, setPassword,
    showPassword, setShowPassword,
    referralCode, setReferralCode,
    refCodeReadOnly,
    errors, setErrors,
    isSubmitting,
    ssoEmail,
    // otp inline state
    showOtpInput, setShowOtpInput,
    otpCode, setOtpCode,
    otpError, setOtpError,
    resendTimer, setResendTimer,
    // handlers
    handleStep1Next,
    handleVerifyOtp,
    // step nav
    setCurrentStep,
    // role
    role,
    // translation
    t, currentLanguage, renderLabel,
    // API mode
    firstName, setFirstName,
    lastName, setLastName,
    isVerificationPending, setIsVerificationPending,
    simToken, setSimToken,
    verifySuccess, setVerifySuccess,
    resendMessage, setResendMessage,
    handleSimulateVerify,
    handleResendVerification,
  } = props

  const handleCopyEmail = () => {
    if (!email || !navigator.clipboard) return
    navigator.clipboard.writeText(email)
  }

  if (isVerificationPending) {
    return (
      <div className="p-6 sm:p-10 space-y-6 animate-fadeIn">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto w-16 h-16 rounded-full bg-nexoraBrandSoft flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-nexoraBrand" />
          </div>
          <h3 className="text-lg font-bold text-nexoraText font-sans">
            {t('register.verify_your_email')}
          </h3>
          <p className="text-xs text-nexoraSubtle mt-2 leading-relaxed">
            {t('register.verification_email_sent')}{' '}
            <span className="font-semibold text-nexoraText">{email}</span>
          </p>
          <p className="text-xs text-nexoraSubtle mt-1 leading-relaxed">
            {t('register.verification_email_sent_check')}
          </p>
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 text-center font-medium">
            {t(errors.submit)}
          </div>
        )}

        {verifySuccess && (
          <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200 text-center font-medium">
            {t('register.email_verified_success')}
          </div>
        )}

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendTimer > 0}
            className={`text-xs font-bold ${resendTimer > 0 ? 'text-nexoraSubtle cursor-not-allowed' : 'text-nexoraBrand hover:underline'}`}
          >
            {resendTimer > 0
              ? (t('register.resend_in_seconds')).replace('{seconds}', resendTimer)
              : t('register.resend_verification')
            }
          </button>
          {resendMessage && (
            <p className="text-xs text-green-600 font-semibold mt-1">{resendMessage}</p>
          )}
        </div>

        <div className="pt-4 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setIsVerificationPending(false)}
            className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> {t('register.back_to_signup')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-10 space-y-6">
      {showOtpInput ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center max-w-md mx-auto">
            <h3 className="text-lg font-bold text-nexoraText font-sans">
              {t('components.register.steps.StepCredentials.activateAccountEnterOtp')}
            </h3>
            <p className="text-xs text-nexoraSubtle mt-1 leading-relaxed">
              {t('components.register.steps.StepCredentials.enterTheOtpCode').split('{{email}}').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && <span className="font-bold text-nexoraText">{email}</span>}
                </React.Fragment>
              ))}
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {renderLabel(t('components.register.steps.StepCredentials.enterOtpCode'))}
              </label>
              <input
                type="text"
                placeholder={t('components.register.steps.StepCredentials.phExampleOtp')}
                maxLength={6}
                className={`w-full bg-nexoraCanvas border ${otpError ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg px-4 py-2.5 text-center font-mono font-extrabold text-lg text-nexoraText focus:outline-none transition-all`}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value)
                  if (otpError) setOtpError('')
                }}
                required
              />
              {otpError && <span className="text-xs text-red-500 mt-1 block text-center font-semibold">{otpError}</span>}
            </div>

            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-bold block">
                {resendTimer > 0
                  ? t('common.resend_code_in_seconds', { seconds: resendTimer })
                  : (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="text-nexoraBrand hover:underline"
                    >
                      {t('components.register.steps.StepCredentials.resendVerificationCode')}
                    </button>
                  )
                }
              </span>
              {resendMessage && (
                <p className="text-xs text-green-600 font-semibold mt-1">{resendMessage}</p>
              )}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowOtpInput(false)}
                className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> {t('common.back')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('components.register.steps.StepCredentials.processing')}
                  </>
                ) : (
                  <>
                    {t('components.register.steps.StepCredentials.verifyAndActivate')} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="text-center max-w-md mx-auto">
            <h3 className="text-lg font-bold text-nexoraText">{t('register.title_step_1')}</h3>
            <p className="text-xs text-nexoraSubtle mt-1">{t('register.desc_step_1')}</p>
          </div>

          <form onSubmit={handleStep1Next} noValidate className="space-y-4 max-w-md mx-auto">

            {/* Email Input */}
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {renderLabel(t('register.email_label'))}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexoraSubtle" />
                <input
                  type="email"
                  placeholder={t('register.email_placeholder')}
                  disabled={!!ssoEmail}
                  className={`w-full bg-nexoraCanvas border ${errors.email ? 'border-red-300' : 'border-nexoraBorder'} ${ssoEmail ? 'bg-blue-50/50 text-nexoraSubtle' : 'focus:bg-white focus:border-nexoraBrand'} rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors(prev => ({
                      ...prev,
                      email: '',
                      confirmEmail: confirmEmail.trim() && e.target.value.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()
                        ? 'register.errors.email_mismatch'
                        : '',
                    }))
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim()
                    if (!val) {
                      setErrors(prev => ({ ...prev, email: 'register.errors.email_required' }))
                    } else if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(val)) {
                      setErrors(prev => ({ ...prev, email: 'register.errors.email_invalid' }))
                    }
                  }}
                />
              </div>
              {errors.email && <span className="text-xs text-red-500 mt-1 block">{t(errors.email)}</span>}
            </div>

            {/* Confirm Email Input */}
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {renderLabel(t('register.confirm_email_label'))}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexoraSubtle" />
                <input
                  type="email"
                  placeholder={t('register.confirm_email_placeholder')}
                  className={`w-full bg-nexoraCanvas border ${errors.confirmEmail ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all`}
                  value={confirmEmail}
                  onChange={(e) => {
                    setConfirmEmail(e.target.value)
                    if (errors.confirmEmail) setErrors(prev => ({ ...prev, confirmEmail: '' }))
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value.trim().toLowerCase() !== email.trim().toLowerCase()) {
                      setErrors(prev => ({ ...prev, confirmEmail: 'register.errors.email_mismatch' }))
                    }
                  }}
                />
              </div>
              {errors.confirmEmail && <span className="text-xs text-red-500 mt-1 block">{t(errors.confirmEmail)}</span>}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {renderLabel(t('register.password_label'))}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexoraSubtle" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t('register.password_placeholder')}
                  className={`w-full bg-nexoraCanvas border ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg pl-10 pr-12 py-2.5 text-sm text-nexoraText focus:outline-none transition-all`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                  }}
                  onBlur={(e) => {
                    const val = e.target.value
                    if (!val) {
                      setErrors(prev => ({ ...prev, password: 'register.errors.password_required' }))
                    } else if (val.length < 6) {
                      setErrors(prev => ({ ...prev, password: 'register.errors.password_short' }))
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nexoraSubtle hover:text-nexoraText transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-500 mt-1 block">{t(errors.password)}</span>}
            </div>

            {/* Referral Code Input */}
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {t('register.referral_code_label')}
              </label>
              <input
                type="text"
                placeholder={t('register.referral_code_placeholder')}
                readOnly={refCodeReadOnly}
                disabled={refCodeReadOnly}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-all ${
                  errors.referralCode
                    ? 'border-red-300 focus:border-red-500'
                    : refCodeReadOnly
                      ? 'bg-blue-50/50 border-nexoraBorder text-nexoraSubtle cursor-not-allowed'
                      : 'bg-nexoraCanvas border-nexoraBorder focus:border-nexoraBrand focus:bg-white text-nexoraText'
                }`}
                value={referralCode}
                onChange={(e) => {
                  if (!refCodeReadOnly) {
                    setReferralCode(e.target.value)
                    if (errors.referralCode) setErrors(prev => ({ ...prev, referralCode: '' }))
                  }
                }}
              />
              {errors.referralCode && (
                <span className="text-xs text-red-500 mt-1 block">{t(errors.referralCode)}</span>
              )}
            </div>

            {/* Implicit Consent Terms and Privacy Note */}
            <div className="text-[11px] text-slate-500 leading-normal text-center font-sans max-w-sm mx-auto pt-1 pb-2">
              {t('register.consent.prefix')} <span className="font-bold text-slate-700">{t('register.consent.action')}</span>, {t('register.consent.middle')}{' '}
              <a
                href="/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="text-nexoraTealAlt hover:underline font-bold"
              >
                {t('register.consent.terms')}
              </a>{' '}
              {t('register.consent.and')}{' '}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-nexoraTealAlt hover:underline font-bold"
              >
                {t('register.consent.privacy')}
              </a>.
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> {t('common.back')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('components.register.steps.StepCredentials.processing')}
                  </>
                ) : (
                  <>
                    {t('components.register.steps.StepCredentials.register')} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
