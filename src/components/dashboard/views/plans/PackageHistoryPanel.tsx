import { useEffect } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { useSubscriptionPurchaseHistory } from '../../../../data/hooks/useSubscriptionPayments'
import { usePagination } from '../../../../hooks/usePagination'
import { getApiErrorCode } from '../../../../types/domain'
import Pagination from '../../../ui/Pagination'
import {
  BOOKING_HUB_EMPTY_CELL,
  BOOKING_HUB_PAGINATION_CLASSNAME,
  formatBookingHubDateTimeParts,
} from '../bookingHubFormatters'
import {
  BookingPackageHistorySkeleton,
  BookingPackageHistoryTableSkeleton,
} from '../BookingHubSkeletons'
import {
  PACKAGE_HISTORY_PAGE_SIZE,
  PACKAGE_HISTORY_STATUS_CLASS,
  PACKAGE_HISTORY_STATUS_LABEL_KEY,
  formatPackageHistoryAmount,
  formatPackageHistoryPackageLabel,
  formatPackageHistoryTerm,
  formatPackageHistoryTransactionId,
  isPackageHistorySubscriptionTerm,
  resolvePackageHistoryDisplayAt,
} from './constants'
import { type PackageManagementTabQueryOptions } from '../packageManagement/constants'

const TK = 'components.dashboard.views.BookingHubView.plans'
const HISTORY_COL_SPAN = 7

/**
 * Package purchase history table (VoiceAI / TipPlatform / credit top-ups).
 * Server-side pagination via GET purchase-history `Page` / `PageSize`.
 */
export default function PackageHistoryPanel({
  queryOptions,
}: {
  /** Fresh network fetch on mount (Package Management History tab). */
  queryOptions?: PackageManagementTabQueryOptions
} = {}) {
  const { t, currentLanguage } = useTranslation()
  const { pageNumber, pageSize, setPage } = usePagination({
    pageSize: PACKAGE_HISTORY_PAGE_SIZE,
  })

  const {
    data,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    error,
    refetch,
  } = useSubscriptionPurchaseHistory({
    pageNumber,
    pageSize,
    ...(queryOptions ?? {}),
  })

  const rows = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, data?.totalPages ?? 1)
  const hasNextPage = data?.hasNextPage ?? pageNumber < totalPages
  const hasPreviousPage = data?.hasPreviousPage ?? pageNumber > 1

  useEffect(() => {
    if (pageNumber > totalPages) setPage(totalPages)
  }, [pageNumber, totalPages, setPage])

  // Full-page skeleton on first load; row skeleton when paging / refetching.
  const showFullSkeleton = isLoading && !data
  const showTableSkeleton =
    isFetching && (isPlaceholderData || rows.length === 0)
  const skeletonRowCount = Math.min(Math.max(1, pageSize), PACKAGE_HISTORY_PAGE_SIZE)
  const showPagination = Boolean(data) && totalCount > 0

  if (showFullSkeleton) {
    return <BookingPackageHistorySkeleton rows={skeletonRowCount} />
  }

  return (
    <section
      className="credits-history-section package-history-section"
      aria-busy={isFetching}
      aria-labelledby="plans-package-history-title"
    >
      <div className="credits-section-heading">
        <div>
          <span className="credits-kicker">{t(`${TK}.packageHistoryKicker`)}</span>
          <h2 id="plans-package-history-title">{t(`${TK}.packageHistoryTitle`)}</h2>
        </div>
      </div>

      <div className="credits-history-scroll">
        <table className="credits-history-table package-history-plan-table">
          <caption className="sr-only">{t(`${TK}.packageHistoryCaption`)}</caption>
          <thead>
            <tr>
              <th scope="col">{t(`${TK}.packageHistoryColDate`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColAmount`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColPackage`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColTerm`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColStatus`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColTransaction`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColAction`)}</th>
            </tr>
          </thead>
          <tbody>
            {showTableSkeleton ? (
              <BookingPackageHistoryTableSkeleton rows={skeletonRowCount} />
            ) : isError && rows.length === 0 ? (
              <tr>
                <td className="booking-empty-cell" colSpan={HISTORY_COL_SPAN}>
                  <div>{t(getErrorI18nKey(getApiErrorCode(error)))}</div>
                  <button
                    className="booking-mini-button"
                    type="button"
                    onClick={() => void refetch()}
                  >
                    {t(`${TK}.packageHistoryRetry`)}
                  </button>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="booking-empty-cell" colSpan={HISTORY_COL_SPAN}>
                  {t(`${TK}.packageHistoryEmpty`)}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const displayAt = resolvePackageHistoryDisplayAt(row)
                const purchased = formatBookingHubDateTimeParts(displayAt, currentLanguage)
                const statusClass = PACKAGE_HISTORY_STATUS_CLASS[row.uiStatus]
                const statusLabel = t(
                  `${TK}.${PACKAGE_HISTORY_STATUS_LABEL_KEY[row.uiStatus]}`,
                )
                const packageLabel = formatPackageHistoryPackageLabel(row.planName)
                // `periodInMonths === 0` (credit top-up) → term "_"
                // Do not use `periodInMonths || 1` — 0 is falsy and would show "1 month".
                const showTermBadge = isPackageHistorySubscriptionTerm(row.periodInMonths)
                const termLabel = formatPackageHistoryTerm(row.periodInMonths, t, TK)
                const transactionId = formatPackageHistoryTransactionId(
                  row.referenceId || row.orderId,
                )
                return (
                  <tr key={row.orderId || row.referenceId}>
                    <td>
                      <span className="credits-history-date">
                        {purchased?.date ?? BOOKING_HUB_EMPTY_CELL}
                        <small>{purchased?.time ?? BOOKING_HUB_EMPTY_CELL}</small>
                      </span>
                    </td>
                    <td className="package-history-plan-amount">
                      {formatPackageHistoryAmount(row.amount, row.currency)}
                    </td>
                    <td>
                      <div className="package-history-package">
                        <strong>{packageLabel}</strong>
                      </div>
                    </td>
                    <td>
                      {showTermBadge ? (
                        <span className="package-history-term">{termLabel}</span>
                      ) : (
                        termLabel
                      )}
                    </td>
                    <td>
                      <span className={`package-history-status ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td>
                      <span
                        className="package-history-transaction"
                        title={
                          transactionId !== BOOKING_HUB_EMPTY_CELL
                            ? row.referenceId || row.orderId || undefined
                            : undefined
                        }
                      >
                        {transactionId}
                      </span>
                    </td>
                    <td className="package-history-action">
                      {BOOKING_HUB_EMPTY_CELL}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showPagination ? (
        <Pagination
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalPages={totalPages}
          totalCount={totalCount}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          onPageChange={setPage}
          isLoading={isFetching}
          className={`${BOOKING_HUB_PAGINATION_CLASSNAME} package-history-pagination`}
        />
      ) : null}
    </section>
  )
}
