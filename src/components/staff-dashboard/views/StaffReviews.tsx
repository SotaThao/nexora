import { useState } from 'react'
import { Star, Lock, HelpCircle, MessageSquare } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffReviews } from '../../../data/hooks/useStaffSelf'
import type { StaffReviewItem } from '../../../types/domain'
import { SkeletonLayout } from '../../ui/skeleton'
import { STAFF_REVIEWS_SKELETON } from '../skeletons/staffDashboardSkeletons'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-5 shadow-sm'
const PAGE_SIZE = 20

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

  return (
    <div className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-nexoraText truncate">{customerLabel}</p>
          {review.businessName ? (
            <p className="text-[10px] text-nexoraMuted mt-0.5 truncate">{review.businessName}</p>
          ) : null}
        </div>
        <span className="shrink-0 text-[10px] font-semibold text-nexoraSubtle">
          {formatReviewDate(review.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex text-amber-400">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-3.5 w-3.5 ${star <= review.rating ? 'fill-current' : 'text-slate-200'}`}
            />
          ))}
        </div>
        <span className="text-[10px] font-black text-nexoraText">{review.rating.toFixed(1)}</span>
      </div>

      {review.comment?.trim() ? (
        <p className="text-xs text-nexoraMuted italic bg-nexoraCanvas p-2.5 rounded-lg border border-nexoraBorder/60 leading-relaxed">
          &ldquo;{review.comment.trim()}&rdquo;
        </p>
      ) : (
        <p className="text-[10px] text-nexoraSubtle italic">{ratingOnlyLabel}</p>
      )}
    </div>
  )
}

export default function StaffReviews() {
  const { t } = useTranslation()
  const [pageNumber, setPageNumber] = useState(1)
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

  const starCounts = {
    5: distribution?.star5 ?? 0,
    4: distribution?.star4 ?? 0,
    3: distribution?.star3 ?? 0,
    2: distribution?.star2 ?? 0,
    1: distribution?.star1 ?? 0,
  }

  const totalPages = reviewsPage?.totalPages ?? 0
  const canGoPrev = pageNumber > 1
  const canGoNext = totalPages > 0 && pageNumber < totalPages

  return (
    <div className="space-y-4">
      <section className={panel}>
        <h3 className="text-base font-extrabold text-nexoraText mb-4">
          {t('components.staff_dashboard.views.StaffReviews.reviewsAndRatings')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="text-center md:border-r border-slate-100 py-2">
            <div className="text-5xl font-black text-slate-800 tracking-tight">
              {averageRating > 0 ? averageRating.toFixed(1) : '-.-'}
            </div>
            <div className="flex justify-center gap-0.5 mt-2 text-amber-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`h-4 w-4 ${i <= Math.round(averageRating) ? 'fill-current' : ''}`} />
              ))}
            </div>
            <p className="text-xs text-nexoraMuted mt-1 font-bold uppercase tracking-wider">
              {t('components.staff_dashboard.views.StaffReviews.averageRating')}
            </p>
          </div>

          <div className="text-center md:border-r border-slate-100 py-2">
            <div className="text-5xl font-black text-slate-800 tracking-tight">{totalReviews}</div>
            <p className="text-xs text-nexoraMuted mt-1 font-bold uppercase tracking-wider">
              {t('components.staff_dashboard.views.StaffReviews.totalReviews')}
            </p>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 font-bold text-nexoraMuted">{star}</span>
                <Star className="h-3 w-3 text-amber-400 fill-current" />
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: totalReviews ? `${(starCounts[star] / totalReviews) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-6 text-right text-nexoraSubtle font-bold">{starCounts[star]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={panel}>
        <h3 className="text-base font-extrabold text-nexoraText mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-nexoraBrand" />
          {t('components.staff_dashboard.views.StaffReviews.customerReviews')}
        </h3>

        {isFetching && !isPending ? (
          <p className="mb-3 text-[10px] font-semibold text-nexoraSubtle uppercase tracking-wider">
            {t('common.loading')}
          </p>
        ) : null}

        {staffReviews.length === 0 ? (
          <p className="py-6 text-center text-xs text-nexoraSubtle">
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
              />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-nexoraBorder pt-4">
            <button
              type="button"
              disabled={!canGoPrev || isFetching}
              onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
              className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-nexoraMuted transition hover:bg-nexoraCanvas disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.back')}
            </button>
            <span className="text-[10px] font-semibold text-nexoraSubtle">
              {t('components.staff_dashboard.views.StaffReviews.pageOf', {
                page: pageNumber,
                total: totalPages,
              })}
            </span>
            <button
              type="button"
              disabled={!canGoNext || isFetching}
              onClick={() => setPageNumber((page) => page + 1)}
              className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-nexoraMuted transition hover:bg-nexoraCanvas disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          </div>
        ) : null}
      </section>

      <section className={`${panel} bg-nexoraBrandSoft/20 border-nexoraBrand/20`}>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Lock className="h-4 w-4 text-nexoraBrand" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-nexoraText flex items-center gap-1.5">
              {t('components.staff_dashboard.views.StaffReviews.identitySecured')}
              <HelpCircle className="h-3.5 w-3.5 text-nexoraSubtle" />
            </h4>
            <p className="text-xs text-nexoraMuted mt-1 leading-relaxed">
              {t('components.staff_dashboard.views.StaffReviews.internal')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
