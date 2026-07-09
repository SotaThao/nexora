import { useState } from 'react'
import { Star } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffReviews } from '../../../data/hooks/useStaffSelf'
import type { TranslationVariables } from '../../../types/contexts'
import type { StaffReviewItem } from '../../../types/domain'
import { SkeletonLayout, SkeletonList } from '../../ui/skeleton'
import Pagination from '../../ui/Pagination'
import { STAFF_REVIEWS_SKELETON } from '../skeletons/staffDashboardSkeletons'

const PAGE_SIZE = 20
const STAR_VALUES = [1, 2, 3, 4, 5] as const
const RATING_LEVELS = [5, 4, 3, 2, 1] as const
const LOW_RATING_THRESHOLD = 2

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

const REVIEW_REPLY_FIELD_AVAILABLE = false

type ReviewFilter = 'all' | 'needsReply'
type RatingLevel = (typeof RATING_LEVELS)[number]
type StarCounts = Record<RatingLevel, number>

function formatRelativeReviewDate(
  iso: string | null | undefined,
  t: (key: string, variables?: TranslationVariables) => string,
) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) {
    return t('components.staff_dashboard.views.StaffReviews.relativeToday')
  }
  if (diffDays === 1) {
    return t('components.staff_dashboard.views.StaffReviews.relativeDay')
  }
  if (diffDays < 7) {
    return t('components.staff_dashboard.views.StaffReviews.relativeDays', { count: diffDays })
  }
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks === 1) {
    return t('components.staff_dashboard.views.StaffReviews.relativeWeek')
  }
  if (diffWeeks < 5) {
    return t('components.staff_dashboard.views.StaffReviews.relativeWeeks', { count: diffWeeks })
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function toInitial(name: string) {
  const normalized = name.trim()
  if (!normalized) return '?'
  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
  }
  return normalized.slice(0, 2).toUpperCase()
}

function ReviewStarRow({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)))

  return (
    <div className="mt-1 flex gap-0.5 text-amber-400" aria-label={`${rating} stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= filled ? 'fill-current' : 'text-slate-200'}`}
        />
      ))}
    </div>
  )
}

function ReviewCard({
  review,
  anonymousLabel,
  ratingOnlyLabel,
  t,
}: {
  review: StaffReviewItem
  anonymousLabel: string
  ratingOnlyLabel: string
  t: (key: string, variables?: TranslationVariables) => string
}) {
  const customerLabel = review.customerName?.trim() || anonymousLabel
  const avatarInitial = customerLabel.charAt(0).toUpperCase()

  return (
    <article className="rounded-2xl border border-[#E8EBF5] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-black uppercase text-indigo-700">
          {toInitial(customerLabel)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-bold text-[#1E293B]">{customerLabel}</p>
            <span className="shrink-0 text-xs font-medium text-slate-400">
              {formatRelativeReviewDate(review.createdAt, t)}
            </span>
          </div>
          {review.rating > 0 ? <ReviewStarRow rating={review.rating} /> : null}
          {review.comment?.trim() ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.comment.trim()}</p>
          ) : (
            <p className="mt-2 text-xs italic text-slate-400">{ratingOnlyLabel}</p>
          )}
        </div>
      </div>
    </article>
  )
}

function RatingDistributionRow({
  star,
  count,
  totalReviews,
}: {
  star: number
  count: number
  totalReviews: number
}) {
  const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
  const barClass = star === 2 ? 'bg-red-500' : 'bg-indigo-600'

  return (
    <div className="flex items-center gap-3">
      <span className="w-3 shrink-0 text-right text-sm font-semibold text-slate-500">{star}</span>
      <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#EEF0FA]">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-sm font-semibold text-slate-500">{pct}%</span>
    </div>
  )
}

export default function StaffReviews() {
  const { t } = useTranslation()
  const [pageNumber, setPageNumber] = useState(1)
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>('all')
  const {
    data: reviewsPage = null,
    isPending,
    isFetching,
  } = useStaffReviews({ pageNumber, pageSize: PAGE_SIZE })

  const summary = reviewsPage?.summary
  const staffReviews = reviewsPage?.items ?? []
  const averageRating = summary?.averageRating ?? 0
  const totalReviews = summary?.totalReviews ?? 0
  const distribution = summary?.distribution

  const starCounts: StarCounts = {
    5: distribution?.star5 ?? 0,
    4: distribution?.star4 ?? 0,
    3: distribution?.star3 ?? 0,
    2: distribution?.star2 ?? 0,
    1: distribution?.star1 ?? 0,
  }

  const totalPages = reviewsPage?.totalPages ?? 0
  const canGoPrev = pageNumber > 1
  const canGoNext = totalPages > 0 && pageNumber < totalPages
  const filledStars = averageRating > 0 ? Math.round(averageRating) : 0

  if (isPending && !reviewsPage) {
    return <SkeletonLayout blocks={STAFF_REVIEWS_SKELETON} />
  }

  const filterTabs: { id: ReviewFilter; labelKey: string }[] = [
    { id: 'all', labelKey: 'allReviews' },
    { id: 'needsReply', labelKey: 'needsReply' },
  ]

  // "Needs Reply" is disabled while REVIEW_REPLY_FIELD_AVAILABLE is false (see
  // that flag's definition), so this branch can't be reached from the UI yet.
  // If the flag is ever flipped on before real filtering is wired up, show an
  // empty list rather than silently rendering every review as "unanswered".
  const visibleReviews =
    activeFilter === 'needsReply' && !REVIEW_REPLY_FIELD_AVAILABLE ? [] : staffReviews

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold tracking-tight text-[#1E293B]">
          {t('staff_dashboard.nav.my_reviews')}
        </h2>
      </div>

      <section className="rounded-2xl border border-[#DCE3F7] bg-[#FCFCFF] p-4 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-[132px] shrink-0">
            <p className="text-sm font-semibold text-slate-500">
              {t('components.staff_dashboard.views.StaffReviews.overallRating')}
            </p>
            <p className="mt-1 text-[44px] font-black leading-none tracking-tight text-[#1E293B]">
              {averageRating > 0 ? averageRating.toFixed(1) : '-.-'}
            </p>
            <div className="mt-2 flex gap-0.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i <= filledStars ? 'fill-current' : 'text-slate-200'}`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              {t('components.staff_dashboard.views.StaffReviews.reviewsCount', { count: totalReviews })}
            </p>
          </div>

          <div className="min-w-0 flex-1 space-y-2.5">
            {[5, 4, 3, 2, 1].map((star) => (
              <RatingDistributionRow
                key={star}
                star={star}
                count={starCounts[star]}
                totalReviews={totalReviews}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="border-b border-[#E8EBF5]">
        <div className="flex gap-8">
          <button
            type="button"
            className="-mb-px border-b-2 border-indigo-600 pb-3 text-sm font-bold text-indigo-600"
          >
            {t('components.staff_dashboard.views.StaffReviews.allReviews')}
          </button>
          <button
            type="button"
            disabled
            className="-mb-px border-b-2 border-transparent pb-3 text-sm font-bold text-slate-400"
          >
            {t('components.staff_dashboard.views.StaffReviews.needsReply')}
          </button>
        </div>
      </div>

      {isFetching ? (
        <SkeletonList count={4} lines={3} />
      ) : staffReviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          {t('components.staff_dashboard.views.StaffReviews.noReviewsReceivedYet')}
        </p>
      ) : (
        <div className="space-y-3">
          {staffReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              anonymousLabel={t('components.staff_dashboard.views.StaffReviews.anonymousCustomer')}
              ratingOnlyLabel={t('components.staff_dashboard.views.StaffReviews.ratingOnly')}
              t={t}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination
          pageNumber={pageNumber}
          pageSize={PAGE_SIZE}
          totalPages={totalPages}
          hasNextPage={canGoNext}
          hasPreviousPage={canGoPrev}
          onPageChange={setPageNumber}
          isLoading={isFetching}
          variant="simple"
        />
      ) : null}
    </div>
  )
}
