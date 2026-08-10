import { useEffect, useMemo } from 'react'
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
const PACKAGE_HISTORY_SKELETON_ROWS = 5
const HISTORY_COL_SPAN = 7

/**
 * Package purchase history table (VoiceAI / TipPlatform orders).
 * Client-side pagination — API returns the full list today.
 */
export default function PackageHistoryPanel({
  queryOptions,
}: {
  /** Fresh network fetch on mount (Package Management History tab). */
  queryOptions?: PackageManagementTabQueryOptions
} = {}) {
  const { t, currentLanguage } = useTranslation()
  const {
    data: rows = [],
    dataUpdatedAt,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useSubscriptionPurchaseHistory(queryOptions ?? {})

  const { pageNumber, pageSize, setPage, reset } = usePagination({
    pageSize: PACKAGE_HISTORY_PAGE_SIZE,
  })

  useEffect(() => {
    reset()
  }, [dataUpdatedAt, reset])

  const totalCount = rows.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1)

  useEffect(() => {
    if (pageNumber > totalPages) setPage(totalPages)
  }, [pageNumber, totalPages, setPage])

  const pageRows = useMemo(() => {
    const start = (pageNumber - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, pageNumber, pageSize])

  const showSkeleton = isLoading && rows.length === 0
  const showTableSkeleton = isFetching && rows.length === 0
  const showPagination = !isLoading && totalCount > 0

  if (showSkeleton) {
    return <BookingPackageHistorySkeleton />
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
              <th scope="col">{t(`${TK}.packageHistoryColValidUntil`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColStatus`)}</th>
              <th scope="col">{t(`${TK}.packageHistoryColTransaction`)}</th>
            </tr>
          </thead>
          <tbody>
            {showTableSkeleton ? (
              <BookingPackageHistoryTableSkeleton rows={PACKAGE_HISTORY_SKELETON_ROWS} />
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
              pageRows.map((row) => {
                const displayAt = resolvePackageHistoryDisplayAt(row)
                const purchased = formatBookingHubDateTimeParts(displayAt, currentLanguage)
                const validUntil = row.validUntil
                  ? formatBookingHubDateTimeParts(row.validUntil, currentLanguage)?.date
                    ?? BOOKING_HUB_EMPTY_CELL
                  : BOOKING_HUB_EMPTY_CELL
                const statusClass = PACKAGE_HISTORY_STATUS_CLASS[row.uiStatus]
                const statusLabel = t(
                  `${TK}.${PACKAGE_HISTORY_STATUS_LABEL_KEY[row.uiStatus]}`,
                )
                const packageLabel = formatPackageHistoryPackageLabel(row.planName)
                // `periodInMonths === 0` (credit top-up) → no "Monthly subscription", term "—"
                // Do not use `periodInMonths || 1` — 0 is falsy and would show "1 month".
                const showSubscriptionSubtitle = isPackageHistorySubscriptionTerm(
                  row.periodInMonths,
                )
                const termLabel = formatPackageHistoryTerm(row.periodInMonths, t, TK)
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
                      <span className="credits-history-activity">
                        <strong>{packageLabel}</strong>
                        {showSubscriptionSubtitle ? (
                          <small>{t(`${TK}.packageHistoryMonthlySub`)}</small>
                        ) : null}
                      </span>
                    </td>
                    <td>
                      {showSubscriptionSubtitle ? (
                        <span className="credits-product-badge credits-product-badge-voice">
                          {termLabel}
                        </span>
                      ) : (
                        termLabel
                      )}
                    </td>
                    <td>{validUntil}</td>
                    <td>
                      <span className={`package-history-status ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td>
                      <span
                        className="package-history-transaction"
                        title={row.referenceId || row.orderId || undefined}
                      >
                        {formatPackageHistoryTransactionId(
                          row.referenceId || row.orderId,
                        )}
                      </span>
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
          hasNextPage={pageNumber < totalPages}
          hasPreviousPage={pageNumber > 1}
          onPageChange={setPage}
          isLoading={isFetching}
          className={`${BOOKING_HUB_PAGINATION_CLASSNAME} package-history-pagination`}
        />
      ) : null}
    </section>
  )
}
