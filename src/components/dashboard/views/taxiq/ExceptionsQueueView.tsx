import { useState } from 'react'
import { Loader2, ScanLine } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useTaxiqEmployers } from '../../../../data/hooks/useTaxiqEmployer'
import { useExceptions, useScanExceptions } from '../../../../data/hooks/useExceptions'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SkeletonList } from '../../../ui/skeleton'
import ExceptionDetailModal from './modals/ExceptionDetailModal'

const PAGE_SIZE = 20
const STATUSES = ['Open', 'Reviewing', 'Closed']
const SEVERITIES = ['Low', 'Medium', 'High']
const OWNER_TEAMS = ['Payroll', 'Hr', 'Tax']

export default function ExceptionsQueueView({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [status, setStatus] = useState('')
  const [severity, setSeverity] = useState('')
  const [owner, setOwner] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null)

  const employersQuery = useTaxiqEmployers(businessId)
  const employer = employersQuery.data?.items?.[0]

  const scanExceptions = useScanExceptions(businessId)

  const exceptionsQuery = useExceptions(businessId, {
    employerId: employer?.id,
    status: status || undefined,
    severity: severity || undefined,
    owner: owner || undefined,
    pageNumber,
    pageSize: PAGE_SIZE,
  })

  const data = exceptionsQuery.data
  const rows = data?.items ?? []

  const resetToFirstPage = () => setPageNumber(1)

  const handleScan = async () => {
    if (!employer?.id || scanExceptions.isPending) return
    try {
      const result = await scanExceptions.mutateAsync(employer.id)
      showToast(t('taxiq.exceptions.scanResult', { created: result.created, updated: result.updated }), 'success')
    } catch (err) {
      const fallback = t('taxiq.exceptions.errors.generic')
      let message = fallback
      if (isApiError(err)) {
        const i18nKey = getErrorI18nKey(err.errorCode)
        const translated = t(i18nKey)
        message = translated !== i18nKey ? translated : (err.message || fallback)
      }
      showToast(message, 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.exceptions.title')}</h1>
          <p className="text-xs font-medium text-nexoraMuted">{t('taxiq.exceptions.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={handleScan}
          disabled={!employer?.id || scanExceptions.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {scanExceptions.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanLine className="h-3.5 w-3.5" />}
          {t('taxiq.exceptions.scanButton')}
        </button>
      </div>

      {!employersQuery.isPending && !employer && (
        <div className="nexora-card p-4 text-xs font-semibold text-amber-700">{t('taxiq.exceptions.noEmployer')}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.exceptions.filters.status')}</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              resetToFirstPage()
            }}
            className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs"
          >
            <option value="">{t('taxiq.exceptions.filters.all')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`taxiq.exceptions.status.${s}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.exceptions.filters.severity')}</label>
          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value)
              resetToFirstPage()
            }}
            className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs"
          >
            <option value="">{t('taxiq.exceptions.filters.all')}</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {t(`taxiq.exceptions.severity.${s}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.exceptions.filters.owner')}</label>
          <select
            value={owner}
            onChange={(e) => {
              setOwner(e.target.value)
              resetToFirstPage()
            }}
            className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs"
          >
            <option value="">{t('taxiq.exceptions.filters.all')}</option>
            {OWNER_TEAMS.map((o) => (
              <option key={o} value={o}>
                {t(`taxiq.exceptions.ownerTeam.${o}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {exceptionsQuery.isPending ? (
        <div className="nexora-card p-6">
          <SkeletonList count={4} lines={2} />
        </div>
      ) : rows.length === 0 ? (
        <div className="nexora-card flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.exceptions.emptyState')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
          <table className="w-full min-w-[800px] text-left text-xs">
            <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
              <tr>
                <th className="px-3 py-2">{t('taxiq.exceptions.columns.type')}</th>
                <th className="px-3 py-2">{t('taxiq.exceptions.columns.severity')}</th>
                <th className="px-3 py-2">{t('taxiq.exceptions.columns.owner')}</th>
                <th className="px-3 py-2">{t('taxiq.exceptions.columns.status')}</th>
                <th className="px-3 py-2">{t('taxiq.exceptions.columns.period')}</th>
                <th className="px-3 py-2">{t('taxiq.exceptions.columns.members')}</th>
                <th className="px-3 py-2">{t('taxiq.exceptions.columns.action')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-nexoraRule align-top">
                  <td className="px-3 py-2 font-bold text-nexoraText">{t(`taxiq.exceptions.types.${row.type}`)}</td>
                  <td className="px-3 py-2 text-nexoraText">{t(`taxiq.exceptions.severity.${row.severity}`)}</td>
                  <td className="px-3 py-2 text-nexoraText">{t(`taxiq.exceptions.ownerTeam.${row.owner}`)}</td>
                  <td className="px-3 py-2 text-nexoraText">{t(`taxiq.exceptions.status.${row.status}`)}</td>
                  <td className="px-3 py-2 text-nexoraText">{row.periodLabel}</td>
                  <td className="px-3 py-2 text-nexoraText">{row.memberCount}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setSelectedExceptionId(row.id)}
                      className="text-[11px] font-bold text-nexoraBrand hover:underline"
                    >
                      {t('taxiq.exceptions.viewButton')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-nexoraRule px-4 py-3">
            <span className="text-[11px] text-nexoraMuted">
              {t('taxiq.exceptions.pageSummary', {
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
                {t('taxiq.exceptions.previousPage')}
              </button>
              <button
                type="button"
                onClick={() => setPageNumber((p) => p + 1)}
                disabled={!data?.hasNextPage}
                className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-40"
              >
                {t('taxiq.exceptions.nextPage')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ExceptionDetailModal
        open={!!selectedExceptionId}
        onClose={() => setSelectedExceptionId(null)}
        businessId={businessId}
        exceptionId={selectedExceptionId}
      />
    </div>
  )
}
