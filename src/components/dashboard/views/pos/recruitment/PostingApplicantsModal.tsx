import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MessagesSquare, Phone, UserRound, X } from 'lucide-react'

import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { PostingApplicant } from '../../../../../types/communityJobs'
import type { PosJobPosting } from '../../../../../types/posRecruitment'
import { useCommunityJobsDemo } from '../../../../community/jobs/CommunityJobsDemoContext'
import { TechnicianProfileCard } from '../../../../community/jobs/TechnicianProfileSummary'
import { useCommunityJobsModalFocusTrap } from '../../../../staff-dashboard/community/jobs/useCommunityJobsModalFocusTrap'
import { SkeletonList } from '../../../../ui/skeleton'
import { formatRecruitmentDate } from './recruitmentModel'

const TK = 'components.dashboard.views.pos.recruitment.list'

interface PostingApplicantsModalProps {
  posting: PosJobPosting
  applicants: PostingApplicant[]
  isLoading: boolean
  onClose: () => void
}

export default function PostingApplicantsModal({ posting, applicants, isLoading, onClose }: PostingApplicantsModalProps) {
  const { t, currentLanguage } = useTranslation()
  const { openInbox } = useCommunityJobsDemo()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  useCommunityJobsModalFocusTrap(true, dialogRef, onClose)

  return createPortal(
    <div className="community-jobs-theme fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="posting-applicants-title"
        className="nexora-modal-card flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-nexoraRule px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id="posting-applicants-title" className="text-base font-black text-nexoraText">{t(`${TK}.applicantsTitle`)}</h2>
            <p className="mt-0.5 truncate text-xs font-medium text-nexoraMuted">{posting.title}</p>
          </div>
          <button type="button" aria-label={t(`${TK}.applicantsClose`)} onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-nexoraMuted hover:bg-nexoraSurfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-5"><SkeletonList count={2} lines={2} showAvatar /></div>
          ) : applicants.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm font-medium text-nexoraMuted">{t(`${TK}.applicantsEmpty`)}</p>
          ) : applicants.map((applicant) => (
            <article key={applicant.applicationId} className="border-t border-nexoraRule px-4 py-4 first:border-t-0 sm:px-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-nexoraBrandSoft text-sm font-black text-nexoraBrand" aria-hidden>
                  {applicant.applicantName.trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black leading-snug text-nexoraText">{applicant.applicantName}</h3>
                  <p className="mt-0.5 text-[11px] font-medium text-nexoraMuted">{t(`${TK}.applicantAppliedOn`, { date: formatRecruitmentDate(applicant.createdAt, currentLanguage) })}</p>
                </div>
                <div className="-mt-3 flex shrink-0 items-center gap-0.5">
                  <button type="button" aria-expanded={expandedId === applicant.applicationId} onClick={() => setExpandedId((current) => current === applicant.applicationId ? null : applicant.applicationId)} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-2 text-xs sm:gap-1.5 sm:px-3 font-bold text-nexoraBrand hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
                    <UserRound className="h-4 w-4" aria-hidden /><span>{t(`${TK}.${expandedId === applicant.applicationId ? 'hideProfile' : 'viewProfile'}`)}</span>
                  </button>
                  <button type="button" onClick={() => { onClose(); openInbox() }} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg px-2 text-xs sm:gap-1.5 sm:px-3 font-bold text-nexoraBrand hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
                    <MessagesSquare className="h-4 w-4" aria-hidden /><span>{t(`${TK}.applicantMessage`)}</span>
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <p className="whitespace-pre-wrap text-xs font-medium leading-5 text-nexoraText">{applicant.note || t(`${TK}.applicantNoNote`)}</p>
                {applicant.phone ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-nexoraBrand"><Phone className="h-3.5 w-3.5" aria-hidden />{applicant.phone}</p>
                ) : null}
              </div>
              {expandedId === applicant.applicationId ? (
                applicant.profile ? <div className="mt-3"><TechnicianProfileCard profile={applicant.profile} showDetails /></div> : <p className="mt-3 text-xs font-medium text-nexoraMuted">{t(`${TK}.applicantNoProfile`)}</p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
