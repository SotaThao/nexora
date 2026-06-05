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

      {/* Staff ID Box */}
      <div className="max-w-md mx-auto p-5 rounded-2xl border border-nexoraBorder bg-slate-50 flex flex-col items-center justify-center space-y-3 shadow-sm">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {t('register.staff_id_label')}
        </span>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-nexoraBorder w-full justify-between shadow-inner">
          <span className="font-mono text-base font-extrabold text-nexoraBrand select-all">
            {generatedStaffId}
          </span>
          <button
            type="button"
            onClick={handleCopyStaffId}
            className="px-3 py-1 bg-nexoraBrandSoft text-nexoraBrand hover:bg-nexoraBrand hover:text-white rounded-lg text-xs font-bold transition-all shrink-0"
          >
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>
        <p className="text-[10px] text-nexoraSubtle leading-relaxed max-w-xs">
          {t('register.staff_linking_instructions')}
        </p>
      </div>

      {/* Info summary */}
      <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2.5">
        <h4 className="font-extrabold text-slate-800 border-b border-slate-200 pb-1.5 uppercase text-[10px] tracking-wider">
          {currentLanguage === 'vi' ? 'Thông tin đăng ký của bạn' : 'Registered Staff Summary'}
        </h4>
        <div className="grid grid-cols-3 gap-y-1.5 text-slate-600">
          <span className="font-semibold">{currentLanguage === 'vi' ? 'Email tài khoản:' : 'Account Email:'}</span>
          <span className="col-span-2 font-mono break-all text-slate-800">{email}</span>

          {referralCode && (
            <>
              <span className="font-semibold">{currentLanguage === 'vi' ? 'Mã giới thiệu:' : 'Referral Code:'}</span>
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
