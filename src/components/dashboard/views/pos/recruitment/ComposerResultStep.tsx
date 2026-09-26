import { CheckCircle2, Clock3 } from 'lucide-react'

import { JobPostingStatus } from '../../../../../constants/posRecruitment'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { PosJobPosting } from '../../../../../types/posRecruitment'
import { joinRecruitmentMeta } from './recruitmentModel'

const TK = 'components.dashboard.views.pos.recruitment.composer.result'

interface ComposerResultStepProps {
  posting: PosJobPosting
  onPreview: () => void
  onDone: () => void
}

export default function ComposerResultStep({ posting, onPreview, onDone }: ComposerResultStepProps) {
  const { t } = useTranslation()
  const pending = posting.status === JobPostingStatus.Pending
  const StatusIcon = pending ? Clock3 : CheckCircle2
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-nexoraBorder bg-white p-6 text-center shadow-sm sm:p-8">
      <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full border ${pending ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-emerald-100 bg-emerald-50 text-emerald-600'}`}><StatusIcon className="h-8 w-8" aria-hidden /></div>
      <h2 className="mt-5 text-2xl font-black text-nexoraText">{t(`${TK}.title`)}</h2>
      <p className="mt-3 text-sm font-medium leading-6 text-nexoraMuted">{t(`${TK}.description`)}</p>
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted p-4 text-left">
        <img src="/assets/images/ecosystem/nailhub.png" width="56" height="32" alt="NailHub" className="h-8 w-auto shrink-0 object-contain" />
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-nexoraText">{posting.title}</p><p className="mt-1 text-xs font-medium text-nexoraMuted">{joinRecruitmentMeta([posting.code, posting.businessName])}</p></div>
        <span className="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">{t(`components.dashboard.views.pos.recruitment.enums.status.${posting.status}`)}</span>
      </div>
      <button type="button" onClick={onPreview} className="mt-6 min-h-11 w-full rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white hover:bg-nexoraBrandDark">{t(`${TK}.viewPost`)}</button>
      <button type="button" onClick={onDone} className="mt-2 min-h-11 w-full rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted">{t(`${TK}.backToList`)}</button>
    </section>
  )
}
