import { useState } from 'react'

import { ArrowUpRight, RefreshCw, Search } from 'lucide-react'

import { JobPostingStatus } from '../../../../../constants/posRecruitment'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { SkeletonList } from '../../../../ui/skeleton'
import type { PosJobPosting } from '../../../../../types/posRecruitment'
import JobPostingCard from './JobPostingCard'
import { joinRecruitmentMeta, postingMatchesSearch } from './recruitmentModel'

const TK = 'components.dashboard.views.pos.recruitment.list'
export const ALL_JOB_POSTINGS = 'all' as const
export type PostingFilter = typeof ALL_JOB_POSTINGS | JobPostingStatus

interface RecruitmentListPanelProps {
  postings: PosJobPosting[]
  isLoading: boolean
  isError: boolean
  businessName: string
  city: string
  filter: PostingFilter
  onFilterChange: (filter: PostingFilter) => void
  onPreview: (posting: PosJobPosting) => void
  onEdit: (posting: PosJobPosting) => void
  onClose: (posting: PosJobPosting) => void
  onCreate: () => void
  createDisabled?: boolean
  createDisabledLabel?: string
  onRetry: () => void
}

const FILTERS: PostingFilter[] = [
  ALL_JOB_POSTINGS,
  JobPostingStatus.Published,
  JobPostingStatus.Draft,
  JobPostingStatus.Pending,
  JobPostingStatus.Closed,
]

export default function RecruitmentListPanel({
  postings,
  isLoading,
  isError,
  businessName,
  city,
  filter,
  onFilterChange,
  onPreview,
  onEdit,
  onClose,
  onCreate,
  createDisabled = false,
  createDisabledLabel,
  onRetry,
}: RecruitmentListPanelProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const filtered = postings.filter((posting) => {
    const statusMatches = filter === ALL_JOB_POSTINGS || posting.status === filter
    return statusMatches && postingMatchesSearch(posting, search)
  })

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-xl border border-nexoraLavender bg-gradient-to-r from-nexoraBrandSoft to-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-nexoraBrand shadow-sm">
            <ArrowUpRight className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-black text-nexoraText">{t(`${TK}.bridgeTitle`)}</h2>
            <p className="mt-1 text-xs font-medium text-nexoraMuted">{t(`${TK}.bridgeDescription`)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 border-t border-nexoraLavender pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <img src="/assets/images/ecosystem/nailhub.png" width="64" height="28" alt="NailHub" className="h-7 w-auto object-contain" />
          <div><strong className="block text-xs text-emerald-950">NailHub</strong><span className="mt-0.5 block text-[10px] font-semibold text-emerald-800">{t(`${TK}.postingChannel`)}</span></div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_250px]">
        <section className="overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-sm">
          <header className="space-y-4 border-b border-nexoraRule p-4 sm:p-5">
            <div>
                <h2 className="text-lg font-black text-nexoraText">{t(`${TK}.title`)}</h2>
                <p className="mt-1 text-xs font-medium text-nexoraMuted">{joinRecruitmentMeta([businessName, city])}</p>
            </div>

            <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div role="tablist" aria-label={t(`${TK}.filterAriaLabel`)} className="flex min-w-0 gap-1 overflow-x-auto pb-1 lg:flex-1">
                {FILTERS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    role="tab"
                    aria-selected={filter === status}
                    onClick={() => onFilterChange(status)}
                    className={`min-h-11 shrink-0 rounded-lg px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand ${
                      filter === status
                        ? 'bg-nexoraBrandSoft text-nexoraBrand'
                        : 'text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraText'
                    }`}
                  >
                    {status === ALL_JOB_POSTINGS
                      ? t(`${TK}.filters.all`)
                      : status === JobPostingStatus.Draft
                        ? t(`${TK}.filters.draft`)
                        : t(`components.dashboard.views.pos.recruitment.enums.status.${status}`)}
                  </button>
                ))}
              </div>

              <label className="relative block w-full lg:w-72 lg:shrink-0 xl:w-80">
                <span className="sr-only">{t(`${TK}.searchLabel`)}</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraSubtle" aria-hidden />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t(`${TK}.searchPlaceholder`)}
                  className="min-h-11 w-full rounded-lg border border-nexoraBorder bg-white pl-9 pr-3 text-sm font-medium text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft"
                />
              </label>
            </div>
          </header>

          {isLoading ? (
            <div className="p-5"><SkeletonList count={2} lines={3} showAvatar /></div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <p className="font-bold text-nexoraText">{t(`${TK}.loadError`)}</p>
              <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft">
                <RefreshCw className="h-4 w-4" aria-hidden />{t(`${TK}.retry`)}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <Search className="h-8 w-8 text-nexoraSubtle" aria-hidden />
              <div>
                <p className="font-black text-nexoraText">{t(`${TK}.emptyTitle`)}</p>
                <p className="mt-1 text-xs font-medium text-nexoraMuted">{t(`${TK}.emptyDescription`)}</p>
              </div>
              <button
                type="button"
                onClick={() => { setSearch(''); onFilterChange(ALL_JOB_POSTINGS) }}
                className="min-h-11 rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand"
              >
                {t(`${TK}.showAll`)}
              </button>
            </div>
          ) : (
            <div>{filtered.map((posting) => <JobPostingCard key={posting.id} posting={posting} onPreview={onPreview} onEdit={onEdit} onClose={onClose} />)}</div>
          )}
        </section>

        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <section className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm">
            <h3 className="font-black text-nexoraText">{t(`${TK}.connectionTitle`)}</h3>
            <div className="mt-4 space-y-3 text-xs font-medium text-nexoraMuted">
              <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-lg bg-nexoraBrandSoft font-black text-nexoraBrand">N</span><div><strong className="block text-nexoraText">Nexora POS</strong><span className="mt-0.5 block text-[11px]">{t(`${TK}.nexoraDescription`)}</span></div></div>
              <div className="pl-4 text-nexoraSubtle">↓</div>
              <div className="flex items-center gap-2"><img src="/assets/images/ecosystem/nailhub.png" width="42" height="24" alt="NailHub" className="h-7 w-auto" /><div><strong className="block text-nexoraText">NailHub</strong><span className="mt-0.5 block text-[11px]">{t(`${TK}.nailhubDescription`)}</span></div></div>
            </div>
            <p className="mt-4 border-t border-nexoraRule pt-4 text-xs font-medium leading-5 text-nexoraMuted">{t(`${TK}.connectionDescription`)}</p>
          </section>
          <section className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm">
            <h3 className="font-black text-nexoraText">{t(`${TK}.ownerStepsTitle`)}</h3>
            <ol className="mt-4 space-y-4">
              {[1, 2, 3].map((step) => (
                <li key={step} className="flex gap-3 text-xs">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-nexoraLavender text-[10px] font-bold text-nexoraBrand">{step}</span>
                  <div><p className="font-bold text-nexoraText">{t(`${TK}.ownerStep${step}Title`)}</p><p className="mt-1 font-medium leading-5 text-nexoraMuted">{t(`${TK}.ownerStep${step}Description`)}</p></div>
                </li>
              ))}
            </ol>
            <button type="button" disabled={createDisabled} aria-disabled={createDisabled} title={createDisabled ? createDisabledLabel : undefined} onClick={onCreate} className="mt-4 min-h-11 rounded-lg px-1 text-left text-xs font-bold text-nexoraBrand hover:underline disabled:cursor-not-allowed disabled:opacity-50">{t(`${TK}.ownerHint`)}</button>
          </section>
        </aside>
      </div>
    </div>
  )
}
