import { useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useTaxiqEmployers } from '../../../../data/hooks/useTaxiqEmployer'
import { usePayrollRuns } from '../../../../data/hooks/usePayrollRuns'
import type { PayrollRun } from '../../../../data/repositories/payrollRuns'
import { SkeletonList } from '../../../ui/skeleton'
import { formatCurrency } from '../../utils'
import CreatePayrollRunModal from './modals/CreatePayrollRunModal'
import PayrollRunDetailModal from './modals/PayrollRunDetailModal'
import FinalizePayrollRunModal from './modals/FinalizePayrollRunModal'

const PAGE_SIZE = 20
const STATUS_FILTERS = ['ValidationFailed', 'ReviewRequired', 'Approved', 'LedgerPosted', 'Reported', 'Cancelled']

export function PayrollRunStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const styles: Record<string, string> = {
    ValidationFailed: 'bg-rose-50 text-rose-600',
    ReviewRequired: 'bg-amber-50 text-amber-600',
    Approved: 'bg-emerald-50 text-emerald-600',
    LedgerPosted: 'bg-sky-50 text-sky-600',
    Reported: 'bg-nexoraCanvas text-nexoraMuted',
    Cancelled: 'bg-nexoraCanvas text-nexoraMuted',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[status] ?? 'bg-nexoraCanvas text-nexoraMuted'}`}>
      {t(`taxiq.payrollRuns.status.${status}`)}
    </span>
  )
}

function primaryActionKey(status: string): 'finalize' | 'review' | 'report' | null {
  if (status === 'ValidationFailed' || status === 'Approved') return 'finalize'
  if (status === 'ReviewRequired') return 'review'
  if (status === 'LedgerPosted') return 'report'
  return null
}

export default function PayrollRunsView({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [finalizeTarget, setFinalizeTarget] = useState<PayrollRun | null>(null)
  const [correctionOf, setCorrectionOf] = useState<PayrollRun | null>(null)

  const employersQuery = useTaxiqEmployers(businessId)
  const employer = employersQuery.data?.items?.[0]

  const runsQuery = usePayrollRuns(businessId, {
    employerId: employer?.id,
    status: status || undefined,
    pageNumber,
    pageSize: PAGE_SIZE,
  })

  const data = runsQuery.data
  const rows = data?.items ?? []

  const handleRowAction = (row: PayrollRun) => {
    const action = primaryActionKey(row.status)
    if (action === 'finalize') {
      setFinalizeTarget(row)
    } else if (action === 'review') {
      setDetailId(row.id)
    } else if (action === 'report') {
      setDetailId(row.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.payrollRuns.title')}</h1>
          <p className="text-xs font-medium text-nexoraMuted">{t('taxiq.payrollRuns.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={!employer}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {t('taxiq.payrollRuns.createButton')}
        </button>
      </div>

      {!employersQuery.isPending && !employer && (
        <div className="nexora-card p-4 text-xs font-semibold text-amber-700">{t('taxiq.payrollRuns.noEmployer')}</div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.payrollRuns.filters.status')}</label>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPageNumber(1)
          }}
          className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs"
        >
          <option value="">{t('taxiq.payrollRuns.filters.allStatuses')}</option>
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {t(`taxiq.payrollRuns.status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {runsQuery.isPending ? (
        <div className="nexora-card p-6">
          <SkeletonList count={3} lines={2} />
        </div>
      ) : rows.length === 0 ? (
        <div className="nexora-card flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.payrollRuns.emptyState')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
              <tr>
                <th className="px-4 py-3">{t('taxiq.payrollRuns.columns.runCode')}</th>
                <th className="px-4 py-3">{t('taxiq.payrollRuns.columns.period')}</th>
                <th className="px-4 py-3">{t('taxiq.payrollRuns.columns.payDate')}</th>
                <th className="px-4 py-3">{t('taxiq.payrollRuns.columns.depositDue')}</th>
                <th className="px-4 py-3">{t('taxiq.payrollRuns.columns.employees')}</th>
                <th className="px-4 py-3">{t('taxiq.payrollRuns.columns.gross')}</th>
                <th className="px-4 py-3">{t('taxiq.payrollRuns.columns.tax')}</th>
                <th className="px-4 py-3">{t('taxiq.payrollRuns.columns.status')}</th>
                <th className="px-4 py-3">{t('taxiq.payrollRuns.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const action = primaryActionKey(row.status)
                return (
                  <tr key={row.id} className="border-t border-nexoraRule align-top">
                    <td className="px-4 py-3 font-bold text-nexoraText">{row.runCode}</td>
                    <td className="px-4 py-3 text-nexoraText">
                      {row.periodStart} – {row.periodEnd}
                    </td>
                    <td className="px-4 py-3 text-nexoraText">{row.payDate}</td>
                    <td className="px-4 py-3 text-nexoraText">{row.depositDue}</td>
                    <td className="px-4 py-3 text-nexoraText">{row.employeeCount}</td>
                    <td className="px-4 py-3 text-nexoraText">{formatCurrency(row.totalGross)}</td>
                    <td className="px-4 py-3 text-nexoraText">{formatCurrency(row.totalEmployeeTax + row.totalEmployerTax)}</td>
                    <td className="px-4 py-3">
                      <PayrollRunStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        {action && (
                          <button
                            type="button"
                            onClick={() => handleRowAction(row)}
                            className="text-[11px] font-bold text-nexoraBrand hover:underline"
                          >
                            {t(`taxiq.payrollRuns.${action}Button`)}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDetailId(row.id)}
                          className="text-[11px] font-bold text-nexoraMuted hover:underline"
                        >
                          {t('taxiq.payrollRuns.viewButton')}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-nexoraRule px-4 py-3">
            <span className="text-[11px] text-nexoraMuted">
              {t('taxiq.payrollRuns.pageSummary', {
                page: data?.pageNumber ?? 1,
                totalPages: Math.max(data?.totalPages ?? 1, 1),
                totalCount: data?.totalCount ?? 0,
              })}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={!data?.hasPreviousPage}
                className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-40"
              >
                {t('taxiq.payrollRuns.previousPage')}
              </button>
              <button
                type="button"
                onClick={() => setPageNumber((p) => p + 1)}
                disabled={!data?.hasNextPage}
                className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-40"
              >
                {t('taxiq.payrollRuns.nextPage')}
              </button>
            </div>
          </div>
        </div>
      )}

      {(createOpen || correctionOf) && employer && (
        <CreatePayrollRunModal
          businessId={businessId}
          employerId={employer.id}
          correctionOf={correctionOf ?? undefined}
          onClose={() => {
            setCreateOpen(false)
            setCorrectionOf(null)
          }}
          onCreated={(id) => {
            setCreateOpen(false)
            setCorrectionOf(null)
            setDetailId(id)
          }}
        />
      )}

      {detailId && (
        <PayrollRunDetailModal
          businessId={businessId}
          payrollRunId={detailId}
          onClose={() => setDetailId(null)}
          onFinalize={(run) => setFinalizeTarget(run)}
          onCreateCorrection={(run) => setCorrectionOf(run)}
          onOpenRun={(id) => setDetailId(id)}
        />
      )}

      {finalizeTarget && (
        <FinalizePayrollRunModal
          businessId={businessId}
          run={finalizeTarget}
          onClose={() => setFinalizeTarget(null)}
        />
      )}
    </div>
  )
}
