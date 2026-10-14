import { Briefcase, Clock3, Globe, Mail, MapPin, Phone, PlayCircle, UserRound } from 'lucide-react'

import { JobPostingStatus } from '../../../../constants/posRecruitment'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  formatRecruitmentDate,
  formatRecruitmentLocation,
  getPublicSalonLabel,
} from '../../../dashboard/views/pos/recruitment/recruitmentModel'
import { normalizePostingContent } from '../../../dashboard/views/pos/recruitment/recruitmentPostingContent'

import type { PosJobPosting } from '../../../../types/posRecruitment'
import RecruitmentPostingContentView from '../../../dashboard/views/pos/recruitment/RecruitmentPostingContentView'
import { getCommunitySalaryLabel } from './salaryCardLabel'

const TK = 'community_jobs_browser.hiringDetail'
const ENUM_TK = 'components.dashboard.views.pos.recruitment.enums'
const PREVIEW_TK = 'components.dashboard.views.pos.recruitment.preview'

interface CommunityHiringDetailContentProps {
  posting: PosJobPosting
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-bold uppercase tracking-wide text-nexoraMuted">{children}</h4>
}

function FactLabel({ children }: { children: React.ReactNode }) {
  return <dt className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">{children}</dt>
}

const linkClass = 'inline-flex min-h-8 items-center gap-1.5 text-xs font-medium text-nexoraBrand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand'

export default function CommunityHiringDetailContent({ posting }: CommunityHiringDetailContentProps) {
  const { t, currentLanguage } = useTranslation()
  const salon = getPublicSalonLabel(posting, t)
  const location = formatRecruitmentLocation(posting.city, posting.state)
  const pay = getCommunitySalaryLabel(posting, t('staff_dashboard.community.jobs.card.salaryNegotiable'))
  const payLabel = pay?.startsWith('$') ? `${pay} ${t(`${TK}.perWeek`)}` : pay
  const publicAddress = posting.visibility.showAddress && posting.address.trim()
    ? [posting.address.trim(), location, posting.zipCode.trim()].filter(Boolean).join(', ')
    : ''
  const publicPhone = posting.visibility.showPhone ? posting.phone.trim() : ''
  const publicEmail = posting.visibility.showPhone ? posting.contactEmail?.trim() ?? '' : ''
  const publicWebsite = posting.visibility.showPhone ? posting.website?.trim() ?? '' : ''
  const publicContactName = posting.visibility.showContactName ? posting.contactName.trim() : ''
  const contactLinks = [
    publicPhone ? <a key="phone" href={`tel:${publicPhone.replace(/[^\d+]/g, '')}`} className={linkClass}><Phone className="h-4 w-4 shrink-0" aria-hidden />{publicPhone}</a> : null,
    publicEmail ? <a key="email" href={`mailto:${publicEmail}`} className={`${linkClass} break-all`}><Mail className="h-4 w-4 shrink-0" aria-hidden />{publicEmail}</a> : null,
    publicWebsite ? <a key="website" href={publicWebsite} target="_blank" rel="noopener noreferrer" className={`${linkClass} break-all`}><Globe className="h-4 w-4 shrink-0" aria-hidden />{publicWebsite.replace(/^https?:\/\//i, '')}</a> : null,
  ].filter(Boolean)
  const media = normalizePostingContent(posting.postingContent)
  const posted = formatRecruitmentDate(posting.publishedAt || posting.createdAt, currentLanguage)
  const specialNotes = posting.benefits.map((benefit) => t(`${ENUM_TK}.benefit.${benefit}`)).join('. ')

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {media?.coverImage ? (
          <img src={media.coverImage.url} alt="" className="h-44 w-full shrink-0 rounded-xl object-cover sm:h-40 sm:w-60" />
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 id="hiring-post-detail-title" tabIndex={-1} data-community-detail-heading className="community-job-detail-title text-lg font-black leading-tight text-nexoraText sm:pr-8 sm:text-[22px]">{posting.title}</h3>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {posting.isUrgent ? <span className="community-job-detail-urgent rounded-full px-2.5 py-0.5 text-xs font-semibold">{t(`${PREVIEW_TK}.urgentBadge`)}</span> : null}
              <span className="rounded-full bg-nexoraBrandSoft px-2.5 py-0.5 text-xs font-semibold text-nexoraBrand">{t(`${TK}.hiringBadge`)}</span>
              {posting.status !== JobPostingStatus.Published ? <span className="rounded-full bg-nexoraSurfaceMuted px-2.5 py-0.5 text-xs font-semibold text-nexoraMuted">{t(`${ENUM_TK}.status.${posting.status}`)}</span> : null}
            </div>
            {payLabel ? <p className="shrink-0 text-right text-base font-black text-emerald-600">{payLabel}</p> : null}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-nexoraMuted">
            <span className="font-semibold text-nexoraText">{salon}</span>
            <span>{t(`${TK}.posted`, { date: posted })}</span>
          </p>
        </div>
      </section>

      {posting.status === JobPostingStatus.Pending ? <p className="rounded-lg border border-nexoraBorder bg-nexoraSurfaceMuted p-3 text-xs font-medium text-nexoraMuted">{t(`${PREVIEW_TK}.pendingNotice`)}</p> : null}

      <section className="rounded-xl bg-[#f3f6fa] p-4 sm:p-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-[1fr_1fr_1.8fr] sm:gap-0">
          <div className="flex items-start gap-2.5 sm:gap-3 sm:pr-5">
            <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-nexoraText" aria-hidden />
            <div className="min-w-0"><FactLabel>{t(`${TK}.headcount`)}</FactLabel><dd className="mt-0.5 text-[13px] font-medium text-nexoraText">{posting.headcount}</dd></div>
          </div>
          <div className="flex items-start gap-2.5 sm:gap-3 sm:border-l sm:border-nexoraRule sm:px-5">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-nexoraText" aria-hidden />
            <div className="min-w-0"><FactLabel>{t(`${TK}.schedule`)}</FactLabel><dd className="mt-0.5 text-[13px] font-medium text-nexoraText">{t(`${ENUM_TK}.workType.${posting.workType}`)}</dd></div>
          </div>
          <div className="col-span-2 flex items-start gap-2.5 border-t border-nexoraRule pt-4 sm:col-span-1 sm:gap-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-nexoraText" aria-hidden />
            <div className="min-w-0">
              <FactLabel>{t(`${TK}.location`)}</FactLabel>
              <dd className="mt-0.5 break-words text-[13px] font-medium leading-snug text-nexoraText">
                {publicAddress
                  ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(publicAddress)}`} target="_blank" rel="noopener noreferrer" title={t(`${TK}.mapAction`)} className="text-nexoraBrand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">{publicAddress}</a>
                  : location || '—'}
              </dd>
            </div>
          </div>
        </dl>
        {publicContactName || contactLinks.length ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-nexoraRule pt-4 text-xs sm:flex-row sm:items-center sm:gap-x-5">
            <div className="flex shrink-0 items-start gap-3">
              <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-nexoraText" aria-hidden />
              <dl className="min-w-0"><FactLabel>{t(`${TK}.contact`)}</FactLabel>{publicContactName ? <dd className="mt-0.5 text-[13px] font-bold text-nexoraText">{publicContactName}</dd> : null}</dl>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-0.5 sm:flex-nowrap">
              {contactLinks.map((link, index) => <span key={index} className={`inline-flex min-w-0 items-center gap-4 ${link.key === 'email' ? 'order-last sm:order-none' : ''}`}>{index > 0 || publicContactName ? <span aria-hidden className="hidden h-4 w-px shrink-0 bg-nexoraRule sm:block" /> : null}{link}</span>)}
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <SectionLabel>{t(`${TK}.description`)}</SectionLabel>
        <RecruitmentPostingContentView body={posting.body || t(`${PREVIEW_TK}.bodyFallback`)} postingContent={posting.postingContent} showCover={false} showImages={false} showVideos={false} />
        {posting.skills.length ? <div className="flex flex-wrap gap-2 pt-1">{posting.skills.map((skill) => <span key={skill} className="rounded-md border border-nexoraBorder bg-nexoraSurfaceMuted px-2 py-1 text-xs font-semibold text-nexoraText">{t(`${ENUM_TK}.skill.${skill}`)}</span>)}</div> : null}
        {posting.deadline ? <p className="text-xs font-medium text-nexoraMuted">{t(`${TK}.deadline`)}: <span className="text-nexoraText">{formatRecruitmentDate(posting.deadline, currentLanguage)}</span></p> : null}
      </section>

      {specialNotes ? (
        <section className="space-y-2">
          <SectionLabel>{t(`${TK}.specialNotes`)}</SectionLabel>
          <p className="text-sm font-medium leading-6 text-nexoraText">{specialNotes}.</p>
        </section>
      ) : null}

      {media?.videoUrls.length ? (
        <section className="space-y-2">
          <SectionLabel>{t(`${TK}.videos`)}</SectionLabel>
          <div className="space-y-1">{media.videoUrls.map((url) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="flex min-h-9 items-center gap-2 break-all text-sm font-medium text-nexoraBrand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand"><PlayCircle className="h-5 w-5 shrink-0" aria-hidden />{url}</a>)}</div>
        </section>
      ) : null}

      {media?.images.length ? (
        <section className="space-y-2">
          <SectionLabel>{t(`${TK}.images`)}</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{media.images.map((image, index) => <img key={`${index}-${image.name}`} src={image.url} alt={image.name} loading="lazy" className="h-64 w-full rounded-xl object-cover" />)}</div>
        </section>
      ) : null}
    </div>
  )
}
