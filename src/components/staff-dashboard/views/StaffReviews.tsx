import { useState } from 'react'
import { Star } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffReviews } from '../../../data/hooks/useStaffSelf'
import type { StaffReviewItem } from '../../../types/domain'
import { SkeletonLayout, SkeletonList } from '../../ui/skeleton'
import Pagination from '../../ui/Pagination'
import { STAFF_REVIEWS_SKELETON } from '../skeletons/staffDashboardSkeletons'

const I18N_NS = 'components.staff_dashboard.views.StaffReviews'
const tk = (key: string) => `${I18N_NS}.${key}`

const PAGE_SIZE = 20
const STAR_VALUES = [1, 2, 3, 4, 5] as const
const RATING_LEVELS = [5, 4, 3, 2, 1] as const
const LOW_RATING_THRESHOLD = 2

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

const REVIEW_REPLY_FIELD_AVAILABLE = false

type ReviewFilter = 'all' | 'needsReply'
type RatingLevel = (typeof RATING_LEVELS)[number]
type StarCounts = Record<RatingLevel, number>

function formatReviewDate(iso: string | null | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ReviewCard({
  review,
  anonymousLabel,
  ratingOnlyLabel,
}: {
  review: StaffReviewItem
  anonymousLabel: string
  ratingOnlyLabel: string
}) {
  const customerLabel = review.customerName?.trim() || anonymousLabel
  const avatarInitial = customerLabel.charAt(0).toUpperCase()

  return (
    <div className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nexoraBrandSoft text-xs font-black text-nexoraBrand">
            {avatarInitial}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-nexoraText truncate">{customerLabel}</p>
            <div className="flex text-amber-400 mt-1">
              {STAR_VALUES.map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${star <= review.rating ? 'fill-current' : 'text-slate-200'}`}
                />
              ))}
            </div>
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-semibold text-nexoraSubtle">
          {formatReviewDate(review.createdAt)}
        </span>
      </div>

      {review.comment?.trim() ? (
        <p className="text-xs text-nexoraText leading-relaxed">{review.comment.trim()}</p>
      ) : (
        <p className="text-[10px] text-nexoraSubtle italic">{ratingOnlyLabel}</p>
      )}
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

  if (isPending && !reviewsPage) {
    return <SkeletonLayout blocks={STAFF_REVIEWS_SKELETON} />
  }

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

  const filterTabs: { id: ReviewFilter; labelKey: string }[] = [
    { id: 'all', labelKey: 'allReviews' },
    { id: 'needsReply', labelKey: 'needsReply' },
  ]

  return (
    <div className="space-y-3">
      <section className={panel}>
        <h3 className="text-base font-extrabold text-nexoraText mb-2">{t(tk('reviewsAndRatings'))}</h3>

        <div className="grid grid-cols-2 gap-4 md:gap-10 items-center">
          <div className="text-left md:border-r md:border-slate-100 md:pr-6">
            <p className="text-xs text-nexoraMuted font-bold tracking-wider">{t(tk('overallRating'))}</p>
            <div className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mt-1">
              {averageRating > 0 ? averageRating.toFixed(1) : '-.-'}
            </div>
            <div className="flex gap-0.5 mt-2 text-amber-400">
              {STAR_VALUES.map((star) => (
                <Star key={star} className={`h-4 w-4 ${star <= Math.round(averageRating) ? 'fill-current' : ''}`} />
              ))}
            </div>
            <p className="text-xs text-nexoraMuted mt-1">
              {t(tk('reviewCount'), { count: totalReviews })}
            </p>
          </div>

          <div className="space-y-2 w-full md:max-w-md">
            {RATING_LEVELS.map((star) => {
              const pct = totalReviews ? Math.round((starCounts[star] / totalReviews) * 100) : 0
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 font-bold text-nexoraMuted">{star}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        star <= LOW_RATING_THRESHOLD ? 'bg-nexoraDanger' : 'bg-nexoraBrand'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-nexoraSubtle font-bold">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="grid grid-cols-2 border-b border-nexoraBorder mb-4">
          {filterTabs.map(({ id, labelKey }) => {
            const isDisabled = id === 'needsReply' && !REVIEW_REPLY_FIELD_AVAILABLE
            const isActive = activeFilter === id

            return (
              <button
                key={id}
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && setActiveFilter(id)}
                title={isDisabled ? t(tk('needsReplyUnavailable')) : undefined}
                className={`pb-2 text-center text-sm font-semibold border-b-2 -mb-px transition-all ${
                  isDisabled
                    ? 'cursor-not-allowed border-transparent text-nexoraSubtle/50'
                    : isActive
                      ? 'border-nexoraBrand text-nexoraBrand'
                      : 'border-transparent text-nexoraMuted hover:text-nexoraText'
                }`}
              >
                {t(tk(labelKey))}
              </button>
            )
          })}
        </div>

        {isFetching ? (
          <SkeletonList count={4} lines={3} />
        ) : staffReviews.length === 0 ? (
          <p className="py-6 text-center text-xs text-nexoraSubtle">{t(tk('noReviewsReceivedYet'))}</p>
        ) : (
          <div className="space-y-3">
            {staffReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                anonymousLabel={t(tk('anonymousCustomer'))}
                ratingOnlyLabel={t(tk('ratingOnly'))}
              />
            ))}
          </div>
        )}

        <Pagination
          pageNumber={pageNumber}
          pageSize={PAGE_SIZE}
          totalPages={totalPages}
          hasNextPage={canGoNext}
          hasPreviousPage={canGoPrev}
          onPageChange={setPageNumber}
          isLoading={isFetching}
          variant="simple"
          className="mt-4"
        />
      </section>

    </div>
  )
}
