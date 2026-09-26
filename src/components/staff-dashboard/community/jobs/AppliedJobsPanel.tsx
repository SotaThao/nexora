import { MessagesSquare, RefreshCw } from 'lucide-react'

import { useTranslation } from '../../../../contexts/LanguageContext'
import { SkeletonList } from '../../../ui/skeleton'
import {
  formatRecruitmentDate,
  formatRecruitmentLocation,
  getPublicSalonLabel,
} from '../../../dashboard/views/pos/recruitment/recruitmentModel'
import type { JobApplication } from '../../../../types/communityJobs'
import type { PosJobPosting } from '../../../../types/posRecruitment'

const TK = 'staff_dashboard.community.jobs.applied'

interface AppliedJobsPanelProps {
  applications: JobApplication[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onChat: (posting: PosJobPosting) => void
}

export default function AppliedJobsPanel({ applications, isLoading, isError, onRetry, onChat }: AppliedJobsPanelProps) {
  const { t, currentLanguage } = useTranslation()

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-nexoraBorder bg-white p-5 shadow-sm">
        <SkeletonList count={3} lines={3} showAvatar />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-nexoraBorder bg-white px-4 py-12 text-center shadow-sm">
        <p className="font-bold text-nexoraText">{t(`${TK}.loadError`)}</p>
        <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft">
          <RefreshCw className="h-4 w-4" aria-hidden />{t(`${TK}.retry`)}
        </button>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-nexoraBorder bg-white px-4 py-12 text-center shadow-sm">
        <p className="font-black text-nexoraText">{t(`${TK}.emptyTitle`)}</p>
        <p className="text-xs font-medium text-nexoraMuted">{t(`${TK}.emptyDescription`)}</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-sm">
      {applications.map((application) => {
        const posting = application.posting
        const businessLabel = posting ? getPublicSalonLabel(posting, t) : t(`${TK}.postingUnavailable`)
        const location = posting ? formatRecruitmentLocation(posting.city, posting.state) : ''
        return (
          <article key={application.id} className="border-t border-nexoraRule px-4 py-5 first:border-t-0 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-black leading-snug text-nexoraText">{posting?.title ?? t(`${TK}.postingUnavailable`)}</h3>
                <p className="mt-1 text-xs font-medium text-nexoraMuted">{[businessLabel, location].filter(Boolean).join(' · ')}</p>
              </div>
              <span className="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                {t(`staff_dashboard.community.jobs.applicationStatus.${application.status}`)}
              </span>
            </div>
            <p className="mt-2 text-xs font-medium text-nexoraMuted">{t(`${TK}.appliedOn`, { date: formatRecruitmentDate(application.createdAt, currentLanguage) })}</p>
            {application.note ? <p className="mt-2 whitespace-pre-wrap text-xs font-medium leading-5 text-nexoraText">{application.note}</p> : null}
            {posting ? (
              <footer className="mt-3 flex justify-end border-t border-dashed border-nexoraRule pt-3">
                <button type="button" onClick={() => onChat(posting)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
                  <MessagesSquare className="h-4 w-4" aria-hidden />{t(`${TK}.messageAction`)}
                </button>
              </footer>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
