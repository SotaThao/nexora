import React from 'react'
import { Building2, Sparkles, Check, ArrowLeft, ArrowRight } from 'lucide-react'

export default function StepRoleSelect({ role, setRole, onBackToLogin, setCurrentStep, t, currentLanguage }) {
  return (
    <div className="p-6 sm:p-10 space-y-6">
      <div className="text-center max-w-md mx-auto">
        <h3 className="text-lg font-bold text-nexoraText">{t('register.role_select_title')}</h3>
        <p className="text-xs text-nexoraSubtle mt-1">{t('register.role_select_desc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
        {/* Business Owner Option */}
        <button
          type="button"
          onClick={() => setRole('business')}
          className={`p-6 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 group min-h-[180px] hover:shadow-md
            ${role === 'business'
              ? 'border-nexoraBrand bg-nexoraBrandSoft/10 ring-2 ring-nexoraBrand/20'
              : 'border-nexoraBorder bg-white hover:border-slate-300'
            }`}
        >
          <div className="flex justify-between items-start w-full">
            <div className={`p-3 rounded-xl transition-all duration-300
              ${role === 'business'
                ? 'bg-nexoraBrand text-white'
                : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
              }`}
            >
              <Building2 className="w-6 h-6" />
            </div>
            {role === 'business' && (
              <span className="h-5 w-5 rounded-full bg-nexoraBrand text-white flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[3px]" />
              </span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mt-4 group-hover:text-nexoraBrand transition-colors">
              {t('register.role_business_title')}
            </h4>
            <p className="text-[11px] text-nexoraSubtle mt-1 leading-relaxed">
              {t('register.role_business_desc')}
            </p>
          </div>
        </button>

        {/* Technician Option */}
        <button
          type="button"
          onClick={() => setRole('personal')}
          className={`p-6 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 group min-h-[180px] hover:shadow-md
            ${role === 'personal'
              ? 'border-nexoraBrand bg-nexoraBrandSoft/10 ring-2 ring-nexoraBrand/20'
              : 'border-nexoraBorder bg-white hover:border-slate-300'
            }`}
        >
          <div className="flex justify-between items-start w-full">
            <div className={`p-3 rounded-xl transition-all duration-300
              ${role === 'personal'
                ? 'bg-nexoraBrand text-white'
                : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
              }`}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            {role === 'personal' && (
              <span className="h-5 w-5 rounded-full bg-nexoraBrand text-white flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[3px]" />
              </span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mt-4 group-hover:text-nexoraBrand transition-colors">
              {t('register.role_personal_title')}
            </h4>
            <p className="text-[11px] text-nexoraSubtle mt-1 leading-relaxed">
              {t('register.role_personal_desc')}
            </p>
          </div>
        </button>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all"
        >
          {t('common.next')} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
