import { Building2, ExternalLink, MapPin, Phone, UserRound } from 'lucide-react'

import { JobPostingStatus } from '../../../../constants/posRecruitment'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  formatRecruitmentDate,
  formatRecruitmentLocation,
  getPublicSalonLabel,
} from '../../../dashboard/views/pos/recruitment/recruitmentModel'

import { getHeadcountLabel } from './staffJobsModel'
import type { PosJobPosting } from '../../../../types/posRecruitment'
import RecruitmentPostingContentView from '../../../dashboard/views/pos/recruitment/RecruitmentPostingContentView'
import { getCommunitySalaryLabel } from './salaryCardLabel'

const TK = 'community_jobs_browser.hiringDetail'
const ENUM_TK = 'components.dashboard.views.pos.recruitment.enums'
const PREVIEW_TK = 'components.dashboard.views.pos.recruitment.preview'

interface CommunityHiringDetailContentProps {
  posting: PosJobPosting
  relatedPostings: PosJobPosting[]
  onOpenRelated?: (postingId: string) => void
}

function SalonAvatar({ posting, label }: { posting: PosJobPosting; label: string }) {
  return (
    <span aria-hidden className="community-job-detail-avatar flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted text-xl font-black text-nexoraBrand sm:h-14 sm:w-14">
      {posting.visibility.showBusinessName ? label.charAt(0).toUpperCase() : <Building2 className="h-6 w-6" />}
    </span>
  )
}

export default function CommunityHiringDetailContent({ posting, relatedPostings, onOpenRelated }: CommunityHiringDetailContentProps) {
  const { t, currentLanguage } = useTranslation()
  const salon = getPublicSalonLabel(posting, t)
  const location = formatRecruitmentLocation(posting.city, posting.state)
  const pay = getCommunitySalaryLabel(posting, t('staff_dashboard.community.jobs.card.salaryNegotiable'))
  const publicAddress = posting.visibility.showAddress && posting.address.trim()
    ? [posting.address.trim(), location, posting.zipCode.trim()].filter(Boolean).join(', ')
    : ''
  const publicPhone = posting.visibility.showPhone ? posting.phone.trim() : ''
  const publicContactName = posting.visibility.showContactName ? posting.contactName.trim() : ''
  const related = relatedPostings
    .filter((candidate) => candidate.id !== posting.id)
    .sort((left, right) => Number(right.city === posting.city && right.state === posting.state) - Number(left.city === posting.city && left.state === posting.state))
    .slice(0, 3)

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="community-job-detail-hero flex flex-col gap-4 rounded-xl border border-nexoraBorder bg-nexoraSurface p-4 sm:flex-row sm:items-start sm:p-6">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <SalonAvatar posting={posting} label={salon} />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
              <span className="font-bold text-nexoraBrand">{salon}</span>
              {location ? <span className="inline-flex items-center gap-1 text-nexoraMuted"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />{location}</span> : null}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {posting.isUrgent ? <span className="community-job-detail-urgent rounded-md px-2 py-1 text-xs font-black">{t(`${PREVIEW_TK}.urgentBadge`)}</span> : null}
              {posting.status !== JobPostingStatus.Published ? <span className="rounded-md bg-nexoraSurfaceMuted px-2 py-1 text-xs font-bold text-nexoraMuted">{t(`${ENUM_TK}.status.${posting.status}`)}</span> : null}
              <h3 tabIndex={-1} data-community-detail-heading className="community-job-detail-title min-w-0 text-lg font-black leading-snug text-nexoraText sm:text-2xl">{posting.title}</h3>
            </div>
            <p className="mt-2 text-xs text-nexoraMuted">{t(`${TK}.posted`, { date: formatRecruitmentDate(posting.publishedAt || posting.createdAt, currentLanguage) })}</p>
          </div>
        </div>
        {pay ? <p className="community-job-detail-pay shrink-0 self-start rounded-lg px-3 py-2 text-base font-black sm:max-w-[12rem] sm:text-right">{pay}</p> : null}
      </section>

      {posting.status === JobPostingStatus.Pending ? <p className="rounded-lg border border-nexoraBorder bg-nexoraSurfaceMuted p-3 text-xs font-medium text-nexoraMuted">{t(`${PREVIEW_TK}.pendingNotice`)}</p> : null}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.85fr)_minmax(18rem,1fr)] lg:gap-5">
        <section className="community-job-detail-panel min-w-0 overflow-hidden rounded-xl border border-nexoraBorder bg-nexoraSurface">
          <h4 className="px-4 pb-0 pt-4 text-base font-black text-nexoraText sm:px-6 sm:pt-6">{t(`${TK}.contentTitle`)}</h4>
          <div className="space-y-5 p-4 sm:p-6">
            <RecruitmentPostingContentView body={posting.body || t(`${PREVIEW_TK}.bodyFallback`)} postingContent={posting.postingContent} />
            <dl className="community-job-detail-facts grid grid-cols-2 gap-x-3 gap-y-4 py-4 text-sm sm:gap-x-5">
              <div><dt className="text-xs font-bold text-nexoraMuted">{t(`${TK}.position`)}</dt><dd className="mt-1 font-semibold text-nexoraText">{t(`${ENUM_TK}.position.${posting.position}`)}</dd></div>
              <div><dt className="text-xs font-bold text-nexoraMuted">{t(`${TK}.workType`)}</dt><dd className="mt-1 font-semibold text-nexoraText">{t(`${ENUM_TK}.workType.${posting.workType}`)}</dd></div>
              <div><dt className="text-xs font-bold text-nexoraMuted">{t(`${TK}.headcount`)}</dt><dd className="mt-1 font-semibold text-nexoraText">{getHeadcountLabel(posting.headcount, t)}</dd></div>
              {posting.deadline ? <div><dt className="text-xs font-bold text-nexoraMuted">{t(`${TK}.deadline`)}</dt><dd className="mt-1 font-semibold text-nexoraText">{formatRecruitmentDate(posting.deadline, currentLanguage)}</dd></div> : null}
            </dl>
            <div><h5 className="text-xs font-bold text-nexoraMuted">{t(`${TK}.skills`)}</h5><div className="mt-2 flex flex-wrap gap-2">{posting.skills.map((skill) => <span key={skill} className="rounded-md border border-nexoraBorder bg-nexoraSurfaceMuted px-2 py-1 text-xs font-semibold text-nexoraText">{t(`${ENUM_TK}.skill.${skill}`)}</span>)}</div></div>
            {posting.benefits.length ? <div><h5 className="text-xs font-bold text-nexoraMuted">{t(`${TK}.benefits`)}</h5><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-nexoraText">{posting.benefits.map((benefit) => <li key={benefit}>{t(`${ENUM_TK}.benefit.${benefit}`)}</li>)}</ul></div> : null}
            {posting.selectedServices.length ? <div><h5 className="text-xs font-bold text-nexoraMuted">{t(`${TK}.services`)}</h5><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-nexoraText">{posting.selectedServices.map((service) => <li key={service.posServiceId}>{service.name}</li>)}</ul></div> : null}
          </div>
        </section>

        <aside className="min-w-0 space-y-4">
          <section className="community-job-detail-panel overflow-hidden rounded-xl border border-nexoraBorder bg-nexoraSurface">
            <h4 className="px-4 pb-0 pt-4 text-base font-black text-nexoraText sm:px-5 sm:pt-5">{t(`${TK}.contactTitle`)}</h4>
            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex items-center gap-2"><Building2 className="h-5 w-5 shrink-0 text-nexoraBrand" aria-hidden /><p className="min-w-0 break-words font-bold text-nexoraText">{salon}</p></div>
              {publicContactName ? <p className="flex items-start gap-2 text-sm text-nexoraText"><UserRound className="mt-0.5 h-4 w-4 shrink-0 text-nexoraMuted" aria-hidden />{publicContactName}</p> : null}
              {publicPhone ? <a href={`tel:${publicPhone.replace(/[^\d+]/g, '')}`} className="community-job-detail-phone inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg px-3 text-sm font-bold"><Phone className="h-4 w-4 shrink-0" aria-hidden />{publicPhone}</a> : <p className="text-xs leading-5 text-nexoraMuted">{t(`${PREVIEW_TK}.chatHelper`)}</p>}
              {publicAddress ? <div className="text-sm text-nexoraText"><p className="flex items-center gap-1 font-bold"><MapPin className="h-4 w-4" aria-hidden />{t(`${TK}.address`)}</p><p className="mt-1 break-words leading-6">{publicAddress}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(publicAddress)}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center gap-1 font-semibold text-nexoraBrand underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">{t(`${TK}.mapAction`)}<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a></div> : location ? <p className="flex items-center gap-1 text-sm text-nexoraMuted"><MapPin className="h-4 w-4" aria-hidden />{location}</p> : null}
            </div>
          </section>

          <section className="community-job-detail-panel overflow-hidden rounded-xl border border-nexoraBorder bg-nexoraSurface">
            <h4 className="px-4 pb-2 pt-4 text-base font-black text-nexoraText sm:px-5 sm:pt-5">{t(`${TK}.relatedTitle`)}</h4>
            {related.length && onOpenRelated ? related.map((candidate) => {
              const candidatePay = getCommunitySalaryLabel(candidate, t('staff_dashboard.community.jobs.card.salaryNegotiable'))
              return <button key={candidate.id} type="button" onClick={() => onOpenRelated(candidate.id)} className="community-job-detail-related block min-h-11 w-full border-t border-nexoraRule p-4 text-left sm:px-5">
                <div className="flex items-start gap-2"><Building2 className="mt-0.5 h-5 w-5 shrink-0 text-nexoraMuted" aria-hidden /><div className="min-w-0 flex-1"><p className="text-xs leading-5 text-nexoraMuted"><span className="font-semibold text-nexoraBrand">{getPublicSalonLabel(candidate, t)}</span> · {formatRecruitmentLocation(candidate.city, candidate.state)}</p><p className="mt-1 line-clamp-2 text-sm font-bold text-nexoraText">{candidate.title}</p></div></div>
                {candidatePay ? <p className="mt-2 break-words text-sm font-bold text-nexoraDanger">{candidatePay}</p> : null}
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-nexoraMuted">{candidate.body}</p>
              </button>
            }) : <p className="p-4 text-sm text-nexoraMuted">{t(`${TK}.relatedEmpty`)}</p>}
          </section>
        </aside>
      </div>
    </div>
  )
}
