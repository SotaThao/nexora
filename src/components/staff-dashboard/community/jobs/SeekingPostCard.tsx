import { Briefcase, MapPin, Pencil } from 'lucide-react'

import { JobPostingStatus } from '../../../../constants/posRecruitment'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  formatRecruitmentDate,
  formatRecruitmentLocation,
  getRecruitmentPayLabel,
} from '../../../dashboard/views/pos/recruitment/recruitmentModel'
import type { SeekingPost } from '../../../../types/communityJobs'
import { SEEKING_STATUS_LABEL_KEY } from './staffJobsModel'

const TK = 'staff_dashboard.community.jobs.myPosts'
const ENUM_TK = 'components.dashboard.views.pos.recruitment.enums'

const STATUS_CLASS: Record<JobPostingStatus, string> = {
  [JobPostingStatus.Draft]: 'bg-slate-100 text-slate-600',
  [JobPostingStatus.Pending]: 'bg-amber-50 text-amber-700',
  [JobPostingStatus.Published]: 'bg-emerald-50 text-emerald-700',
  [JobPostingStatus.Closed]: 'bg-slate-100 text-slate-500',
  [JobPostingStatus.Filled]: 'bg-slate-100 text-slate-500',
}

interface SeekingPostCardProps {
  post: SeekingPost
  onEdit: (post: SeekingPost) => void
  onClose: (post: SeekingPost) => void
}

export default function SeekingPostCard({ post, onEdit, onClose }: SeekingPostCardProps) {
  const { t, currentLanguage } = useTranslation()
  const created = formatRecruitmentDate(post.createdAt, currentLanguage)
  const location = formatRecruitmentLocation(post.city, post.state)
  const pay = getRecruitmentPayLabel(post, t)

  return (
    <article className="border-t border-nexoraRule px-4 py-5 first:border-t-0 sm:px-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-nexoraBrandSoft text-nexoraBrand">
          <Pencil className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-black leading-snug text-nexoraText">{post.title}</h3>
              <p className="mt-1 text-[11px] font-medium text-nexoraMuted">{post.code} · {created}</p>
            </div>
            <span className={`w-fit shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${STATUS_CLASS[post.status]}`}>
              {t(SEEKING_STATUS_LABEL_KEY[post.status])}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-nexoraMuted">
            {location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{location}</span> : null}
            {post.workTypes.map((workType) => (
              <span key={workType} className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" aria-hidden />{t(`${ENUM_TK}.workType.${workType}`)}</span>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {post.skills.map((skill) => (
              <span key={skill} className="rounded-md border border-nexoraBorder bg-nexoraSurfaceMuted px-2 py-1 text-[10px] font-semibold text-nexoraMuted">{t(`${ENUM_TK}.skill.${skill}`)}</span>
            ))}
            <span className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">{pay}</span>
          </div>
        </div>
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-end gap-1 border-t border-dashed border-nexoraRule pt-3 text-xs">
        <button type="button" onClick={() => onEdit(post)} className="min-h-11 rounded-lg px-3 font-bold text-nexoraBrand hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
          {post.status === JobPostingStatus.Draft ? `${t(`${TK}.continueDraft`)} →` : t(`${TK}.edit`)}
        </button>
        {post.status !== JobPostingStatus.Draft && post.status !== JobPostingStatus.Closed ? (
          <button type="button" onClick={() => onClose(post)} className="min-h-11 rounded-lg px-3 font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
            {t(`${TK}.closeAction`)}
          </button>
        ) : null}
      </footer>
    </article>
  )
}
