import type { ReactNode } from 'react'
import Skeleton from '../../ui/skeleton/Skeleton'
import { useTranslation } from '../../../contexts/LanguageContext'

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
          <div className="booking-table-mobile-fields">
            {Array.from({ length: 8 }).map((__, fieldIndex) => (
              <div
                className={`booking-table-mobile-field${fieldIndex === 7 ? ' booking-table-mobile-field-actions' : ''}`}
                key={fieldIndex}
              >
                <Skeleton width="42%" height={10} borderRadius={4} />
                <Skeleton
                  width={fieldIndex % 2 === 0 ? '78%' : '56%'}
                  height={fieldIndex === 7 ? 30 : 14}
                  borderRadius={fieldIndex === 7 ? 8 : 6}
                />
              </div>
            ))}
          </div>
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
            <Skeleton width={42} height={24} borderRadius={999} />
          </div>
          <div className="tech-card-footer">
            <Skeleton width={108} height={22} borderRadius={999} />
            <Skeleton width={64} height={30} borderRadius={8} />
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
  const { t } = useTranslation()
  return (
    <div
      className="settings-shell"
      aria-busy="true"
      aria-label={t('components.dashboard.views.BookingHubView.settings.loadingAria')}
    >
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

export function BookingSmsCampaignsSkeleton() {
  const { t } = useTranslation()

  return (
    <div
      className="panel-sms-campaigns booking-sms-campaigns-skeleton"
      aria-busy="true"
      aria-label={t('components.dashboard.views.BookingHubView.smsCampaigns.loadingAria')}
    >
      <div className="marketing-panel-head">
        <BookingSkeletonStack>
          <Skeleton width={280} height={14} borderRadius={6} />
        </BookingSkeletonStack>
        <div className="marketing-panel-actions">
          <Skeleton width={170} height={52} borderRadius={12} />
          <Skeleton width={138} height={42} borderRadius={8} />
          <Skeleton width={168} height={42} borderRadius={8} />
        </div>
      </div>

      <div className="sms-campaign-stats" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <article className="sms-stat-card booking-skeleton-card" key={index}>
            <BookingSkeletonStack>
              <Skeleton width="58%" height={10} borderRadius={4} />
              <Skeleton width="42%" height={24} borderRadius={6} />
              <Skeleton width="72%" height={10} borderRadius={4} />
            </BookingSkeletonStack>
          </article>
        ))}
      </div>

      <div className="marketing-section-heading">
        <Skeleton width={240} height={16} borderRadius={6} />
      </div>

      <div className="sms-campaign-grid" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <article className="sms-campaign-card booking-skeleton-card" key={index}>
            <Skeleton width={34} height={34} borderRadius={9} />
            <BookingSkeletonStack className="booking-skeleton-stack-grow">
              <Skeleton width="70%" height={14} borderRadius={6} />
              <Skeleton width="92%" height={11} borderRadius={6} />
              <Skeleton width="88%" height={11} borderRadius={6} />
            </BookingSkeletonStack>
            <div className="sms-campaign-meta">
              <Skeleton width={72} height={18} borderRadius={6} />
              <Skeleton width={64} height={22} borderRadius={999} />
            </div>
          </article>
        ))}
      </div>

      <section className="sms-campaign-history" aria-hidden="true">
        <div className="marketing-section-heading">
          <Skeleton width={120} height={16} borderRadius={6} />
        </div>
        <div className="sms-campaign-table-wrap">
          <table className="sms-campaign-table">
            <thead>
              <tr>
                {Array.from({ length: 7 }).map((_, index) => (
                  <th key={index} scope="col">
                    <Skeleton width={index === 6 ? 56 : 72} height={10} borderRadius={4} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="booking-skeleton-row">
                  <td><Skeleton width="78%" height={13} borderRadius={6} /></td>
                  <td><Skeleton width="72%" height={12} borderRadius={6} /></td>
                  <td><Skeleton width={64} height={12} borderRadius={6} /></td>
                  <td><Skeleton width={72} height={22} borderRadius={999} /></td>
                  <td><Skeleton width={36} height={12} borderRadius={6} /></td>
                  <td><Skeleton width={28} height={12} borderRadius={6} /></td>
                  <td>
                    <div className="sms-campaign-actions">
                      <Skeleton width={52} height={30} borderRadius={7} />
                      <Skeleton width={58} height={30} borderRadius={7} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export function BookingCreditsBalanceSkeleton() {
  return (
    <div className="credits-balance-grid" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, index) => (
        <article
          className={`credits-card booking-skeleton-card${index === 0 ? ' credits-card-plan' : ' credits-card-topup'}`}
          key={index}
        >
          <div className="credits-card-head">
            <Skeleton width={40} height={40} borderRadius={12} />
            <BookingSkeletonStack className="booking-skeleton-stack-grow">
              <Skeleton width="42%" height={16} borderRadius={6} />
              <Skeleton width="58%" height={12} borderRadius={6} />
            </BookingSkeletonStack>
            <Skeleton width={108} height={28} borderRadius={999} />
          </div>
          <div className="credits-plan-remaining">
            <Skeleton width={72} height={12} borderRadius={6} />
            <div className="credits-plan-remaining-values">
              <Skeleton width={64} height={28} borderRadius={8} />
              <Skeleton width={36} height={14} borderRadius={6} />
              <Skeleton width={8} height={8} borderRadius={999} />
              <Skeleton width={56} height={28} borderRadius={8} />
              <Skeleton width={36} height={14} borderRadius={6} />
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export function BookingCreditsHistoryTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="booking-skeleton-row" aria-hidden="true">
          <td>
            <Skeleton width={64} height={22} borderRadius={999} />
          </td>
          <td>
            <Skeleton width="72%" height={14} borderRadius={6} />
          </td>
          <td>
            <Skeleton width={88} height={14} borderRadius={6} />
          </td>
          <td>
            <BookingSkeletonStack>
              <Skeleton width="68%" height={14} borderRadius={6} />
              <Skeleton width="42%" height={11} borderRadius={6} />
            </BookingSkeletonStack>
          </td>
        </tr>
      ))}
    </>
  )
}

/** Skeleton rows for Package History (7 columns — matches HTML table). */
export function BookingPackageHistoryTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="booking-skeleton-row" aria-hidden="true">
          <td>
            <BookingSkeletonStack>
              <Skeleton width="72%" height={14} borderRadius={6} />
              <Skeleton width="48%" height={11} borderRadius={6} />
            </BookingSkeletonStack>
          </td>
          <td>
            <Skeleton width={72} height={14} borderRadius={6} />
          </td>
          <td>
            <BookingSkeletonStack>
              <Skeleton width="70%" height={14} borderRadius={6} />
              <Skeleton width="45%" height={11} borderRadius={6} />
            </BookingSkeletonStack>
          </td>
          <td>
            <Skeleton width={72} height={22} borderRadius={999} />
          </td>
          <td>
            <Skeleton width={88} height={14} borderRadius={6} />
          </td>
          <td>
            <Skeleton width={64} height={22} borderRadius={999} />
          </td>
          <td>
            <Skeleton width={120} height={22} borderRadius={6} />
          </td>
        </tr>
      ))}
    </>
  )
}

export function BookingPackageHistorySkeleton() {
  const { t } = useTranslation()

  return (
    <section
      className="credits-history-section package-history-section"
      aria-busy="true"
      aria-label={t('components.dashboard.views.BookingHubView.plans.packageHistoryLoadingAria')}
    >
      <div className="credits-section-heading">
        <BookingSkeletonStack>
          <Skeleton width={64} height={11} borderRadius={6} />
          <Skeleton width={160} height={18} borderRadius={6} />
        </BookingSkeletonStack>
      </div>

      <div className="credits-history-scroll">
        <table className="credits-history-table package-history-plan-table">
          <thead>
            <tr>
              {Array.from({ length: 7 }).map((_, index) => (
                <th key={index} scope="col">
                  <Skeleton width={index === 2 ? 96 : 64} height={11} borderRadius={4} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <BookingPackageHistoryTableSkeleton rows={5} />
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Skeleton for Buy Package catalog (3 plan cards). */
export function BookingBuyPackageSkeleton() {
  const { t } = useTranslation()

  return (
    <div
      className="plans-stack"
      aria-busy="true"
      aria-label={t('components.dashboard.views.BookingHubView.plans.buyPackageLoadingAria')}
    >
      <div className="plans-hero">
        <Skeleton width="72%" height={18} borderRadius={6} />
      </div>
      <div className="plans-grid">
        {[0, 1, 2].map((key) => (
          <article className="service-plan-card booking-skeleton-card" key={key} aria-hidden="true">
            <BookingSkeletonStack>
              <Skeleton width={88} height={14} borderRadius={6} />
              <Skeleton width={96} height={28} borderRadius={8} />
              <Skeleton width={72} height={12} borderRadius={6} />
              <Skeleton width="100%" height={12} borderRadius={6} />
              <Skeleton width="92%" height={12} borderRadius={6} />
              <Skeleton width="86%" height={12} borderRadius={6} />
              <Skeleton width="100%" height={40} borderRadius={10} />
            </BookingSkeletonStack>
          </article>
        ))}
      </div>
      <article className="roi-panel booking-skeleton-card" aria-hidden="true">
        <BookingSkeletonStack>
          <Skeleton width={120} height={16} borderRadius={6} />
          <Skeleton width="100%" height={64} borderRadius={8} />
        </BookingSkeletonStack>
      </article>
      <article className="guarantee-panel booking-skeleton-card" aria-hidden="true">
        <BookingSkeletonStack>
          <Skeleton width={140} height={16} borderRadius={6} />
          <Skeleton width="80%" height={20} borderRadius={6} />
        </BookingSkeletonStack>
      </article>
    </div>
  )
}

/** Skeleton rows for wallet payment methods inside plan checkout modal. */
export function PlanPaymentMethodsSkeleton({ rows = 3 }: { rows?: number }) {
  const { t } = useTranslation()

  return (
    <div
      className="sms-credit-payment-list plan-payment-methods-skeleton"
      aria-busy="true"
      aria-label={t('components.dashboard.views.BookingHubView.plans.planPaymentMethodsLoadingAria')}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="sms-credit-payment plan-payment-method-skeleton-row"
          aria-hidden="true"
        >
          <span className="sms-credit-payment-main">
            <Skeleton width={18} height={18} borderRadius={999} />
            <Skeleton width={28} height={28} borderRadius={999} />
            <Skeleton width={96} height={14} borderRadius={6} />
          </span>
          <span className="sms-credit-payment-balance">
            <Skeleton width={48} height={10} borderRadius={4} />
            <Skeleton width={64} height={14} borderRadius={6} />
          </span>
        </div>
      ))}
    </div>
  )
}

export function BookingCreditsUsageSkeleton() {
  const { t } = useTranslation()

  return (
    <section
      className="credits-page"
      aria-busy="true"
      aria-label={t('components.dashboard.views.BookingHubView.plans.credits.loadingAria')}
    >
      <BookingCreditsBalanceSkeleton />

      <section className="credits-history-section" aria-hidden="true">
        <div className="credits-section-heading">
          <BookingSkeletonStack>
            <Skeleton width={72} height={11} borderRadius={6} />
            <Skeleton width={148} height={18} borderRadius={6} />
          </BookingSkeletonStack>
          <div className="credits-history-tools">
            <div className="credits-history-filters">
              <Skeleton width={56} height={32} borderRadius={999} />
              <Skeleton width={56} height={32} borderRadius={999} />
              <Skeleton width={64} height={32} borderRadius={999} />
            </div>
          </div>
        </div>

        <div className="credits-history-scroll">
          <table className="credits-history-table">
            <thead>
              <tr>
                {Array.from({ length: 4 }).map((_, index) => (
                  <th key={index} scope="col">
                    <Skeleton width={index === 1 ? 72 : 56} height={11} borderRadius={4} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <BookingCreditsHistoryTableSkeleton rows={5} />
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
