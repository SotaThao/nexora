import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { PosJobPostingUpsertInput } from '../../../../../types/posRecruitment'
import type { RecruitmentValidationErrors } from './recruitmentModel'

const TK = 'components.dashboard.views.pos.recruitment.composer'

interface ComposerContentSectionProps {
  draft: PosJobPostingUpsertInput
  errors: RecruitmentValidationErrors
  disabled: boolean
  onChange: (patch: Partial<PosJobPostingUpsertInput>) => void
  onUseSuggested: () => void
}

export default function ComposerContentSection({ draft, errors, disabled, onChange, onUseSuggested }: ComposerContentSectionProps) {
  const { t } = useTranslation()
  return (
    <section className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-nexoraBrandSoft text-[10px] font-black text-nexoraBrand">02</span><div><h2 className="font-black text-nexoraText">{t(`${TK}.content.title`)}</h2><p className="mt-1 text-xs font-medium text-nexoraMuted">{t(`${TK}.content.description`)}</p></div></div>
        <button type="button" disabled={disabled} onClick={onUseSuggested} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft disabled:opacity-50"><span aria-hidden>✧</span>{t(`${TK}.content.useSuggested`)}</button>
      </header>
      <label className="block text-xs font-bold text-nexoraText">
        {t(`${TK}.fields.body`)} *
        <textarea id="recruitment-field-body" disabled={disabled} value={draft.body} onChange={(event) => onChange({ body: event.target.value })} placeholder={t(`${TK}.placeholders.body`)} rows={7} maxLength={4000} className={`mt-1.5 w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm font-medium leading-6 text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft disabled:bg-slate-100 ${errors.body ? 'border-rose-400' : 'border-nexoraBorder'}`} aria-invalid={Boolean(errors.body)} />
        <span className="mt-1 flex items-center justify-between text-[10px] font-medium text-nexoraSubtle"><span>{errors.body ? <strong className="text-rose-600">{errors.body}</strong> : t(`${TK}.content.bodyHint`)}</span><span>{draft.body.length}/4000</span></span>
      </label>
    </section>
  )
}
