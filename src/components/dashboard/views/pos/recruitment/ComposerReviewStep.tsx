import { CheckCircle2, Loader2 } from 'lucide-react'

import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { PosJobPostingUpsertInput } from '../../../../../types/posRecruitment'
import NailhubPostPreview from './NailhubPostPreview'

const TK = 'components.dashboard.views.pos.recruitment.composer.review'

interface ComposerReviewStepProps {
  draft: PosJobPostingUpsertInput
  logo?: string | null
  confirmed: boolean
  isPending: boolean
  isEditing: boolean
  onConfirmedChange: (confirmed: boolean) => void
  onPublish: () => void
  onBack: () => void
}

export default function ComposerReviewStep({ draft, logo, confirmed, isPending, isEditing, onConfirmedChange, onPublish, onBack }: ComposerReviewStepProps) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <NailhubPostPreview draft={draft} logo={logo} />
      <aside className="h-fit rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm sm:p-5 xl:sticky xl:top-4">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-nexoraBrandSoft px-2 py-1 text-[10px] font-black uppercase tracking-wide text-nexoraBrand"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden />{t(`${TK}.ready`)}</span>
        <h2 className="mt-4 text-lg font-black text-nexoraText">{t(`${TK}.title`)}</h2>
        <dl className="mt-4 space-y-3 border-y border-nexoraRule py-4 text-xs">
          <div><dt className="font-medium text-nexoraSubtle">{t(`${TK}.salon`)}</dt><dd className="mt-1 font-bold text-nexoraText">{draft.businessName}</dd></div>
          <div><dt className="font-medium text-nexoraSubtle">{t(`${TK}.destination`)}</dt><dd className="mt-1 font-bold text-nexoraText">{t(`${TK}.destinationValue`)}</dd></div>
          <div><dt className="font-medium text-nexoraSubtle">{t(`${TK}.contact`)}</dt><dd className="mt-1 font-bold text-nexoraText">{draft.visibility.showContactName ? draft.contactName : t(`${TK}.hidden`)}</dd></div>
        </dl>
        <label className="mt-4 flex min-h-14 cursor-pointer items-start gap-3 text-xs font-medium leading-5 text-nexoraMuted">
          <input type="checkbox" checked={confirmed} disabled={isPending} onChange={(event) => onConfirmedChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-nexoraBrand" />
          <span>{t(`${TK}.confirm`)}</span>
        </label>
        <button type="button" disabled={!confirmed || isPending} onClick={onPublish} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}{t(isPending ? `${TK}.publishing` : isEditing ? `${TK}.update` : `${TK}.publish`)}
        </button>
        <button type="button" disabled={isPending} onClick={onBack} className="mt-2 min-h-11 w-full rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted disabled:opacity-50">← {t(`${TK}.back`)}</button>
      </aside>
    </div>
  )
}
