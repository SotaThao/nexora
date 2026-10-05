import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { RefreshCw, Search } from 'lucide-react'

import { useTranslation } from '../../../../contexts/LanguageContext'
import { SkeletonList } from '../../../ui/skeleton'
import type { HiringFeedFilters, JobsBrowseKind, SeekingPost } from '../../../../types/communityJobs'
import type { PosJobPosting } from '../../../../types/posRecruitment'
import BrowseAreaSelect from './BrowseAreaSelect'
import HiringPostCard from './HiringPostCard'
import SeekingPostCard from './SeekingPostCard'
import { buildBrowseFeedItems } from './staffJobsModel'

const TK = 'staff_dashboard.community.jobs'
const ALL_AREAS = 'all' as const
const KIND_OPTIONS: JobsBrowseKind[] = ['all', 'seeking', 'hiring']
const KIND_LABEL_KEY: Record<JobsBrowseKind, string> = {
  all: `${TK}.filters.kindAll`,
  seeking: `${TK}.filters.kindSeeking`,
  hiring: `${TK}.filters.kindHiring`,
}
const fieldClass = 'min-h-11 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-medium text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft'
const feedGridClass = 'grid grid-cols-1 gap-4 p-4 sm:grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] sm:p-5 md:gap-5'

interface HiringFeedPanelProps {
  filters: HiringFeedFilters
  onFiltersChange: (next: HiringFeedFilters) => void
  kind: JobsBrowseKind
  onKindChange: (next: JobsBrowseKind) => void
  postings: PosJobPosting[]
  seekingPosts: SeekingPost[]
  /** Distinct cities from the UNFILTERED feeds, so the area select never shrinks as filters apply. */
  areaCities: string[]
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
  kind,
  onKindChange,
  postings,
  seekingPosts,
  areaCities,
  isLoading,
  isError,
  appliedPostingIds,
  onOpenDetail,
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

  const items = useMemo(
    () => buildBrowseFeedItems(kind, postings, seekingPosts),
    [kind, postings, seekingPosts],
  )

  // Keep the selected city selectable even if the unfiltered feed no longer lists it.
  const cityOptions = useMemo(() => {
    const selected = filters.city?.trim()
    if (!selected || areaCities.some((city) => city.toLowerCase() === selected.toLowerCase())) return areaCities
    return [...areaCities, selected]
  }, [areaCities, filters.city])
  const areaOptions = [
    { value: ALL_AREAS, label: t(`${TK}.filters.areaAll`) },
    ...cityOptions.map((city) => ({ value: city, label: city })),
  ]
  const selectedCity = filters.city
    ? cityOptions.find((city) => city.toLowerCase() === filters.city?.trim().toLowerCase()) ?? ALL_AREAS
    : ALL_AREAS

  const hasActiveFilters = Boolean(
    filters.keyword || filters.city || filters.state || filters.workType || filters.skill || kind !== 'all',
  )

  const handleKindKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1
        : 0
    if (!step) return
    event.preventDefault()
    const next = KIND_OPTIONS[(index + step + KIND_OPTIONS.length) % KIND_OPTIONS.length]
    onKindChange(next)
    const radios = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    radios?.[KIND_OPTIONS.indexOf(next)]?.focus()
  }

  return (
    <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm">
      <header className="space-y-4 border-b border-nexoraRule p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[auto_200px_1fr] xl:items-center">
          <div
            role="radiogroup"
            aria-label={t(`${TK}.filters.kindLabel`)}
            className="flex flex-wrap gap-2"
          >
            {KIND_OPTIONS.map((option, index) => {
              const active = kind === option
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => onKindChange(option)}
                  onKeyDown={(event) => handleKindKeyDown(event, index)}
                  className={`min-h-11 rounded-full border px-4 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2 ${
                    active
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand hover:bg-nexoraBrandSoft'
                  }`}
                >
                  {t(KIND_LABEL_KEY[option])}
                </button>
              )
            })}
          </div>

          <BrowseAreaSelect
            label={t(`${TK}.filters.areaLabel`)}
            value={selectedCity}
            options={areaOptions}
            onChange={(next) => onFiltersChange({
              ...filters,
              city: next === ALL_AREAS ? undefined : next,
              state: undefined,
            })}
          />

          <label className="block text-xs font-bold text-nexoraText">
            <span className="sr-only">{t(`${TK}.filters.keywordLabel`)}</span>
            <span className="relative block">
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
        </div>

        <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
          {!isLoading && !isError ? (
            <p className="text-xs font-semibold text-nexoraMuted" role="status" aria-live="polite">
              {t(`${TK}.feed.resultCount`, { count: items.length })}
            </p>
          ) : <span />}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => { setKeywordDraft(''); onFiltersChange({}); onKindChange('all') }}
              className="min-h-11 rounded-lg px-2 text-xs font-bold text-nexoraBrand hover:underline"
            >
              {t(`${TK}.filters.clear`)}
            </button>
          ) : null}
        </div>
      </header>

      {isLoading ? (
        <div className={feedGridClass}>
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-full rounded-xl border border-nexoraBorder bg-white p-4 shadow-nexora-card">
              <SkeletonList count={1} lines={3} showAvatar />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <p className="font-bold text-nexoraText">{t(`${TK}.feed.loadError`)}</p>
          <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft">
            <RefreshCw className="h-4 w-4" aria-hidden />{t(`${TK}.feed.retry`)}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <Search className="h-8 w-8 text-nexoraSubtle" aria-hidden />
          <div>
            <p className="font-black text-nexoraText">{t(`${TK}.feed.emptyTitle`)}</p>
            <p className="mt-1 text-xs font-medium text-nexoraMuted">{t(`${TK}.feed.emptyDescription`)}</p>
          </div>
        </div>
      ) : (
        <div className={feedGridClass}>
          {items.map((item) => (
            item.kind === 'hiring' ? (
              <HiringPostCard
                key={item.key}
                posting={item.posting}
                alreadyApplied={appliedPostingIds.has(item.posting.id)}
                onOpenDetail={onOpenDetail}
              />
            ) : (
              <SeekingPostCard key={item.key} post={item.post} variant="feed" />
            )
          ))}
        </div>
      )}
    </div>
  )
}
