import React from 'react'
import { Eye, EyeOff } from 'lucide-react'

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
  handleRegisterSubmit,
  handleVerifyOtp,
  autoFillOtp,
  setStep,
  setJoinPath,
  setShowOtpInput,
}) {
  return (
    <>
      {/* STEP 1: Register Account & Activate */}
      {!showOtpInput && (
        <form onSubmit={handleRegisterSubmit} className="space-y-6 py-4">
          <div className="text-center space-y-1.5">
            <h3 className="text-base font-extrabold text-nexoraText uppercase tracking-wide">
              {currentLanguage === 'vi' ? '1. Đăng ký tài khoản' : '1. Register Account'}
            </h3>
            <p className="text-xs text-nexoraMuted leading-relaxed max-w-sm mx-auto">
              {currentLanguage === 'vi'
                ? 'Đăng ký tài khoản thợ mới để bắt đầu nhận tiền tip.'
                : 'Register a new technician account to start receiving tips.'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {currentLanguage === 'vi' ? 'Địa chỉ Email' : 'Email Address'}
              </label>
              <input
                type="email"
                className={`mt-1.5 h-10 w-full rounded-lg border ${regErrors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-nexoraBorder focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20'} px-3 text-xs outline-none transition-all`}
                placeholder="e.g. name@example.com"
                value={regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value)
                  setRegErrors(prev => ({ ...prev, email: '' }))
                }}
                required
              />
              {regErrors.email && <p className="mt-1 text-[10px] font-bold text-rose-600">{regErrors.email}</p>}
            </div>

            {/* Confirm Email */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {currentLanguage === 'vi' ? 'Nhập lại địa chỉ Email' : 'Confirm Email Address'}
              </label>
              <input
                type="email"
                className={`mt-1.5 h-10 w-full rounded-lg border ${regErrors.confirmEmail ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-nexoraBorder focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20'} px-3 text-xs outline-none transition-all`}
                placeholder="e.g. name@example.com"
                value={regConfirmEmail}
                onChange={(e) => {
                  setRegConfirmEmail(e.target.value)
                  setRegErrors(prev => ({ ...prev, confirmEmail: '' }))
                }}
                required
              />
              {regErrors.confirmEmail && <p className="mt-1 text-[10px] font-bold text-rose-600">{regErrors.confirmEmail}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {currentLanguage === 'vi' ? 'Mật khẩu' : 'Password'}
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`h-10 w-full rounded-lg border ${regErrors.password ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-nexoraBorder focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20'} pl-3 pr-10 text-xs outline-none transition-all`}
                  placeholder="••••••••"
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
              {regErrors.password && <p className="mt-1 text-[10px] font-bold text-rose-600">{regErrors.password}</p>}
            </div>

            {/* Referral Link */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {currentLanguage === 'vi' ? 'Liên kết giới thiệu / Salon' : 'Referral Link / Salon'}
              </label>
              <input
                type="text"
                className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-xs outline-none transition-all ${
                  inviteData?.biz
                    ? 'bg-nexoraSurfaceMuted text-nexoraSubtle border-nexoraBorder cursor-not-allowed'
                    : 'border-nexoraBorder focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none'
                }`}
                placeholder="e.g. nexora-salon-link"
                value={regReferralLink}
                onChange={(e) => setRegReferralLink(e.target.value)}
                disabled={!!inviteData?.biz}
              />
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
              {t('common.back') || 'Back'}
            </button>
            <button
              type="submit"
              className="flex-grow h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
            >
              {t('common.next') || 'Continue'}
            </button>
          </div>
        </form>
      )}

      {showOtpInput && (
        <form onSubmit={handleVerifyOtp} className="space-y-6 py-4">
          <div className="text-center space-y-1.5">
            <h3 className="text-base font-extrabold text-nexoraText uppercase tracking-wide">
              {currentLanguage === 'vi' ? '1. Kích hoạt tài khoản' : '1. Activate Account'}
            </h3>
            <p className="text-xs text-nexoraMuted leading-relaxed max-w-sm mx-auto">
              {currentLanguage === 'vi'
                ? 'Nhập mã OTP được gửi tới email của bạn để kích hoạt tài khoản.'
                : 'Enter the OTP code sent to your email to activate your account.'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Single OTP Input */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {currentLanguage === 'vi' ? 'Nhập mã OTP' : 'Enter OTP Code'}
              </label>
              <input
                type="text"
                className="mt-1.5 h-12 w-full rounded-lg border border-nexoraBorder px-4 text-center font-mono font-black text-lg text-nexoraText focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all"
                placeholder="e.g. 1234"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value)
                }}
                required
              />
            </div>

            {otpError && <p className="text-xs font-bold text-center text-rose-600">{otpError}</p>}

            <div className="text-center">
              <span className="text-[10px] text-nexoraSubtle font-bold block">
                {resendTimer > 0
                  ? `Resend code in ${resendTimer}s`
                  : (
                    <button
                      type="button"
                      onClick={() => setResendTimer(30)}
                      className="text-[#4648D8] hover:underline"
                    >
                      Resend Verification Code
                    </button>
                  )
                }
              </span>
            </div>
          </div>

          {/* Simulation Shortcut */}
          <div className="p-3 border border-dashed border-nexoraBrand/40 bg-nexoraBrandSoft/20 rounded-xl flex items-center justify-between gap-3 max-w-xs mx-auto">
            <span className="text-[10px] text-nexoraBrand font-bold">Simulator Helper:</span>
            <button
              type="button"
              onClick={autoFillOtp}
              className="px-2.5 py-1 bg-[#4648D8] text-white rounded text-[10px] font-black uppercase hover:bg-opacity-90 shadow-sm"
            >
              Auto-fill (1234)
            </button>
          </div>

          <div className="pt-4 flex gap-3 border-t border-nexoraRule">
            <button
              type="button"
              onClick={() => setShowOtpInput(false)}
              className="h-10 px-4 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-nexoraSurfaceMuted transition"
            >
              {t('common.back') || 'Back'}
            </button>
            <button
              type="submit"
              className="flex-grow h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
            >
              {currentLanguage === 'vi' ? 'Xác minh & Kích hoạt' : 'Verify & Activate'}
            </button>
          </div>
        </form>
      )}
    </>
  )
}
