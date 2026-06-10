import React from 'react'
import { Building2, Sparkles, Check, ArrowLeft, ArrowRight } from 'lucide-react'

const ROLE_BUSINESS = 'business'
const ROLE_PERSONAL = 'personal'

const CARD_BASE = 'p-6 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 group min-h-[180px] hover:shadow-md'
const CARD_ACTIVE = 'border-nexoraBrand bg-nexoraBrandSoft/10 ring-2 ring-nexoraBrand/20'
const CARD_INACTIVE = 'border-nexoraBorder bg-white hover:border-slate-300'
const ICON_BASE = 'p-3 rounded-xl transition-all duration-300'
const ICON_ACTIVE = 'bg-nexoraBrand text-white'
const ICON_INACTIVE = 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'

function RoleCard({ value, selected, onSelect, Icon, title, desc, testId }) {
  const active = selected === value
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => onSelect(value)}
      className={`${CARD_BASE} ${active ? CARD_ACTIVE : CARD_INACTIVE}`}
    >
      <div className="flex justify-between items-start w-full">
        <div className={`${ICON_BASE} ${active ? ICON_ACTIVE : ICON_INACTIVE}`}>
          <Icon className="w-6 h-6" />
        </div>
        {active && (
          <span className="h-5 w-5 rounded-full bg-nexoraBrand text-white flex items-center justify-center">
            <Check className="w-3 h-3 stroke-[3px]" />
          </span>
        )}
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-800 mt-4 group-hover:text-nexoraBrand transition-colors">
          {title}
        </h4>
        <p className="text-[11px] text-nexoraSubtle mt-1 leading-relaxed">
          {desc}
        </p>
      </div>
    </button>
  )
}

export default function StepRoleSelect({ role, setRole, onBackToLogin, setCurrentStep, t, currentLanguage }) {
  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <p className="text-[11px] font-black uppercase tracking-wider text-nexoraBrand">{t('register.create_account')}</p>
        <h3 className="mt-1 text-2xl font-black text-nexoraText sm:text-3xl">{t('register.role_select_title')}</h3>
        <p className="text-sm font-medium leading-relaxed text-nexoraMuted mt-2">{t('register.role_select_desc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
        {/* Business Owner Option */}
        <RoleCard
          value={ROLE_BUSINESS}
          selected={role}
          onSelect={setRole}
          Icon={Building2}
          testId="role-business"
          title={t('register.role_business_title')}
          desc={t('register.role_business_desc')}
        />

        {/* Technician Option */}
        <RoleCard
          value={ROLE_PERSONAL}
          selected={role}
          onSelect={setRole}
          Icon={Sparkles}
          testId="role-personal"
          title={t('register.role_personal_title')}
          desc={t('register.role_personal_desc')}
        />
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
