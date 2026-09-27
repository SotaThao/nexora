import { AlertTriangle } from 'lucide-react'

import { JOB_VISIBILITY_PRESET_OPTIONS } from '../../../../../constants/posRecruitment'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  PhoneDialCode,
} from '../../../../CountryCodeSelect'
import type { PosJobPostingUpsertInput } from '../../../../../types/posRecruitment'
import { formatBusinessAddress, getInitials } from '../posDisplay'
import type { HiddenInfoLeak, RecruitmentValidationErrors } from './recruitmentModel'
import {
  deriveVisibilityPreset,
  formatRecruitmentLocation,
  getPublicSalonLabel,
  resolveVisibilityPreset,
  visibilityMatchesPreset,
} from './recruitmentModel'

const TK = 'components.dashboard.views.pos.recruitment.composer'

interface ComposerVisibilitySectionProps {
  draft: PosJobPostingUpsertInput
  errors: RecruitmentValidationErrors
  leaks: HiddenInfoLeak[]
  disabled: boolean
  onChange: (patch: Partial<PosJobPostingUpsertInput>) => void
}

const fieldClass = 'min-h-11 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-medium text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft disabled:bg-slate-100 disabled:text-nexoraSubtle'

export default function ComposerVisibilitySection({ draft, errors, leaks, disabled, onChange }: ComposerVisibilitySectionProps) {
  const { t } = useTranslation()
  const locationLabel = formatRecruitmentLocation(draft.city, draft.state)
  const hiddenSalonLabel = getPublicSalonLabel({
    ...draft,
    visibility: { ...draft.visibility, showBusinessName: false },
  }, t)
  const visibilitySummary = deriveVisibilityPreset(draft.visibility)
  const visibilityFields: Array<{ key: keyof typeof draft.visibility; label: string; hint: string }> = [
    { key: 'showBusinessName', label: t(`${TK}.visibility.businessName`), hint: t(`${TK}.visibility.businessNameHint`, { name: hiddenSalonLabel }) },
    { key: 'showAddress', label: t(`${TK}.visibility.address`), hint: t(`${TK}.visibility.${locationLabel ? 'addressHint' : 'addressHintUnknown'}`, { location: locationLabel }) },
    { key: 'showContactName', label: t(`${TK}.visibility.contactName`), hint: t(`${TK}.visibility.contactNameHint`) },
    { key: 'showPhone', label: t(`${TK}.visibility.phone`), hint: t(`${TK}.visibility.phoneHint`) },
  ]
  const address = formatBusinessAddress(draft)

  return (
    <section className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-5 flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-nexoraBrandSoft text-[10px] font-black text-nexoraBrand">03</span><div><h2 className="font-black text-nexoraText">{t(`${TK}.visibility.title`)}</h2><p className="mt-1 text-xs font-medium text-nexoraMuted">{t(`${TK}.visibility.description`)}</p></div></header>

      <fieldset className="rounded-xl border border-nexoraLavender bg-nexoraBrandSoft/40 p-3 sm:p-4">
        <legend className="px-1 text-xs font-black text-nexoraText">{t(`${TK}.visibility.question`)}</legend>
        <div className="flex justify-end"><span className="rounded bg-nexoraBrandSoft px-2 py-1 text-[10px] font-bold text-nexoraBrand">{t(`${TK}.visibility.summary.${visibilitySummary}`)}</span></div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {JOB_VISIBILITY_PRESET_OPTIONS.map((preset) => {
            const selected = visibilityMatchesPreset(draft.visibility, preset)
            return (
              <button key={preset} type="button" disabled={disabled} aria-pressed={selected} onClick={() => onChange({ visibilityPreset: preset, visibility: resolveVisibilityPreset(preset) })} className={`min-h-11 rounded-lg border px-3 py-2 text-left text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-50 ${selected ? 'border-nexoraBrand bg-white text-nexoraBrand shadow-sm' : 'border-nexoraBorder bg-white/60 text-nexoraMuted hover:bg-white'}`}>
                <span>{t(`${TK}.visibility.presets.${preset}`)}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 divide-y divide-nexoraRule">
          {visibilityFields.map((field) => (
            <label key={field.key} className="flex min-h-14 cursor-pointer items-start gap-3 py-3">
              <input type="checkbox" disabled={disabled} checked={draft.visibility[field.key]} onChange={(event) => {
                const visibility = { ...draft.visibility, [field.key]: event.target.checked }
                onChange({ visibility, visibilityPreset: deriveVisibilityPreset(visibility) })
              }} className="mt-0.5 h-4 w-4 accent-nexoraBrand" />
              <span><strong className="block text-xs text-nexoraText">{field.label}</strong><span className="mt-1 block text-[11px] font-medium text-nexoraMuted">{field.hint}</span></span>
            </label>
          ))}
        </div>

        <p className="mt-3 text-[10px] font-medium leading-5 text-nexoraSubtle">{t(`${TK}.visibility.${locationLabel ? 'publicLocationNote' : 'publicLocationUnknown'}`, { location: locationLabel })}</p>

        {leaks.length > 0 ? (
          <div id="recruitment-field-privacy" role="alert" tabIndex={-1} className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><p className="font-medium leading-5">{t(`${TK}.visibility.leakDescription`, { fields: leaks.map((leak) => t(`${TK}.visibility.leakFields.${leak.field}`)).join(', ') })}</p></div>
          </div>
        ) : null}
      </fieldset>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-nexoraBrandSoft text-sm font-black text-nexoraBrand">{getInitials(draft.businessName || 'N')}</span>
        <div className="min-w-0"><p className="truncate text-xs font-black text-nexoraText">{draft.businessName || t(`${TK}.visibility.salonFallback`)}</p><p className="mt-1 truncate text-[11px] font-medium text-nexoraMuted">{address || t(`${TK}.visibility.addressFallback`)}</p></div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-nexoraText">{t(`${TK}.fields.contactName`)} *<input id="recruitment-field-contactName" type="text" disabled={disabled} value={draft.contactName} onChange={(event) => onChange({ contactName: event.target.value })} placeholder={t(`${TK}.placeholders.contactName`)} className={`${fieldClass} mt-1.5 ${errors.contactName ? 'border-rose-400' : ''}`} />{errors.contactName ? <span className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.contactName}</span> : null}</label>
        <label className="text-xs font-bold text-nexoraText">{t(`${TK}.fields.phone`)} *<input id="recruitment-field-phone" type="tel" inputMode="tel" autoComplete="tel-national" disabled={disabled} value={draft.phone} onChange={(event) => onChange({ phone: formatNationalNumber(event.target.value, PhoneDialCode.US) })} placeholder={getNationalPhonePlaceholder(PhoneDialCode.US)} className={`${fieldClass} mt-1.5 ${errors.phone ? 'border-rose-400' : ''}`} />{errors.phone ? <span className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.phone}</span> : null}</label>
      </div>
      <p className="mt-4 text-[10px] font-medium leading-5 text-nexoraSubtle">{t(`${TK}.visibility.sourceNote`)}</p>
    </section>
  )
}
