import { useEffect, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'

import { JobWorkType, RecruitmentSkill } from '../../../../constants/posRecruitment'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { SkeletonList } from '../../../ui/skeleton'
import type { HiringFeedFilters } from '../../../../types/communityJobs'
import type { PosJobPosting } from '../../../../types/posRecruitment'
import HiringPostCard from './HiringPostCard'

const TK = 'staff_dashboard.community.jobs'
const ENUM_TK = 'components.dashboard.views.pos.recruitment.enums'
const ALL_WORK_TYPES = 'all' as const
const ALL_SKILLS = 'all' as const
const fieldClass = 'min-h-11 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-medium text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft'

interface HiringFeedPanelProps {
  filters: HiringFeedFilters
  onFiltersChange: (next: HiringFeedFilters) => void
  postings: PosJobPosting[]
  isLoading: boolean
  isError: boolean
  appliedPostingIds: Set<string>
  onOpenDetail: (posting: PosJobPosting) => void
  onApply: (posting: PosJobPosting) => void
  onChat: (posting: PosJobPosting) => void
  onRetry: () => void
}

export default function HiringFeedPanel({
  filters,
  onFiltersChange,
  postings,
  isLoading,
  isError,
  appliedPostingIds,
  onOpenDetail,
  onApply,
  onChat,
  onRetry,
}: HiringFeedPanelProps) {
  const { t } = useTranslation()
  const [keywordDraft, setKeywordDraft] = useState(filters.keyword ?? '')

  useEffect(() => {
    setKeywordDraft(filters.keyword ?? '')
  }, [filters.keyword])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (keywordDraft !== (filters.keyword ?? '')) {
        onFiltersChange({ ...filters, keyword: keywordDraft.trim() || undefined })
      }
    }, 300)
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordDraft])

  const hasActiveFilters = Boolean(filters.keyword || filters.city || filters.state || filters.workType || filters.skill)

  return (
    <div className="overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-sm">
      <header className="space-y-4 border-b border-nexoraRule p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black text-nexoraText">{t(`${TK}.feed.title`)}</h2>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => { setKeywordDraft(''); onFiltersChange({}) }}
              className="min-h-11 rounded-lg px-2 text-xs font-bold text-nexoraBrand hover:underline"
            >
              {t(`${TK}.filters.clear`)}
            </button>
          ) : null}
        </div>

        {/*
          Mobile (<sm): grid-cols-2 with keyword spanning both columns puts keyword on its own
          full-width row, then city/state auto-place into row 2 and workType/skill into row 3 —
          3 compact rows instead of 5 stacked full-width fields pushing the feed below the fold.
          sm:+ is unchanged: keyword reverts to col-span-1 and the original 2/5-column desktop
          flow (via sm:grid-cols-2 / xl:grid-cols-5) still applies.
        */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="col-span-2 block text-xs font-bold text-nexoraText sm:col-span-1">
            <span className="sr-only">{t(`${TK}.filters.keywordLabel`)}</span>
            <span className="relative mt-1.5 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraSubtle" aria-hidden />
              <input
                type="search"
                value={keywordDraft}
                onChange={(event) => setKeywordDraft(event.target.value)}
                placeholder={t(`${TK}.filters.keywordPlaceholder`)}
                className={`${fieldClass} pl-9`}
              />
            </span>
          </label>
          <label className="block text-xs font-bold text-nexoraText">
            <span className="sr-only">{t(`${TK}.filters.cityLabel`)}</span>
            <input
              type="text"
              value={filters.city ?? ''}
              onChange={(event) => onFiltersChange({ ...filters, city: event.target.value || undefined })}
              placeholder={t(`${TK}.filters.cityPlaceholder`)}
              className={`${fieldClass} mt-1.5`}
            />
          </label>
          <label className="block text-xs font-bold text-nexoraText">
            <span className="sr-only">{t(`${TK}.filters.stateLabel`)}</span>
            <input
              type="text"
              value={filters.state ?? ''}
              onChange={(event) => onFiltersChange({ ...filters, state: event.target.value || undefined })}
              placeholder={t(`${TK}.filters.statePlaceholder`)}
              className={`${fieldClass} mt-1.5`}
            />
          </label>
          <label className="block text-xs font-bold text-nexoraText">
            <span className="sr-only">{t(`${TK}.filters.workTypeLabel`)}</span>
            <select
              value={filters.workType ?? ALL_WORK_TYPES}
              onChange={(event) => onFiltersChange({
                ...filters,
                workType: event.target.value === ALL_WORK_TYPES ? undefined : event.target.value as JobWorkType,
              })}
              className={`${fieldClass} mt-1.5 bg-white`}
            >
              <option value={ALL_WORK_TYPES}>{t(`${TK}.filters.workTypeAll`)}</option>
              {Object.values(JobWorkType).map((workType) => (
                <option key={workType} value={workType}>{t(`${ENUM_TK}.workType.${workType}`)}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-nexoraText">
            <span className="sr-only">{t(`${TK}.filters.skillLabel`)}</span>
            <select
              value={filters.skill ?? ALL_SKILLS}
              onChange={(event) => onFiltersChange({
                ...filters,
                skill: event.target.value === ALL_SKILLS ? undefined : event.target.value as RecruitmentSkill,
              })}
              className={`${fieldClass} mt-1.5 bg-white`}
            >
              <option value={ALL_SKILLS}>{t(`${TK}.filters.skillAll`)}</option>
              {Object.values(RecruitmentSkill).map((skill) => (
                <option key={skill} value={skill}>{t(`${ENUM_TK}.skill.${skill}`)}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {isLoading ? (
        <div className="p-5"><SkeletonList count={3} lines={3} showAvatar /></div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <p className="font-bold text-nexoraText">{t(`${TK}.feed.loadError`)}</p>
          <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft">
            <RefreshCw className="h-4 w-4" aria-hidden />{t(`${TK}.feed.retry`)}
          </button>
        </div>
      ) : postings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <Search className="h-8 w-8 text-nexoraSubtle" aria-hidden />
          <div>
            <p className="font-black text-nexoraText">{t(`${TK}.feed.emptyTitle`)}</p>
            <p className="mt-1 text-xs font-medium text-nexoraMuted">{t(`${TK}.feed.emptyDescription`)}</p>
          </div>
        </div>
      ) : (
        <div>
          {postings.map((posting) => (
            <HiringPostCard
              key={posting.id}
              posting={posting}
              alreadyApplied={appliedPostingIds.has(posting.id)}
              onOpenDetail={onOpenDetail}
              onApply={onApply}
              onChat={onChat}
            />
          ))}
        </div>
      )}
    </div>
  )
}
