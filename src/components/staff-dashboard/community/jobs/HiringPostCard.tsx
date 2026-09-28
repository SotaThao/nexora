import { MapPin } from 'lucide-react'

import { JobPostingStatus } from '../../../../constants/posRecruitment'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  formatRecruitmentDate,
  formatRecruitmentLocation,
  getPublicSalonLabel,
  getRecruitmentPayLabel,
} from '../../../dashboard/views/pos/recruitment/recruitmentModel'
import type { PosJobPosting } from '../../../../types/posRecruitment'
import { formatSalaryCardLabel } from './salaryCardLabel'

const TK = 'staff_dashboard.community.jobs.card'
const RECRUITMENT_TK = 'components.dashboard.views.pos.recruitment'
const THUMBNAIL = '/assets/images/marketing/nail/nail_rose_quartz.jpg'

interface HiringPostCardProps {
  posting: PosJobPosting
  alreadyApplied: boolean
  onOpenDetail: (posting: PosJobPosting) => void
}

export default function HiringPostCard({ posting, alreadyApplied, onOpenDetail }: HiringPostCardProps) {
  const { t, currentLanguage } = useTranslation()
  const businessLabel = getPublicSalonLabel(posting, t)
  const location = formatRecruitmentLocation(posting.city, posting.state)
  const pay = formatSalaryCardLabel(
    getRecruitmentPayLabel(posting, t),
    t(`${TK}.salaryNegotiable`),
  )
  const posted = formatRecruitmentDate(posting.publishedAt || posting.createdAt, currentLanguage)

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${t(`${TK}.viewDetail`)}: ${posting.title}`}
      onClick={() => onOpenDetail(posting)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenDetail(posting)
        }
      }}
      className="h-full cursor-pointer rounded-xl border border-nexoraBorder bg-nexoraSurface p-2.5 text-left shadow-nexora-card transition-colors hover:border-nexoraBrand hover:bg-nexoraBrandSoft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2"
    >
      <div className="flex items-start gap-2.5">
        <img src={THUMBNAIL} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {posting.isUrgent ? (
              <span className="shrink-0 rounded-md bg-nexoraDanger px-2 py-0.5 text-xs font-extrabold text-white">
                {t(`${RECRUITMENT_TK}.preview.urgentBadge`)}
              </span>
            ) : null}
            {pay ? (
              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-nexoraSuccess/40 bg-nexoraSuccess/10 px-2 py-0.5 text-xs font-extrabold text-nexoraText" title={pay}>
                <span className="h-1.5 w-1.5 rounded-full bg-nexoraSuccess" aria-hidden="true" />
                {pay}
              </span>
            ) : null}
            {posting.status !== JobPostingStatus.Published ? (
              <span className="rounded-md bg-nexoraSurfaceMuted px-2 py-0.5 text-xs font-extrabold text-nexoraMuted">
                {t(`${RECRUITMENT_TK}.enums.status.${posting.status}`)}
              </span>
            ) : null}
            {alreadyApplied ? (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-700">{t(`${TK}.alreadyApplied`)}</span>
            ) : null}
          </div>
          <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-nexoraText">{posting.title}</h3>
        </div>
      </div>
      <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-sm text-nexoraMuted">
        <span className="min-w-0 truncate font-semibold text-nexoraBrand">{businessLabel}</span>
        {location ? (
          <>
            <span aria-hidden="true">·</span>
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </>
        ) : null}
        <span aria-hidden="true">·</span>
        <span className="shrink-0">{posted}</span>
      </p>
      <p className="mt-2 min-h-[63px] line-clamp-3 text-sm leading-relaxed text-nexoraMuted">{posting.body}</p>
    </article>
  )
}
