import { Briefcase, MapPin, UserRound } from 'lucide-react'

import { JobPostingStatus } from '../../../../constants/posRecruitment'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  formatRecruitmentLocation,
  getRecruitmentPayLabel,
  joinRecruitmentMeta,
} from '../../../dashboard/views/pos/recruitment/recruitmentModel'
import type { SeekingPostUpsertInput } from '../../../../types/communityJobs'
import { getSeekingPublicName } from './staffJobsModel'

const TK = 'staff_dashboard.community.jobs.composer.preview'
const ENUM_TK = 'components.dashboard.views.pos.recruitment.enums'

export type SeekingPreviewDraft = SeekingPostUpsertInput & { status?: JobPostingStatus }

interface SeekingPostPreviewProps {
  draft: SeekingPreviewDraft
  compact?: boolean
}

export default function SeekingPostPreview({ draft, compact = false }: SeekingPostPreviewProps) {
  const { t } = useTranslation()
  const locationLabel = formatRecruitmentLocation(draft.city, draft.state)
  const payLabel = getRecruitmentPayLabel(
    { payType: draft.payType, payAmount: draft.payAmount ?? null, payUnit: draft.payUnit ?? null, payText: draft.payText },
    t,
  )
  const publicName = getSeekingPublicName(draft, t(`${TK}.anonymousName`))
  const phone = draft.visibility.showPhone ? draft.phone : ''

  return (
    <article className="overflow-hidden rounded-xl border border-nexoraLavender bg-white text-nexoraText shadow-sm">
      {!compact && draft.status === JobPostingStatus.Pending ? (
        <p className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">{t(`${TK}.pendingNotice`)}</p>
      ) : null}
      <header className="flex min-h-14 items-center gap-3 border-b border-nexoraRule bg-nexoraBrandSoft px-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-nexoraBrand"><UserRound className="h-5 w-5" aria-hidden /></span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-nexoraText">{publicName}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-nexoraBrand">{t(`${TK}.badge`)}</p>
        </div>
      </header>

      <div className={compact ? 'space-y-2.5 p-4' : 'space-y-4 p-5 sm:p-6'}>
        <div className="space-y-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-nexoraBrand">{joinRecruitmentMeta([t(`${TK}.category`), locationLabel])}</p>
          <h3 className={`${compact ? 'text-base' : 'text-xl'} font-black leading-snug text-nexoraText`}>{draft.title || t(`${TK}.titleFallback`)}</h3>
          <p className="text-xs font-medium text-nexoraMuted">{t(`staff_dashboard.community.jobs.experience.${draft.experience}`)}</p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-nexoraMuted">
          {draft.workTypes.map((workType) => (
            <span key={workType} className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" aria-hidden />{t(`${ENUM_TK}.workType.${workType}`)}</span>
          ))}
          {locationLabel ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{locationLabel}</span> : null}
        </div>

        <p className="font-extrabold text-nexoraBrand">{payLabel}</p>
        <div className="flex flex-wrap gap-1.5">
          {draft.skills.map((skill) => (
            <span key={skill} className="rounded-md border border-nexoraBorder bg-nexoraSurfaceMuted px-2 py-1 text-[10px] font-semibold text-nexoraMuted">{t(`${ENUM_TK}.skill.${skill}`)}</span>
          ))}
        </div>

        {!compact ? (
          <>
            <div className="whitespace-pre-wrap border-t border-nexoraRule pt-4 text-sm font-medium leading-7 text-nexoraMuted">{draft.body || t(`${TK}.bodyFallback`)}</div>
            <div className="space-y-1 border-t border-nexoraRule pt-4 text-xs font-medium leading-6 text-nexoraMuted">
              <h4 className="font-extrabold text-nexoraText">{t(`${TK}.contact`)}</h4>
              {phone ? <p>{phone}</p> : <p>{t(`${TK}.chatOnly`)}</p>}
              {draft.availableFrom ? <p>{t(`${TK}.availableFrom`, { date: draft.availableFrom })}</p> : null}
            </div>
          </>
        ) : null}
      </div>
    </article>
  )
}
