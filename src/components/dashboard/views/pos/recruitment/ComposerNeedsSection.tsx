import { Store } from 'lucide-react'

import {
  JobPayType,
  JobPayUnit,
  JobPosition,
  JobWorkType,
  RecruitmentBenefit,
  RecruitmentSkill,
} from '../../../../../constants/posRecruitment'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { PosJobPostingUpsertInput } from '../../../../../types/posRecruitment'
import { deriveSkillsFromServices, type RecruitmentValidationErrors } from './recruitmentModel'

const TK = 'components.dashboard.views.pos.recruitment'

interface ComposerNeedsSectionProps {
  draft: PosJobPostingUpsertInput
  errors: RecruitmentValidationErrors
  disabled: boolean
  onChange: (patch: Partial<PosJobPostingUpsertInput>) => void
  onOpenServices: () => void
  onClearServices: () => void
  onToggleSkill: (skill: RecruitmentSkill) => void
}

const fieldClass = 'min-h-11 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-medium text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft disabled:bg-slate-100 disabled:text-nexoraSubtle'

const COMPOSER_POSITIONS = [
  JobPosition.NailTechnician,
  JobPosition.AcrylicDipTechnician,
  JobPosition.ManicurePedicureTechnician,
]

const COMPOSER_WORK_TYPES = [JobWorkType.FullTime, JobWorkType.PartTime, JobWorkType.Flexible]
const COMPOSER_PAY_UNITS = [JobPayUnit.Hour, JobPayUnit.Day, JobPayUnit.Week, JobPayUnit.Month]

export default function ComposerNeedsSection({ draft, errors, disabled, onChange, onOpenServices, onClearServices, onToggleSkill }: ComposerNeedsSectionProps) {
  const { t } = useTranslation()
  const suggestedCount = deriveSkillsFromServices(draft.selectedServices.map((service) => service.name)).length
  return (
    <section className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-5 flex gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-nexoraBrandSoft text-[10px] font-black text-nexoraBrand">01</span>
        <div><h2 className="font-black text-nexoraText">{t(`${TK}.composer.needs.title`)}</h2><p className="mt-1 text-xs font-medium text-nexoraMuted">{t(`${TK}.composer.needs.description`)}</p></div>
      </header>

      <div className="space-y-4">
        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-nexoraBorder bg-nexoraSurfaceMuted px-3 text-xs font-bold text-nexoraText">
          <input type="checkbox" disabled={disabled} checked={draft.isUrgent} onChange={(event) => onChange({ isUrgent: event.target.checked })} className="h-4 w-4 rounded border-nexoraBorder text-nexoraBrand focus:ring-nexoraBrand" />
          <span>{t(`${TK}.composer.fields.urgent`)} <span className="font-medium text-nexoraMuted">({t(`${TK}.composer.needs.urgentHint`)})</span></span>
        </label>

        <label className="block text-xs font-bold text-nexoraText">
          {t(`${TK}.composer.fields.title`)} *
          <input id="recruitment-field-title" type="text" maxLength={120} disabled={disabled} value={draft.title} onChange={(event) => onChange({ title: event.target.value })} placeholder={t(`${TK}.composer.placeholders.title`)} className={`${fieldClass} mt-1.5 ${errors.title ? 'border-rose-400' : ''}`} aria-invalid={Boolean(errors.title)} />
          {errors.title ? <span className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.title}</span> : null}
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-nexoraText">{t(`${TK}.composer.fields.position`)} *<select disabled={disabled} value={draft.position} onChange={(event) => onChange({ position: event.target.value as JobPosition })} className={`${fieldClass} mt-1.5`}>{COMPOSER_POSITIONS.map((value) => <option key={value} value={value}>{t(`${TK}.enums.position.${value}`)}</option>)}</select></label>
          <label className="text-xs font-bold text-nexoraText">{t(`${TK}.composer.fields.headcount`)} *<input id="recruitment-field-headcount" type="number" min="1" max="50" disabled={disabled} value={draft.headcount} onChange={(event) => onChange({ headcount: Number(event.target.value) })} placeholder={t(`${TK}.composer.placeholders.headcount`)} className={`${fieldClass} mt-1.5 ${errors.headcount ? 'border-rose-400' : ''}`} aria-invalid={Boolean(errors.headcount)} />{errors.headcount ? <span className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.headcount}</span> : null}</label>
          <label className="text-xs font-bold text-nexoraText">{t(`${TK}.composer.fields.workType`)}<select disabled={disabled} value={draft.workType} onChange={(event) => onChange({ workType: event.target.value as JobWorkType })} className={`${fieldClass} mt-1.5`}>{COMPOSER_WORK_TYPES.map((value) => <option key={value} value={value}>{t(`${TK}.enums.workType.${value}`)}</option>)}</select></label>
          <label className="text-xs font-bold text-nexoraText">{t(`${TK}.composer.fields.deadline`)} *<input id="recruitment-field-deadline" type="date" disabled={disabled} value={draft.deadline} onChange={(event) => onChange({ deadline: event.target.value })} placeholder={t(`${TK}.composer.placeholders.deadline`)} className={`${fieldClass} mt-1.5 ${errors.deadline ? 'border-rose-400' : ''}`} aria-invalid={Boolean(errors.deadline)} />{errors.deadline ? <span className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.deadline}</span> : null}</label>
        </div>

        <div className="rounded-xl border border-nexoraLavender bg-nexoraBrandSoft/50 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="flex items-center gap-2"><p className="text-xs font-black text-nexoraText">{t(`${TK}.composer.needs.servicesTitle`)}</p><span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-nexoraBrand">{t(`${TK}.composer.needs.menuSourceTag`)}</span></div><p className="mt-1 text-[11px] font-medium text-nexoraMuted">{t(`${TK}.composer.needs.servicesDescription`)}</p></div>
            <button type="button" disabled={disabled} onClick={onOpenServices} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-nexoraLavender bg-white px-3 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft disabled:opacity-50"><Store className="h-4 w-4" aria-hidden />{t(`${TK}.composer.needs.${draft.selectedServices.length ? 'changeServices' : 'chooseServices'}`)}</button>
          </div>
          {draft.selectedServices.length > 0 ? (
            <><div className="mt-3 flex flex-wrap gap-1.5">{draft.selectedServices.map((service) => <span key={service.posServiceId} className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-nexoraBrand shadow-sm">{service.name}</span>)}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold"><span className="text-nexoraMuted">{t(`${TK}.composer.needs.servicesSummary`, { serviceCount: draft.selectedServices.length, skillCount: suggestedCount })}</span><button type="button" disabled={disabled} onClick={onClearServices} className="min-h-11 rounded-lg px-2 text-nexoraBrand hover:bg-white disabled:opacity-50">{t(`${TK}.composer.needs.clearServices`)}</button></div></>
          ) : <p className="mt-3 text-[11px] font-medium text-nexoraMuted">{t(`${TK}.composer.needs.servicesEmpty`)}</p>}
        </div>

        <fieldset id="recruitment-field-skills">
          <legend className="text-xs font-bold text-nexoraText">{t(`${TK}.composer.fields.skills`)} *</legend>
          <p className="mt-1 text-[11px] font-medium text-nexoraMuted">{t(`${TK}.composer.needs.skillsHint`)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.values(RecruitmentSkill).map((skill) => {
              const selected = draft.skills.includes(skill)
              return <button key={skill} type="button" disabled={disabled} aria-pressed={selected} onClick={() => onToggleSkill(skill)} className={`min-h-11 rounded-lg border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-50 ${selected ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand' : 'border-nexoraBorder bg-white text-nexoraMuted hover:border-nexoraLavender'}`}>{t(`${TK}.enums.skill.${skill}`)}</button>
            })}
          </div>
          <p className="mt-2 text-[11px] font-semibold text-nexoraMuted">{t(`${TK}.composer.needs.skillsSelected`, { count: draft.skills.length })}</p>
          {errors.skills ? <span className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.skills}</span> : null}
        </fieldset>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-nexoraText">{t(`${TK}.composer.fields.payType`)}<select disabled={disabled} value={draft.payType} onChange={(event) => onChange({ payType: event.target.value as JobPayType })} className={`${fieldClass} mt-1.5`}>{Object.values(JobPayType).map((value) => <option key={value} value={value}>{t(`${TK}.enums.payType.${value}`)}</option>)}</select></label>
          {draft.payType === JobPayType.Fixed ? (
            <div className="grid grid-cols-[minmax(0,1fr)_130px] gap-2">
              <label className="text-xs font-bold text-nexoraText">{t(`${TK}.composer.fields.payAmount`)} *<input id="recruitment-field-payAmount" type="number" min="0.01" max="100000" step="0.01" disabled={disabled} value={draft.payAmount ?? ''} onChange={(event) => onChange({ payAmount: event.target.value ? Number(event.target.value) : null })} placeholder={t(`${TK}.composer.placeholders.payAmount`)} className={`${fieldClass} mt-1.5 ${errors.payAmount ? 'border-rose-400' : ''}`} /></label>
              <label className="text-xs font-bold text-nexoraText">{t(`${TK}.composer.fields.payUnit`)}<select disabled={disabled} value={draft.payUnit ?? JobPayUnit.Hour} onChange={(event) => onChange({ payUnit: event.target.value as JobPayUnit })} className={`${fieldClass} mt-1.5`}>{COMPOSER_PAY_UNITS.map((value) => <option key={value} value={value}>{t(`${TK}.enums.payUnit.${value}`)}</option>)}</select></label>
              {errors.payAmount ? <span className="col-span-2 text-[11px] font-semibold text-rose-600">{errors.payAmount}</span> : null}
            </div>
          ) : <div />}
        </div>

        <label className="block text-xs font-bold text-nexoraText">
          {t(`${TK}.composer.fields.payText`)}
          <input type="text" disabled={disabled} value={draft.payText ?? ''} onChange={(event) => onChange({ payText: event.target.value || null })} placeholder={t(`${TK}.composer.placeholders.payText`)} className={`${fieldClass} mt-1.5`} />
        </label>

        <fieldset>
          <legend className="text-xs font-bold text-nexoraText">{t(`${TK}.composer.needs.benefitsTitle`)}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.values(RecruitmentBenefit).map((benefit) => {
              const selected = draft.benefits.includes(benefit)
              return (
                <button
                  key={benefit}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => onChange({ benefits: selected ? draft.benefits.filter((item) => item !== benefit) : [...draft.benefits, benefit] })}
                  className={`min-h-11 rounded-lg border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-50 ${selected ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-nexoraBorder bg-white text-nexoraMuted hover:border-nexoraLavender'}`}
                >
                  {t(`${TK}.enums.benefit.${benefit}`)}
                </button>
              )
            })}
          </div>
        </fieldset>
      </div>
    </section>
  )
}
