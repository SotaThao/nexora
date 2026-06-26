import React from 'react'
import { ArrowLeft, ArrowRight, Copy, Loader2, Mail } from 'lucide-react'

export default function StepOtpVerify({
  email,
  otpCode, setOtpCode,
  otpError, setOtpError,
  resendTimer,
  resendMessage,
  errors = {} as LooseObject,
  isSubmitting = false,
  handleVerifyOtp,
  handleResendVerification,
  setCurrentStep,
  t,
  renderLabel,
}) {
  const handleCopyEmail = () => {
    if (!email || !navigator.clipboard) return
    navigator.clipboard.writeText(email)
  }

  return (
    <div className="p-6 sm:p-10 space-y-6 animate-fadeIn">
      <div className="text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-nexoraText">
          {t('components.register.steps.StepOtpVerify.activateAccountEnterOtp')}
        </h3>
        <p className="text-xs text-nexoraSubtle mt-1 leading-relaxed">
          {t('components.register.steps.StepOtpVerify.enterTheOtpCode').split('{{email}}').map((part, i, arr) => (
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
            {renderLabel(t('components.register.steps.StepOtpVerify.enterOtpCode'))}
          </label>
          <input
            type="text"
            placeholder={t('components.register.steps.StepOtpVerify.phExampleOtp')}
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
                  {t('components.register.steps.StepOtpVerify.resendVerificationCode')}
                </button>
              )
            }
          </span>
          {resendMessage && (
            <p className="text-xs text-green-600 font-semibold mt-1">{resendMessage}</p>
          )}
        </div>

        {errors.submit && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 text-center font-medium">
            {t(errors.submit)}
          </div>
        )}

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
            disabled={isSubmitting}
            className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('components.register.steps.StepOtpVerify.processing')}
              </>
            ) : (
              <>
                {t('components.register.steps.StepOtpVerify.verifyAndActivate')} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
