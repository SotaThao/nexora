import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { PosJobPostingUpsertInput } from '../../../../../types/posRecruitment'
import type { RecruitmentValidationErrors } from './recruitmentModel'
import RecruitmentRichTextEditor from './RecruitmentRichTextEditor'
import RecruitmentMediaFields from './RecruitmentMediaFields'
import { postingHtmlFromText, postingPlainText } from './recruitmentPostingContent'

const TK = 'components.dashboard.views.pos.recruitment.composer'

interface ComposerContentSectionProps {
  draft: PosJobPostingUpsertInput
  errors: RecruitmentValidationErrors
  disabled: boolean
  onChange: (patch: Partial<PosJobPostingUpsertInput>) => void
  onUseSuggested: () => void
  onMediaBusyChange: (busy: boolean) => void
}

export default function ComposerContentSection({ draft, errors, disabled, onChange, onUseSuggested, onMediaBusyChange }: ComposerContentSectionProps) {
  const { t } = useTranslation()
  const content = draft.postingContent ?? { html: postingHtmlFromText(draft.body), images: [], videoUrls: [] }
  return (
    <section className="min-w-0 max-w-full rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-nexoraBrandSoft text-[10px] font-black text-nexoraBrand">02</span><div><h2 className="font-black text-nexoraText">{t(`${TK}.content.title`)}</h2><p className="mt-1 text-xs font-medium text-nexoraMuted">{t(`${TK}.content.description`)}</p></div></div>
      </header>
      <div className="min-w-0 text-nexoraText">
        <span id="recruitment-content-body-label" className="text-xs font-bold">{t(`${TK}.fields.body`)} *</span>
        <RecruitmentRichTextEditor html={content.html} disabled={disabled} invalid={Boolean(errors.body)} onHtmlChange={(html) => onChange({ body: postingPlainText(html), postingContent: { ...content, html } })} onUseAI={onUseSuggested} />
        <span className="mt-1 flex items-center justify-between text-[10px] font-medium text-nexoraSubtle"><span>{errors.body ? <strong className="text-rose-600">{errors.body}</strong> : t(`${TK}.content.bodyHint`)}</span><span>{draft.body.length}/4000</span></span>
      </div>
      <RecruitmentMediaFields content={content} disabled={disabled} validationError={errors.postingContent} onChange={(postingContent) => onChange({ postingContent })} onBusyChange={onMediaBusyChange} />
    </section>
  )
}
