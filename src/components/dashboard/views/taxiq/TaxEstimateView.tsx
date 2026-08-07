import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  useDepositScheduleAlerts,
  useExportDepositScheduleCsv,
  useTaxEstimate,
  useTaxReadinessChecklist,
} from '../../../../data/hooks/useTaxiqTaxEstimate'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SkeletonList } from '../../../ui/skeleton'
import TaxRiskBadge from './shared/TaxRiskBadge'
import TaxReadinessBadge from './shared/TaxReadinessBadge'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// dueDate/nextDue are date-only or date-time ISO strings — format from the string parts
// directly rather than through `new Date(...).toLocaleDateString()`, which can shift the
// displayed day backward in timezones behind UTC for a date-only value (see
// feedback_frontend_datetime_timezone_naive).
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function formatDateOnly(iso: string) {
  const datePart = iso.split('T')[0]
  const [year, month, day] = datePart.split('-').map(Number)
  return `${MONTH_LABELS[month - 1]} ${day}, ${year}`
}

export default function TaxEstimateView({ ownerTaxYearId }: { ownerTaxYearId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { showToast } = useNotification()

  const [selectedQuarter, setSelectedQuarter] = useState<number | undefined>(undefined)

  const estimateQuery = useTaxEstimate(ownerTaxYearId, selectedQuarter)
  const alertsQuery = useDepositScheduleAlerts(ownerTaxYearId)
  const checklistQuery = useTaxReadinessChecklist(ownerTaxYearId)
  const exportCsv = useExportDepositScheduleCsv()

  const estimate = estimateQuery.data
  const quarters = estimate?.quarters ?? []
  const activeQuarter = selectedQuarter ?? estimate?.selectedQuarter
  const alerts = alertsQuery.data ?? []
  const checklistGroups = checklistQuery.data?.groups ?? []

  const byJurisdictionSorted = useMemo(
    () => [...(estimate?.byJurisdiction ?? [])].sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction)),
    [estimate?.byJurisdiction],
  )

  function handleError(err: unknown) {
    const fallback = t('taxiq.taxEstimate.errors.generic')
    const message = isApiError(err)
      ? (() => {
          const i18nKey = getErrorI18nKey(err.errorCode)
          const translated = t(i18nKey)
          return translated !== i18nKey ? translated : (err.message || fallback)
        })()
      : fallback
    showToast(message, 'error')
  }

  function handleExportCsv() {
    exportCsv.mutate(ownerTaxYearId, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'deposit-schedule.csv'
        a.click()
        URL.revokeObjectURL(url)
      },
      onError: handleError,
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.taxEstimate.title')}</h2>
        <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.taxEstimate.subtitle')}</p>
      </div>

      {estimateQuery.isPending ? (
        <SkeletonList count={4} lines={2} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quarters.map((q) => (
            <button
              key={q.quarter}
              type="button"
              onClick={() => setSelectedQuarter(q.quarter)}
              className={`rounded-xl border p-4 text-left transition ${
                activeQuarter === q.quarter
                  ? 'border-nexoraBrand bg-nexoraBrand/5'
                  : 'border-nexoraBorder bg-white hover:border-nexoraBrand/40'
              }`}
            >
              <p className="text-xs font-extrabold text-nexoraText">{t('taxiq.taxEstimate.quarterLabel', { quarter: q.quarter })}</p>
              <p className="mt-0.5 text-[11px] text-nexoraMuted">
                {t('taxiq.taxEstimate.dueLabel')}: {formatDateOnly(q.dueDate)}
              </p>
              <div className="mt-3 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-nexoraMuted">{t('taxiq.taxEstimate.columns.estTax')}</span>
                  <span className="font-bold text-nexoraText">{formatCurrency(q.estTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-nexoraMuted">{t('taxiq.taxEstimate.columns.withheld')}</span>
                  <span className="font-bold text-nexoraText">{formatCurrency(q.withheld)}</span>
                </div>
                <div className="flex justify-between border-t border-nexoraRule pt-1">
                  <span className="text-nexoraMuted">{t('taxiq.taxEstimate.columns.balance')}</span>
                  <span className={`font-bold ${q.balance > 0 ? 'text-rose-600' : 'text-nexoraText'}`}>{formatCurrency(q.balance)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-nexoraBorder bg-white p-4">
        <h3 className="text-sm font-extrabold text-nexoraText">{t('taxiq.taxEstimate.byJurisdictionTitle')}</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-xs">
            <thead className="text-[10px] font-extrabold uppercase text-nexoraMuted">
              <tr>
                <th className="py-2 pr-4">{t('taxiq.taxEstimate.columns.jurisdiction')}</th>
                <th className="py-2 pr-4">{t('taxiq.taxEstimate.columns.estTax')}</th>
                <th className="py-2 pr-4">{t('taxiq.taxEstimate.columns.deposited')}</th>
                <th className="py-2 pr-4">{t('taxiq.taxEstimate.columns.balance')}</th>
                <th className="py-2 pr-4">{t('taxiq.taxEstimate.columns.risk')}</th>
              </tr>
            </thead>
            <tbody>
              {estimateQuery.isPending ? (
                <tr>
                  <td colSpan={5} className="py-4">
                    <SkeletonList count={2} lines={1} />
                  </td>
                </tr>
              ) : byJurisdictionSorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-nexoraMuted">{t('taxiq.taxEstimate.empty')}</td>
                </tr>
              ) : (
                byJurisdictionSorted.map((line) => (
                  <tr key={line.jurisdiction} className="border-t border-nexoraRule">
                    <td className="py-2 pr-4 font-bold text-nexoraText">{line.jurisdiction}</td>
                    <td className="py-2 pr-4 text-nexoraText">{formatCurrency(line.estTax)}</td>
                    <td className="py-2 pr-4 text-nexoraText">{formatCurrency(line.deposited)}</td>
                    <td className="py-2 pr-4 text-nexoraText">{formatCurrency(line.balance)}</td>
                    <td className="py-2 pr-4">
                      <TaxRiskBadge riskLevel={line.riskLevel} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-nexoraBorder bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-extrabold text-nexoraText">{t('taxiq.taxEstimate.depositScheduleTitle')}</h3>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exportCsv.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs font-bold text-nexoraText disabled:opacity-60"
          >
            {exportCsv.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {t('taxiq.taxEstimate.exportCsv')}
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-xs">
            <thead className="text-[10px] font-extrabold uppercase text-nexoraMuted">
              <tr>
                <th className="py-2 pr-4">{t('taxiq.taxEstimate.columns.jurisdiction')}</th>
                <th className="py-2 pr-4">{t('taxiq.taxEstimate.columns.nextDue')}</th>
                <th className="py-2 pr-4">{t('taxiq.taxEstimate.columns.depositSchedule')}</th>
                <th className="py-2 pr-4">{t('taxiq.taxEstimate.columns.daysUntilDue')}</th>
                <th className="py-2 pr-4">{t('taxiq.taxEstimate.columns.risk')}</th>
              </tr>
            </thead>
            <tbody>
              {alertsQuery.isPending ? (
                <tr>
                  <td colSpan={5} className="py-4">
                    <SkeletonList count={2} lines={1} />
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-nexoraMuted">{t('taxiq.taxEstimate.empty')}</td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.jurisdiction} className="border-t border-nexoraRule">
                    <td className="py-2 pr-4 font-bold text-nexoraText">{alert.jurisdiction}</td>
                    <td className="py-2 pr-4 text-nexoraText">{alert.nextDue ? formatDateOnly(alert.nextDue) : '—'}</td>
                    <td className="py-2 pr-4 text-nexoraText">{alert.depositSchedule}</td>
                    <td className="py-2 pr-4 text-nexoraText">{alert.daysUntilDue ?? '—'}</td>
                    <td className="py-2 pr-4">
                      <TaxRiskBadge riskLevel={alert.riskLevel} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-nexoraBorder bg-white p-4">
        <h3 className="text-sm font-extrabold text-nexoraText">{t('taxiq.taxEstimate.readinessTitle')}</h3>
        {checklistQuery.isPending ? (
          <div className="mt-3">
            <SkeletonList count={3} lines={1} />
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {checklistGroups.map((group) => (
              <div key={group.groupName} className="flex items-center justify-between gap-2 rounded-lg border border-nexoraBorder px-3 py-2">
                <span className="text-xs font-semibold text-nexoraText">{t(`taxiq.taxEstimate.readinessGroup.${group.groupName}`)}</span>
                <TaxReadinessBadge status={group.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq/cpa-access')}
          className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText"
        >
          {t('taxiq.taxEstimate.connectCpa')}
        </button>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq/employers')}
          className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText"
        >
          {t('taxiq.taxEstimate.updateWithholding')}
        </button>
      </div>
    </div>
  )
}
