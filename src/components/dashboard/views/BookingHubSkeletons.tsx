import type { ReactNode } from 'react'
import Skeleton from '../../ui/skeleton/Skeleton'

function BookingSkeletonStack({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`booking-skeleton-stack ${className}`.trim()}>{children}</div>
}

export function BookingKpiSkeleton() {
  return (
    <div className="overview-kpis" aria-hidden="true">
      {[0, 1, 2].map((key) => (
        <article className="overview-card kpi-card booking-skeleton-card" key={key}>
          <div className="booking-skeleton-kpi-top">
            <Skeleton width={38} height={38} borderRadius={11} />
            <Skeleton width={76} height={22} borderRadius={999} />
          </div>
          <div className="booking-skeleton-kpi-body">
            <Skeleton width="58%" height={10} borderRadius={6} />
            <Skeleton width="34%" height={30} borderRadius={8} />
            <Skeleton width="72%" height={12} borderRadius={6} />
          </div>
        </article>
      ))}
    </div>
  )
}

export function BookingTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="booking-skeleton-row">
          <td>
            <BookingSkeletonStack>
              <Skeleton width="72%" height={14} borderRadius={6} />
              <Skeleton width="88%" height={11} borderRadius={6} />
            </BookingSkeletonStack>
          </td>
          <td><Skeleton width="80%" height={22} borderRadius={999} /></td>
          <td><Skeleton width="62%" height={14} borderRadius={6} /></td>
          <td>
            <BookingSkeletonStack>
              <Skeleton width="54%" height={14} borderRadius={6} />
              <Skeleton width="42%" height={11} borderRadius={6} />
            </BookingSkeletonStack>
          </td>
          <td><Skeleton width={72} height={22} borderRadius={999} /></td>
          <td><Skeleton width={108} height={28} borderRadius={8} /></td>
        </tr>
      ))}
    </>
  )
}

export function BookingCardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="booking-card-panel" aria-hidden="true">
      <div className="booking-card-list">
        {Array.from({ length: count }).map((_, index) => (
          <article className="booking-appointment-card booking-skeleton-card" key={index}>
            <div className="booking-card-top">
              <BookingSkeletonStack className="booking-skeleton-stack-grow">
                <Skeleton width="68%" height={16} borderRadius={6} />
                <Skeleton width="84%" height={12} borderRadius={6} />
              </BookingSkeletonStack>
              <Skeleton width={72} height={22} borderRadius={999} />
            </div>
            <BookingSkeletonStack>
              <Skeleton width="100%" height={12} borderRadius={6} />
              <Skeleton width="78%" height={12} borderRadius={6} />
              <Skeleton width="64%" height={12} borderRadius={6} />
            </BookingSkeletonStack>
            <Skeleton width="42%" height={30} borderRadius={8} />
          </article>
        ))}
      </div>
    </div>
  )
}

export function BookingTableMobileListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="booking-table-mobile-list" aria-busy="true" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <article className="booking-table-mobile-row booking-skeleton-card" key={index}>
          <div className="booking-table-mobile-head">
            <BookingSkeletonStack className="booking-skeleton-stack-grow">
              <Skeleton width="68%" height={16} borderRadius={6} />
              <Skeleton width="84%" height={12} borderRadius={6} />
            </BookingSkeletonStack>
            <Skeleton width={72} height={22} borderRadius={999} />
          </div>
          <div className="booking-table-mobile-meta">
            <Skeleton width={88} height={22} borderRadius={999} />
            <Skeleton width={72} height={22} borderRadius={999} />
            <Skeleton width="56%" height={12} borderRadius={6} />
          </div>
          <Skeleton width="42%" height={30} borderRadius={8} />
        </article>
      ))}
    </div>
  )
}

export function BookingTodayListSkeleton({
  viewMode,
  isMobileUI = false,
}: {
  viewMode: 'table' | 'card'
  isMobileUI?: boolean
}) {
  if (viewMode === 'table' && isMobileUI) {
    return <BookingTableMobileListSkeleton count={4} />
  }

  if (viewMode === 'table') {
    return (
      <div className="booking-table-wrap" aria-busy="true" aria-hidden="true">
        <div className="booking-table-scroller">
        <table className="booking-table">
          <thead>
            <tr>
              {Array.from({ length: 6 }).map((_, index) => (
                <th key={index} scope="col">
                  <Skeleton width={index === 5 ? 48 : 72} height={12} borderRadius={6} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <BookingTableSkeleton rows={6} />
          </tbody>
        </table>
        </div>
      </div>
    )
  }

  return <BookingCardListSkeleton count={4} />
}

export function BookingTodayContentSkeleton({ viewMode }: { viewMode: 'table' | 'card' }) {
  return (
    <>
      <div className="booking-daybar booking-skeleton-toolbar">
        <Skeleton width={168} height={18} borderRadius={6} />
        <Skeleton width={148} height={34} borderRadius={8} />
      </div>
      <div className="booking-controls booking-skeleton-controls" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="booking-skeleton-control" key={index}>
            <Skeleton width="52%" height={10} borderRadius={6} />
            <Skeleton width="100%" height={36} borderRadius={8} />
          </div>
        ))}
        <Skeleton width={72} height={36} borderRadius={8} />
      </div>
      {viewMode === 'table' ? (
        <div className="booking-table-wrap">
          <table className="booking-table">
            <thead>
              <tr>
                {Array.from({ length: 6 }).map((_, index) => (
                  <th key={index} scope="col">
                    <Skeleton width={index === 5 ? 48 : 72} height={12} borderRadius={6} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <BookingTableSkeleton rows={6} />
            </tbody>
          </table>
        </div>
      ) : (
        <BookingCardListSkeleton count={4} />
      )}
    </>
  )
}

export function BookingTeamGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <article className="tech-card booking-skeleton-card" key={index} aria-hidden="true">
          <div className="tech-top">
            <Skeleton circle width={40} height={40} />
            <BookingSkeletonStack className="booking-skeleton-stack-grow">
              <Skeleton width="72%" height={14} borderRadius={6} />
              <Skeleton width="54%" height={12} borderRadius={6} />
            </BookingSkeletonStack>
            <div className="tech-top-actions">
              <Skeleton width={30} height={30} borderRadius={8} />
              <Skeleton width={42} height={24} borderRadius={999} />
            </div>
          </div>
          <div className="booking-skeleton-chip-row">
            <Skeleton width={68} height={22} borderRadius={999} />
            <Skeleton width={80} height={22} borderRadius={999} />
          </div>
        </article>
      ))}
    </>
  )
}

export function BookingTechStaffListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="tech-choice-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="tech-choice-card booking-skeleton-choice" key={index}>
          <Skeleton circle width={34} height={34} />
          <BookingSkeletonStack className="booking-skeleton-stack-grow">
            <Skeleton width="64%" height={13} borderRadius={6} />
            <Skeleton width="88%" height={11} borderRadius={6} />
          </BookingSkeletonStack>
        </div>
      ))}
    </div>
  )
}

export function BookingTechServicesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="tech-service-checks booking-skeleton-service-checks" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="booking-skeleton-service-check" key={index}>
          <Skeleton width={16} height={16} borderRadius={4} />
          <Skeleton width={`${58 + (index % 3) * 8}%`} height={13} borderRadius={6} />
        </div>
      ))}
    </div>
  )
}

export function BookingTechModalProfileSkeleton() {
  return (
    <div className="tech-modal-grid booking-skeleton-modal-grid" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="settings-field" key={index}>
          <Skeleton width="42%" height={10} borderRadius={6} />
          <Skeleton width="100%" height={38} borderRadius={8} />
        </div>
      ))}
    </div>
  )
}

export function BookingTechScheduleSkeleton() {
  return (
    <div className="tech-schedule booking-skeleton-schedule" aria-hidden="true">
      {Array.from({ length: 7 }).map((_, index) => (
        <div className="tech-schedule-row booking-skeleton-schedule-row" key={index}>
          <Skeleton width={68} height={13} borderRadius={6} />
          <Skeleton width={54} height={18} borderRadius={6} />
          <Skeleton width={168} height={34} borderRadius={8} />
        </div>
      ))}
    </div>
  )
}

export function BookingSettingsSkeleton() {
  return (
    <div className="settings-shell" aria-busy="true" aria-label="Loading salon settings">
      <div className="settings-hero is-compact">
        <Skeleton width={120} height={12} borderRadius={6} />
        <Skeleton width="52%" height={24} borderRadius={8} />
        <Skeleton width="78%" height={14} borderRadius={6} />
        <div className="settings-sync-grid booking-skeleton-sync-grid">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} width="100%" height={42} borderRadius={999} />
          ))}
        </div>
      </div>

      <div className="settings-grid">
        {Array.from({ length: 2 }).map((_, index) => (
          <article className="settings-card booking-skeleton-card" key={index}>
            <div className="settings-card-head">
              <BookingSkeletonStack>
                <Skeleton width={180} height={16} borderRadius={6} />
                <Skeleton width="72%" height={12} borderRadius={6} />
              </BookingSkeletonStack>
              <Skeleton width={28} height={28} borderRadius={8} />
            </div>
            <div className="settings-field-grid settings-business-grid">
              {Array.from({ length: 4 }).map((__, fieldIndex) => (
                <div className="settings-field" key={fieldIndex}>
                  <Skeleton width="46%" height={10} borderRadius={6} />
                  <Skeleton width="100%" height={38} borderRadius={8} />
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="settings-two-grid">
        {Array.from({ length: 2 }).map((_, index) => (
          <article className="settings-card booking-skeleton-card" key={index}>
            <div className="settings-card-head">
              <BookingSkeletonStack>
                <Skeleton width={160} height={16} borderRadius={6} />
                <Skeleton width="68%" height={12} borderRadius={6} />
              </BookingSkeletonStack>
              <Skeleton width={28} height={28} borderRadius={8} />
            </div>
            <BookingSkeletonStack>
              <Skeleton width="100%" height={38} borderRadius={8} />
              <Skeleton width="100%" height={38} borderRadius={8} />
              <Skeleton width="100%" height={38} borderRadius={8} />
              <Skeleton width="100%" height={38} borderRadius={8} />
            </BookingSkeletonStack>
          </article>
        ))}
      </div>

      <div className="settings-save-bar booking-skeleton-save-bar">
        <Skeleton width={148} height={40} borderRadius={10} />
      </div>
    </div>
  )
}

export function BookingHubTabsSkeleton() {
  return (
    <div className="page-tabs booking-skeleton-tabs" aria-busy="true" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} width={132} height={40} borderRadius={10} />
      ))}
    </div>
  )
}
