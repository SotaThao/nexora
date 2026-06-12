import React from 'react'
import { Sparkles } from 'lucide-react'

export default function StepSuccess({
  generatedStaffId,
  copied,
  handleCopyStaffId,
  email,
  referralCode,
  onBackToLogin,
  currentLanguage,
  t,
}) {
  return (
    <div className="p-6 sm:p-10 space-y-6 text-center animate-fadeIn">
      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto animate-bounce">
        <Sparkles className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-nexoraText">
          {t('register.staff_success_title')}
        </h3>
        <p className="text-xs text-nexoraSubtle max-w-lg mx-auto">
          {t('register.staff_success_desc')}
        </p>
      </div>

      {/* Instruction Box */}
      <div className="max-w-md mx-auto p-5 rounded-2xl border border-nexoraBrand/30 bg-nexoraBrandSoft/20 flex flex-col items-center justify-center space-y-3 shadow-sm">
        <p className="text-sm font-semibold text-nexoraBrand leading-relaxed max-w-xs text-center">
          {t('register.need_invite_link')}
        </p>
      </div>

      {/* Info summary */}
      <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2.5">
        <h4 className="font-extrabold text-slate-800 border-b border-slate-200 pb-1.5 uppercase text-[10px] tracking-wider">
          {t('components.register.steps.StepSuccess.registeredStaffSummary')}
        </h4>
        <div className="grid grid-cols-3 gap-y-1.5 text-slate-600">
          <span className="font-semibold">{t('components.register.steps.StepSuccess.accountEmail')}</span>
          <span className="col-span-2 font-mono break-all text-slate-800">{email}</span>

          {referralCode && (
            <>
              <span className="font-semibold">{t('components.register.steps.StepSuccess.referralCode')}</span>
              <span className="col-span-2 text-slate-800 font-mono">{referralCode}</span>
            </>
          )}
        </div>
      </div>

      <div className="pt-6">
        <button
          onClick={onBackToLogin}
          className="px-6 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all"
        >
          {t('register.staff_login_btn')}
        </button>
      </div>
    </div>
  )
}
