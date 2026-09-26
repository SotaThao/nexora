import { Briefcase, CheckCircle2, MapPin, MessagesSquare, Users } from 'lucide-react'

import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  formatRecruitmentDate,
  formatRecruitmentLocation,
  getPublicSalonLabel,
  getRecruitmentPayLabel,
} from '../../../dashboard/views/pos/recruitment/recruitmentModel'
import type { PosJobPosting } from '../../../../types/posRecruitment'
import { getHeadcountLabel } from './staffJobsModel'

const TK = 'staff_dashboard.community.jobs.card'
const ENUM_TK = 'components.dashboard.views.pos.recruitment.enums'

interface HiringPostCardProps {
  posting: PosJobPosting
  alreadyApplied: boolean
  onOpenDetail: (posting: PosJobPosting) => void
  onApply: (posting: PosJobPosting) => void
  onChat: (posting: PosJobPosting) => void
}

export default function HiringPostCard({ posting, alreadyApplied, onOpenDetail, onApply, onChat }: HiringPostCardProps) {
  const { t, currentLanguage } = useTranslation()
  const businessLabel = getPublicSalonLabel(posting, t)
  const location = formatRecruitmentLocation(posting.city, posting.state)
  const pay = getRecruitmentPayLabel(posting, t)
  const posted = formatRecruitmentDate(posting.publishedAt || posting.createdAt, currentLanguage)

  return (
    <article className="border-t border-nexoraRule px-4 py-5 first:border-t-0 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => onOpenDetail(posting)} className="min-w-0 flex-1 text-left">
          <h3 className="font-black leading-snug text-nexoraText hover:underline">{posting.title}</h3>
          <p className="mt-1 text-xs font-medium text-nexoraMuted">{businessLabel} · {t(`${TK}.postedOn`, { date: posted })}</p>
        </button>
        {posting.isUrgent ? <span className="shrink-0 rounded-md bg-rose-500 px-2 py-1 text-[10px] font-black text-white">{t('components.dashboard.views.pos.recruitment.preview.urgentBadge')}</span> : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-nexoraMuted">
        {location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{location}</span> : null}
        <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" aria-hidden />{t(`${ENUM_TK}.workType.${posting.workType}`)}</span>
        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden />{getHeadcountLabel(posting.headcount, t)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {posting.skills.map((skill) => (
          <span key={skill} className="rounded-md border border-nexoraBorder bg-nexoraSurfaceMuted px-2 py-1 text-[10px] font-semibold text-nexoraMuted">
            {t(`${ENUM_TK}.skill.${skill}`)}
          </span>
        ))}
        <span className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">{pay}</span>
      </div>

      <footer className="mt-4 flex flex-col gap-2 border-t border-dashed border-nexoraRule pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        {alreadyApplied ? (
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden />{t(`${TK}.alreadyApplied`)}</span>
        ) : <span />}
        <div className="flex flex-wrap items-center gap-1 sm:justify-end">
          <button type="button" onClick={() => onChat(posting)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-bold text-nexoraBrand hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
            <MessagesSquare className="h-4 w-4" aria-hidden />{t(`${TK}.messageAction`)}
          </button>
          <button type="button" onClick={() => onOpenDetail(posting)} className="min-h-11 rounded-lg px-3 font-bold text-nexoraBrand hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
            {t(`${TK}.viewDetail`)}
          </button>
          <button
            type="button"
            disabled={alreadyApplied}
            onClick={() => onApply(posting)}
            className="min-h-11 rounded-lg bg-nexoraBrand px-3 font-bold text-white hover:bg-nexoraBrandDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t(`${TK}.applyAction`)}
          </button>
        </div>
      </footer>
    </article>
  )
}
