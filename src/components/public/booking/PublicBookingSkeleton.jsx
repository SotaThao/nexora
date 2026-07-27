import { SkeletonTheme } from 'react-loading-skeleton'
import Skeleton from '../../ui/skeleton/Skeleton'

const SKELETON_BASE = '#ebe4f7'
const SKELETON_HIGHLIGHT = '#f7f3ff'

function ChoiceCardSkeleton({ withIcon = false }) {
  return (
    <div className="public-booking-skeleton-choice" aria-hidden="true">
      {withIcon ? (
        <Skeleton circle width={28} height={28} />
      ) : null}
      <Skeleton width="72%" height={12} borderRadius={6} />
      <Skeleton width="58%" height={10} borderRadius={6} />
    </div>
  )
}

/**
 * Loading placeholder that mirrors the public booking form layout.
 */
export default function PublicBookingSkeleton({
  serviceCount = 8,
  staffCount = 5,
} = {}) {
  return (
    <SkeletonTheme
      baseColor={SKELETON_BASE}
      highlightColor={SKELETON_HIGHLIGHT}
      borderRadius="0.75rem"
      duration={1.4}
    >
      <div className="public-booking-skeleton" aria-busy="true" aria-live="polite">
        <header className="brand-card public-booking-skeleton-brand">
          <Skeleton width={72} height={72} borderRadius={24} />
          <Skeleton width={140} height={11} borderRadius={6} />
          <Skeleton width={220} height={28} borderRadius={8} />
        </header>

        <section className="step-panel app-card public-booking-skeleton-card">
          <Skeleton width="68%" height={24} borderRadius={8} />

          <div className="customer-fields public-booking-skeleton-fields">
            <div className="public-booking-skeleton-field">
              <Skeleton width="42%" height={12} borderRadius={6} />
              <Skeleton width="100%" height={54} borderRadius={15} />
            </div>
            <div className="public-booking-skeleton-field">
              <Skeleton width="36%" height={12} borderRadius={6} />
              <Skeleton width="100%" height={54} borderRadius={15} />
            </div>
          </div>

          <Skeleton width="78%" height={24} borderRadius={8} style={{ marginTop: 18 }} />

          <div className="service-grid public-booking-skeleton-grid">
            {Array.from({ length: serviceCount }, (_, index) => (
              <ChoiceCardSkeleton key={`service-skel-${index}`} />
            ))}
          </div>

          <div className="public-booking-skeleton-summary">
            <Skeleton width="48%" height={14} borderRadius={6} />
            <Skeleton width={48} height={16} borderRadius={6} />
          </div>

          <Skeleton width="40%" height={14} borderRadius={6} style={{ marginTop: 20 }} />

          <div className="staff-grid public-booking-skeleton-grid">
            {Array.from({ length: staffCount }, (_, index) => (
              <ChoiceCardSkeleton key={`staff-skel-${index}`} withIcon />
            ))}
          </div>

          <div className="booking-select-grid public-booking-skeleton-selects">
            <div className="public-booking-skeleton-field">
              <Skeleton width="34%" height={12} borderRadius={6} />
              <Skeleton width="100%" height={48} borderRadius={13} />
            </div>
            <div className="public-booking-skeleton-field">
              <Skeleton width="28%" height={12} borderRadius={6} />
              <Skeleton width="100%" height={48} borderRadius={13} />
            </div>
          </div>

          <div className="public-booking-skeleton-action">
            <Skeleton width="100%" height={54} borderRadius={16} />
          </div>
        </section>
      </div>
    </SkeletonTheme>
  )
}
