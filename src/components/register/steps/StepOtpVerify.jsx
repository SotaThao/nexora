import React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function StepOtpVerify({
  otpCode, setOtpCode,
  otpError, setOtpError,
  resendTimer, setResendTimer,
  handleVerifyOtp,
  setCurrentStep,
  currentLanguage,
  t,
  renderLabel,
}) {
  return (
    <div className="p-6 sm:p-10 space-y-6 animate-fadeIn">
      <div className="text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-nexoraText">
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
            className="px-2.5 py-1 bg-nexoraElectric text-white rounded text-[10px] font-black uppercase hover:bg-opacity-90 shadow-sm animate-pulse"
          >
            Auto-fill (1234)
          </button>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
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
  )
}
