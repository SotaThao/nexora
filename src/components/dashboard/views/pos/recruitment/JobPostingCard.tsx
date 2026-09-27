// Adapted for Community demo
import { Clock3, FileText, MapPin, MessagesSquare, Pencil, Users } from 'lucide-react'

import { JobPostingStatus } from '../../../../../constants/posRecruitment'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { PosJobPosting } from '../../../../../types/posRecruitment'
import { useCommunityJobsDemo } from '../../../../community/jobs/CommunityJobsDemoContext'
import { formatRecruitmentDate, formatRecruitmentLocation, getRecruitmentPayLabel } from './recruitmentModel'

const TK = 'components.dashboard.views.pos.recruitment'

interface JobPostingCardProps {
  posting: PosJobPosting
  onPreview: (posting: PosJobPosting) => void
  onEdit: (posting: PosJobPosting) => void
  onClose: (posting: PosJobPosting) => void
}

const STATUS_CLASS: Record<JobPostingStatus, string> = {
  [JobPostingStatus.Draft]: 'bg-slate-100 text-slate-600',
  [JobPostingStatus.Pending]: 'bg-amber-50 text-amber-700',
  [JobPostingStatus.Published]: 'bg-emerald-50 text-emerald-700',
  [JobPostingStatus.Closed]: 'bg-slate-100 text-slate-500',
  [JobPostingStatus.Filled]: 'bg-indigo-50 text-indigo-700',
}

export default function JobPostingCard({ posting, onPreview, onEdit, onClose }: JobPostingCardProps) {
  const { t, currentLanguage } = useTranslation()
  const { openInbox } = useCommunityJobsDemo()
  const created = formatRecruitmentDate(posting.createdAt, currentLanguage)
  const location = formatRecruitmentLocation(posting.city, posting.state)
  const pay = getRecruitmentPayLabel(posting, t)

  return (
    <article className="border-t border-nexoraRule px-4 py-5 first:border-t-0 sm:px-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-nexoraBrandSoft text-nexoraBrand">
          {posting.status === JobPostingStatus.Draft
            ? <Pencil className="h-4 w-4" aria-hidden />
            : <FileText className="h-4 w-4" aria-hidden />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-black leading-snug text-nexoraText">{posting.title}</h3>
              <p className="mt-1 text-[11px] font-medium text-nexoraMuted">{posting.code} · {created}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {posting.isUrgent ? <span className="rounded-md bg-rose-500 px-2 py-1 text-[10px] font-black text-white">{t(`${TK}.preview.urgentBadge`)}</span> : null}
              <span className={`w-fit shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${STATUS_CLASS[posting.status]}`}>
                {t(`${TK}.enums.status.${posting.status}`)}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-nexoraMuted">
            {location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{location}</span> : null}
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden />{t(`${TK}.enums.workType.${posting.workType}`)}</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden />{t(`${TK}.preview.headcount`, { count: posting.headcount })}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {posting.skills.map((skill) => (
              <span key={skill} className="rounded-md border border-nexoraBorder bg-nexoraSurfaceMuted px-2 py-1 text-[10px] font-semibold text-nexoraMuted">
                {t(`${TK}.enums.skill.${skill}`)}
              </span>
            ))}
            <span className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">{pay}</span>
          </div>
        </div>
      </div>

      <footer className="mt-4 flex flex-col gap-2 border-t border-dashed border-nexoraRule pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-nexoraSubtle">
          {posting.status === JobPostingStatus.Draft
            ? t(`${TK}.list.notSent`)
            : posting.status === JobPostingStatus.Closed
              ? t(`${TK}.list.closedStatus`)
              : t(`${TK}.list.nailhubStatus`)}
        </span>
        <div className="flex flex-wrap items-center gap-1 sm:justify-end">
          {posting.status !== JobPostingStatus.Draft ? (
            <button type="button" aria-label={t(`${TK}.list.messages`)} onClick={openInbox} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-bold text-nexoraBrand hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
              <MessagesSquare className="h-4 w-4" aria-hidden />
              {t(`${TK}.list.messages`)}
            </button>
          ) : null}
          {posting.status !== JobPostingStatus.Draft ? (
            <button type="button" onClick={() => onPreview(posting)} className="min-h-11 rounded-lg px-3 font-bold text-nexoraBrand hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
              {t(`${TK}.list.viewPost`)} ↗
            </button>
          ) : null}
          <button type="button" onClick={() => onEdit(posting)} className="min-h-11 rounded-lg px-3 font-bold text-nexoraBrand hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
            {posting.status === JobPostingStatus.Draft ? `${t(`${TK}.list.continueDraft`)} →` : t(`${TK}.list.edit`)}
          </button>
          {posting.status !== JobPostingStatus.Draft && posting.status !== JobPostingStatus.Closed ? (
            <button type="button" onClick={() => onClose(posting)} className="min-h-11 rounded-lg px-3 font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
              {t(`${TK}.list.closeRecruitment`)}
            </button>
          ) : null}
        </div>
      </footer>
    </article>
  )
}
