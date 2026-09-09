import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { SkeletonList } from '../../../../ui/skeleton'
import {
  POS_SERVICE_INCOME_LINES_PAGE_SIZE,
  PosServiceIncomeRowType,
} from '../../../../../constants/posServiceIncomeReport'
import { usePosServiceIncomeLines } from '../../../../../data/hooks/usePosServiceIncomeReport'
import type {
  PosServiceIncomeReportParams,
  PosServiceIncomeRow,
} from '../../../../../data/repositories/posServiceIncomeReport'
import { formatCurrency } from '../../../utils'

const TK = 'components.dashboard.views.pos.reports.serviceIncome.lines'

type Props = {
  params: PosServiceIncomeReportParams
  row: PosServiceIncomeRow
  rowLabel: string
  periodLabel: string
  onClose: () => void
}

export default function ServiceIncomeLinesModal({
  params,
  row,
  rowLabel,
  periodLabel,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const [pageNumber, setPageNumber] = useState(1)

  const linesQuery = usePosServiceIncomeLines({
    ...params,
    rowType: row.rowType,
    // A Custom row has no id, and the backend rejects one being sent alongside it.
    rowId: row.rowType === PosServiceIncomeRowType.Custom ? null : row.rowId,
    pageNumber,
    pageSize: POS_SERVICE_INCOME_LINES_PAGE_SIZE,
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const page = linesQuery.data
  const lines = page?.items ?? []
  const pageNetTotal = lines.reduce((sum, line) => sum + line.netAmount, 0)

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="pos-service-income-lines-card max-w-4xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-income-lines-title"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-nexoraBorder px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {periodLabel}
            </p>
            <h2
              id="service-income-lines-title"
              className="break-words text-base font-extrabold text-nexoraText"
            >
              {rowLabel}
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-nexoraMuted">
              {t(`${TK}.rowSummary`, {
                net: formatCurrency(row.netRevenue),
                count: row.completedCount,
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(`${TK}.close`)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder text-nexoraText transition hover:border-nexoraBrand"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {linesQuery.isPending ? (
            <div className="p-5">
              <SkeletonList count={5} lines={2} />
            </div>
          ) : linesQuery.isError ? (
            <div className="p-8 text-center" role="alert">
              <p className="text-sm font-bold text-rose-600">{t(`${TK}.loadError`)}</p>
              <button
                type="button"
                onClick={() => void linesQuery.refetch()}
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-nexoraBorder bg-white px-3 text-xs font-extrabold text-nexoraText transition hover:bg-nexoraCanvas"
              >
                {t(`${TK}.retry`)}
              </button>
            </div>
          ) : lines.length === 0 ? (
            <p className="p-10 text-center text-xs font-semibold text-nexoraMuted">
              {t(`${TK}.empty`)}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full min-w-[780px] text-left text-xs"
                aria-label={t(`${TK}.tableAriaLabel`)}
              >
                <thead className="sticky top-0 z-[1] bg-nexoraCanvas/95">
                  <tr className="border-b border-nexoraBorder text-[10px] uppercase tracking-wide text-nexoraMuted">
                    <th className="px-3 py-2.5">{t(`${TK}.order`)}</th>
                    <th className="px-3 py-2.5">{t(`${TK}.completedAt`)}</th>
                    <th className="px-3 py-2.5">{t(`${TK}.customer`)}</th>
                    <th className="px-3 py-2.5">{t(`${TK}.technician`)}</th>
                    <th className="px-3 py-2.5 text-right">{t(`${TK}.quantity`)}</th>
                    <th className="px-3 py-2.5 text-right">{t(`${TK}.gross`)}</th>
                    <th className="px-3 py-2.5 text-right">{t(`${TK}.lineDiscount`)}</th>
                    <th className="px-3 py-2.5 text-right">{t(`${TK}.allocatedOrderDiscount`)}</th>
                    <th className="px-3 py-2.5 text-right">{t(`${TK}.net`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr
                      key={`${line.orderNumber}-${line.completedAtLocal}-${index}`}
                      className="border-b border-nexoraBorder/70 last:border-b-0"
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 font-extrabold text-nexoraText">
                        #{line.orderNumber}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-nexoraMuted">
                        {formatLocalDateTime(line.completedAtLocal)}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-nexoraText">
                        {line.customerName || t(`${TK}.noCustomer`)}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-nexoraText">
                        {line.technicianName || t(`${TK}.noTechnician`)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-nexoraText">
                        {line.quantity}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-nexoraText">
                        {formatCurrency(line.grossAmount)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-rose-600">
                        {line.lineDiscount > 0 ? `-${formatCurrency(line.lineDiscount)}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-rose-600">
                        {line.allocatedOrderDiscount > 0
                          ? `-${formatCurrency(line.allocatedOrderDiscount)}`
                          : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-extrabold tabular-nums text-nexoraText">
                        {formatCurrency(line.netAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-nexoraBrandSoft font-extrabold text-nexoraBrandDark">
                  <tr>
                    <td className="px-3 py-2.5" colSpan={8}>
                      {t(`${TK}.pageTotal`)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatCurrency(pageNetTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-nexoraBorder bg-nexoraCanvas/50 px-4 py-3">
          <p className="text-xs font-semibold text-nexoraMuted">
            {page
              ? t(`${TK}.pageStatus`, {
                  page: page.pageNumber,
                  totalPages: page.totalPages,
                  totalCount: page.totalCount,
                })
              : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPageNumber((previous) => Math.max(1, previous - 1))}
              disabled={!page?.hasPreviousPage || linesQuery.isFetching}
              aria-label={t(`${TK}.previousPage`)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-nexoraBorder bg-white text-nexoraText transition hover:bg-nexoraCanvas disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPageNumber((previous) => previous + 1)}
              disabled={!page?.hasNextPage || linesQuery.isFetching}
              aria-label={t(`${TK}.nextPage`)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-nexoraBorder bg-white text-nexoraText transition hover:bg-nexoraCanvas disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}

/**
 * `completedAtLocal` is already shifted into the salon's calendar by the server, so it carries no
 * offset — format it as UTC so the browser's own zone cannot shift it a second time.
 */
function formatLocalDateTime(value: string): string {
  if (!value) return '—'
  const naive = value.replace(/(?:z|[+-]\d{2}:?\d{2})$/i, '')
  const date = new Date(`${naive}Z`)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(date)
}
