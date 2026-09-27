import { Briefcase, MapPin, Users } from 'lucide-react'

import { JobPostingStatus } from '../../../../../constants/posRecruitment'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import {
  formatRecruitmentLocation,
  formatRecruitmentDate,
  getPublicSalonLabel,
  getRecruitmentPayLabel,
  joinRecruitmentMeta,
  type RecruitmentPreviewDraft,
} from './recruitmentModel'

const TK = 'components.dashboard.views.pos.recruitment'

interface NailhubPostPreviewProps {
  draft: RecruitmentPreviewDraft
  compact?: boolean
  logo?: string | null
}

export default function NailhubPostPreview({ draft, compact = false, logo }: NailhubPostPreviewProps) {
  const { t, currentLanguage } = useTranslation()
  const locationLabel = formatRecruitmentLocation(draft.city, draft.state)
  const fullLocality = [locationLabel, draft.zipCode.trim()].filter(Boolean).join(' ')
  const businessLabel = getPublicSalonLabel(draft, t)
  const payLabel = getRecruitmentPayLabel(draft, t)
  const contactName = draft.visibility.showContactName ? draft.contactName : ''
  const phone = draft.visibility.showPhone ? draft.phone : ''
  const displayedContactName = contactName || t(`${TK}.preview.managerFallback`)
  const contact = joinRecruitmentMeta([displayedContactName, phone])
  const contactAction = draft.status === JobPostingStatus.Closed
    ? t(`${TK}.preview.closedAction`)
    : phone
      ? t(`${TK}.preview.contactAction`, { contact })
      : t(`${TK}.preview.chatAction`)

  return (
    <article className="overflow-hidden rounded-xl border border-emerald-100 bg-white text-nexoraText shadow-sm">
      {!compact && draft.status === JobPostingStatus.Pending ? <p className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">{t(`${TK}.preview.pendingNotice`)}</p> : null}
      <header className="flex min-h-14 items-center border-b border-nexoraRule bg-emerald-50/40 px-4">
        <img src="/assets/images/ecosystem/nailhub.png" width="92" height="30" alt="NailHub" className="h-7 w-auto object-contain" />
      </header>

      <div className={`flex items-center justify-center bg-gradient-to-br from-emerald-50 to-nexoraBrandSoft ${compact ? 'h-28' : 'h-40 sm:h-48'}`}>
        {draft.visibility.showBusinessName ? (
          logo
            ? <img src={logo} width="96" height="96" alt="" className={`${compact ? 'h-14 w-14' : 'h-20 w-20'} rounded-2xl object-cover shadow-sm`} />
            : <div className={`${compact ? 'h-14 w-14 text-lg' : 'h-20 w-20 text-2xl'} grid place-items-center rounded-2xl bg-white font-black text-emerald-700 shadow-sm`}>{businessLabel.charAt(0).toUpperCase()}</div>
        ) : (
          <div className="text-center text-emerald-800"><MapPin className="mx-auto h-6 w-6" aria-hidden /><p className="mt-2 text-xs font-bold">{businessLabel}</p><p className="mt-1 text-[10px] font-medium">{t(`${TK}.preview.hiddenCoverNote`)}</p></div>
        )}
      </div>

      <div className={compact ? 'space-y-2.5 p-4' : 'space-y-4 p-5 sm:p-6'}>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700">{joinRecruitmentMeta([t(`${TK}.preview.category`), locationLabel])}</p>
            {draft.isUrgent ? <span className="rounded-md bg-rose-500 px-2 py-1 text-[10px] font-black text-white">{t(`${TK}.preview.urgentBadge`)}</span> : null}
          </div>
          <h3 className={`${compact ? 'text-base' : 'text-xl'} font-black leading-snug text-nexoraText`}>{draft.title || t(`${TK}.preview.titleFallback`)}</h3>
          <p className="text-xs font-medium text-nexoraMuted">{businessLabel}</p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-nexoraMuted">
          <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" aria-hidden />{t(`${TK}.enums.workType.${draft.workType}`)}</span>
          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden />{t(`${TK}.preview.headcount`, { count: draft.headcount })}</span>
        </div>

        <p className="font-extrabold text-emerald-800">{payLabel}</p>
        <div className="flex flex-wrap gap-1.5">{draft.skills.map((skill) => <span key={skill} className="rounded-md border border-nexoraBorder bg-nexoraSurfaceMuted px-2 py-1 text-[10px] font-semibold text-nexoraMuted">{t(`${TK}.enums.skill.${skill}`)}</span>)}</div>

        {draft.benefits.length > 0 ? <div><h4 className="text-xs font-extrabold text-nexoraText">{t(`${TK}.preview.benefits`)}</h4><div className="mt-2 flex flex-wrap gap-1.5">{draft.benefits.map((benefit) => <span key={benefit} className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">{t(`${TK}.enums.benefit.${benefit}`)}</span>)}</div></div> : null}

        {draft.selectedServices.length > 0 ? <div className="border-t border-nexoraRule pt-3"><h4 className="text-xs font-extrabold text-nexoraText">{t(`${TK}.preview.selectedServices`)}</h4><div className="mt-2 flex flex-wrap gap-1.5">{draft.selectedServices.map((service) => <span key={service.posServiceId} className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">{service.name}</span>)}</div></div> : null}

        {!compact ? <>
          <div className="whitespace-pre-wrap border-t border-nexoraRule pt-4 text-sm font-medium leading-7 text-nexoraMuted">{draft.body || t(`${TK}.preview.bodyFallback`)}</div>
          <div className="space-y-1 border-t border-nexoraRule pt-4 text-xs font-medium leading-6 text-nexoraMuted"><h4 className="font-extrabold text-nexoraText">{t(`${TK}.preview.locationContact`)}</h4>{draft.visibility.showAddress ? <>{draft.address.trim() ? <p>{draft.address}</p> : null}{fullLocality ? <p>{fullLocality}</p> : null}</> : locationLabel ? <p>{locationLabel}</p> : null}{contactName || phone ? <p>{joinRecruitmentMeta([contactName, phone])}</p> : null}{draft.deadline ? <p>{t(`${TK}.preview.deadline`, { date: formatRecruitmentDate(draft.deadline, currentLanguage) })}</p> : null}{!draft.visibility.showPhone ? <p>{t(`${TK}.preview.chatHelper`)}</p> : null}</div>
        </> : null}

        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-center text-xs font-bold text-emerald-900">{contactAction}</div>
        {compact ? <p className="text-center text-[10px] font-medium text-nexoraSubtle">{t(`${TK}.preview.liveUpdate`)}</p> : null}
      </div>
    </article>
  )
}
