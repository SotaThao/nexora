import React from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react'

export default function StepCredentials({
  // form state
  email, setEmail,
  confirmEmail, setConfirmEmail,
  password, setPassword,
  showPassword, setShowPassword,
  referralCode, setReferralCode,
  errors, setErrors,
  ssoEmail,
  // otp inline state
  showOtpInput, setShowOtpInput,
  otpCode, setOtpCode,
  otpError, setOtpError,
  resendTimer, setResendTimer,
  // terms modal triggers
  setModalType, setShowTermsModal,
  // handlers
  handleStep1Next,
  handleVerifyOtp,
  // step nav
  setCurrentStep,
  // translation
  t, currentLanguage, renderLabel,
}) {
  return (
    <div className="p-6 sm:p-10 space-y-6">
      {showOtpInput ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center max-w-md mx-auto">
            <h3 className="text-lg font-bold text-nexoraText font-sans">
              {currentLanguage === 'vi' ? 'Kích hoạt tài khoản (Nhập OTP)' : 'Activate Account (Enter OTP)'}
            </h3>
            <p className="text-xs text-nexoraSubtle mt-1 leading-relaxed">
              {currentLanguage === 'vi'
                ? 'Nhập mã OTP được gửi tới email của bạn để kích hoạt tài khoản.'
                : 'Enter the OTP code sent to your email to activate your account.'}
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {renderLabel(currentLanguage === 'vi' ? 'Nhập mã OTP *' : 'Enter OTP Code *')}
              </label>
              <input
                type="text"
                placeholder="e.g. 1234"
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
                  ? (currentLanguage === 'vi' ? `Gửi lại mã sau ${resendTimer}s` : `Resend code in ${resendTimer}s`)
                  : (
                    <button
                      type="button"
                      onClick={() => setResendTimer(30)}
                      className="text-nexoraBrand hover:underline"
                    >
                      {currentLanguage === 'vi' ? 'Gửi lại mã xác thực' : 'Resend Verification Code'}
                    </button>
                  )
                }
              </span>
            </div>

            {/* Simulator Helper */}
            <div className="p-3 border border-dashed border-nexoraBrand/30 bg-nexoraBrandSoft/30 rounded-xl flex items-center justify-between gap-3 max-w-xs mx-auto">
              <span className="text-[10px] text-nexoraBrand font-bold">Simulator Helper:</span>
              <button
                type="button"
                onClick={() => {
                  setOtpCode('1234')
                  setOtpError('')
                }}
                className="px-2.5 py-1 bg-nexoraBrand text-white rounded text-[10px] font-black uppercase hover:bg-opacity-90 shadow-sm"
              >
                Auto-fill (1234)
              </button>
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
                className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all"
              >
                {currentLanguage === 'vi' ? 'Xác minh & Kích hoạt' : 'Verify & Activate'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div>
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
                <Mail className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                <input
                  type="email"
                  placeholder={t('register.email_placeholder')}
                  disabled={!!ssoEmail}
                  className={`w-full bg-nexoraCanvas border ${errors.email ? 'border-red-300' : 'border-nexoraBorder'} ${ssoEmail ? 'bg-blue-50/50 text-nexoraSubtle' : 'focus:bg-white focus:border-nexoraBrand'} rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors({ ...errors, email: '' })
                  }}
                />
              </div>
              {errors.email && <span className="text-xs text-red-500 mt-1 block">{errors.email}</span>}
            </div>

            {/* Confirm Email Input */}
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {renderLabel(t('register.confirm_email_label'))}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                <input
                  type="email"
                  placeholder={t('register.confirm_email_placeholder')}
                  className={`w-full bg-nexoraCanvas border ${errors.confirmEmail ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all`}
                  value={confirmEmail}
                  onChange={(e) => {
                    setConfirmEmail(e.target.value)
                    if (errors.confirmEmail) setErrors({ ...errors, confirmEmail: '' })
                  }}
                />
              </div>
              {errors.confirmEmail && <span className="text-xs text-red-500 mt-1 block">{errors.confirmEmail}</span>}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {renderLabel(t('register.password_label'))}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t('register.password_placeholder')}
                  className={`w-full bg-nexoraCanvas border ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg pl-10 pr-12 py-2.5 text-sm text-nexoraText focus:outline-none transition-all`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors({ ...errors, password: '' })
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-nexoraSubtle hover:text-nexoraText transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-500 mt-1 block">{errors.password}</span>}
            </div>

            {/* Referral Code Input */}
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                {t('register.referral_code_label')}
              </label>
              <input
                type="text"
                placeholder={t('register.referral_code_placeholder')}
                className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
              />
            </div>

            {/* Implicit Consent Terms and Privacy Note */}
            <div className="text-[11px] text-slate-500 leading-normal text-center font-sans max-w-sm mx-auto pt-1 pb-2">
              {currentLanguage === 'vi' ? (
                <>
                  Bằng cách chọn vào <span className="font-bold text-slate-700">Đăng ký</span>, bạn xác nhận rằng bạn đã đọc và đồng ý với{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModalType('terms')
                      setShowTermsModal(true)
                    }}
                    className="text-nexoraTealAlt hover:underline font-bold"
                  >
                    Điều khoản dịch vụ
                  </button>{' '}
                  và{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModalType('privacy')
                      setShowTermsModal(true)
                    }}
                    className="text-nexoraTealAlt hover:underline font-bold"
                  >
                    Chính sách bảo mật
                  </button>{' '}
                  của chúng tôi.
                </>
              ) : (
                <>
                  By selecting <span className="font-bold text-slate-700">Register</span>, you confirm that you have read and agree to our{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModalType('terms')
                      setShowTermsModal(true)
                    }}
                    className="text-nexoraTealAlt hover:underline font-bold"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModalType('privacy')
                      setShowTermsModal(true)
                    }}
                    className="text-nexoraTealAlt hover:underline font-bold"
                  >
                    Privacy Policy
                  </button>.
                </>
              )}
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
                className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all"
              >
                {currentLanguage === 'vi' ? 'Đăng ký' : 'Register'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
