import { useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useWeeklyPayroll } from '../../../../data/hooks/useWeeklyPayroll'
import weeklyPayrollRepository from '../../../../data/repositories/weeklyPayroll'
import { SkeletonList } from '../../../ui/skeleton'
import { formatCurrency } from '../../utils'
import WeeklyPayrollPayModal from './modals/WeeklyPayrollPayModal'
import WeeklyPayrollPayAllModal from './modals/WeeklyPayrollPayAllModal'
import WeeklyPayrollDailyDetailModal from './modals/WeeklyPayrollDailyDetailModal'

function shiftWeek(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatWeekDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(d)
}

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const styles: Record<string, string> = {
    Ready: 'bg-emerald-50 text-emerald-600',
    Paid: 'bg-nexoraCanvas text-nexoraMuted',
    Review: 'bg-amber-50 text-amber-600',
    PayrollTax: 'bg-sky-50 text-sky-600',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[status] ?? 'bg-nexoraCanvas text-nexoraMuted'}`}>
      {t(`taxiq.weeklyPayroll.status.${status}`)}
    </span>
  )
}

export default function WeeklyPayrollView({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [weekStart, setWeekStart] = useState<string | undefined>(undefined)
  const payrollQuery = useWeeklyPayroll(businessId, weekStart)
  const [payTarget, setPayTarget] = useState<{ businessStaffLinkId: string; displayName: string; amount: number; canOverride: boolean } | null>(null)
  const [payAllOpen, setPayAllOpen] = useState(false)
  const [dailyDetailTarget, setDailyDetailTarget] = useState<{ businessStaffLinkId: string; displayName: string } | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const data = payrollQuery.data
  const rows = data?.staff ?? []
  const readyTotal = rows.filter((r) => r.status === 'Ready').reduce((sum, r) => sum + r.hourlyPay + r.commission + r.bonus, 0)

  const handleExportCsv = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const blob = await weeklyPayrollRepository.exportCsv(data?.weekStart)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `weekly-payroll-${data?.weekStart}-${data?.weekEnd}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast(t('taxiq.weeklyPayroll.errors.generic'), 'error')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.weeklyPayroll.title')}</h1>
          <p className="text-xs font-medium text-nexoraMuted">{t('taxiq.weeklyPayroll.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart(shiftWeek(data?.weekStart ?? new Date().toISOString().slice(0, 10), -7))}
            disabled={payrollQuery.isPending}
            className="nexora-icon-button"
            aria-label={t('taxiq.weeklyPayroll.prevWeek')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[180px] text-center text-xs font-bold text-nexoraText">
            {data ? t('taxiq.weeklyPayroll.weekLabel', { start: formatWeekDate(data.weekStart), end: formatWeekDate(data.weekEnd) }) : '—'}
          </span>
          <button
            type="button"
            onClick={() => setWeekStart(shiftWeek(data?.weekStart ?? new Date().toISOString().slice(0, 10), 7))}
            disabled={payrollQuery.isPending}
            className="nexora-icon-button"
            aria-label={t('taxiq.weeklyPayroll.nextWeek')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {weekStart && (
            <button type="button" onClick={() => setWeekStart(undefined)} className="text-[11px] font-bold text-nexoraBrand hover:underline">
              {t('taxiq.weeklyPayroll.thisWeek')}
            </button>
          )}
        </div>
      </div>

      {payrollQuery.isPending ? (
        <div className="nexora-card p-6">
          <SkeletonList count={3} lines={2} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t('taxiq.weeklyPayroll.metrics.totalWeeklyPay'), value: data?.totalWeeklyPay ?? 0 },
              { label: t('taxiq.weeklyPayroll.metrics.totalSales'), value: data?.totalSales ?? 0 },
              { label: t('taxiq.weeklyPayroll.metrics.totalTips'), value: data?.totalTips ?? 0 },
              { label: t('taxiq.weeklyPayroll.metrics.totalBonus'), value: data?.totalBonus ?? 0 },
            ].map((m) => (
              <div key={m.label} className="nexora-card p-4">
                <div className="text-[10px] font-extrabold uppercase text-nexoraMuted">{m.label}</div>
                <div className="mt-1 text-lg font-extrabold text-nexoraText">{formatCurrency(m.value)}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting || rows.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:opacity-60"
            >
              {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {t('taxiq.weeklyPayroll.exportCsvButton')}
            </button>
            <button
              type="button"
              onClick={() => setPayAllOpen(true)}
              disabled={readyTotal <= 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {t('taxiq.weeklyPayroll.payAllButton', { amount: formatCurrency(readyTotal) })}
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="nexora-card flex flex-col items-center gap-3 p-10 text-center">
              <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.weeklyPayroll.emptyState')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
              <table className="w-full min-w-[1000px] text-left text-xs">
                <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                  <tr>
                    <th className="px-4 py-3">{t('taxiq.weeklyPayroll.columns.employee')}</th>
                    <th className="px-4 py-3">{t('taxiq.weeklyPayroll.columns.type')}</th>
                    <th className="px-4 py-3">{t('taxiq.weeklyPayroll.columns.hours')}</th>
                    <th className="px-4 py-3">{t('taxiq.weeklyPayroll.columns.sales')}</th>
                    <th className="px-4 py-3">{t('taxiq.weeklyPayroll.columns.hourlyPay')}</th>
                    <th className="px-4 py-3">{t('taxiq.weeklyPayroll.columns.commission')}</th>
                    <th className="px-4 py-3">{t('taxiq.weeklyPayroll.columns.bonus')}</th>
                    <th className="px-4 py-3">{t('taxiq.weeklyPayroll.columns.tips')}</th>
                    <th className="px-4 py-3">{t('taxiq.weeklyPayroll.columns.discountBorne')}</th>
                    <th className="px-4 py-3">{t('taxiq.weeklyPayroll.columns.takeHome')}</th>
                    <th className="px-4 py-3">{t('taxiq.weeklyPayroll.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.businessStaffLinkId} className="border-t border-nexoraRule align-top">
                      <td className="px-4 py-3">
                        <div className="font-bold text-nexoraText">{row.displayName}</div>
                        <div className="text-[10px] text-nexoraMuted">{t(`taxiq.payEngine.payFormulas.${row.payStructureType}`)}</div>
                        <div className="mt-1"><StatusBadge status={row.status} t={t} /></div>
                      </td>
                      <td className="px-4 py-3 text-nexoraText">
                        {row.contractType ? t(`taxiq.payoutCenter.contractTypes.${row.contractType}`) : '—'}
                      </td>
                      <td className="px-4 py-3 text-nexoraText">{row.hours.toFixed(1)}h</td>
                      <td className="px-4 py-3 text-nexoraText">{formatCurrency(row.sales)}</td>
                      <td className="px-4 py-3 text-nexoraText">{formatCurrency(row.hourlyPay)}</td>
                      <td className="px-4 py-3 text-nexoraText">{formatCurrency(row.commission)}</td>
                      <td className="px-4 py-3 text-nexoraText">
                        {row.bonus > 0 ? `+${formatCurrency(row.bonus)}` : t('taxiq.weeklyPayroll.noBonus')}
                      </td>
                      <td className="px-4 py-3 text-nexoraText">{formatCurrency(row.tips)}</td>
                      <td className="px-4 py-3 text-nexoraText">
                        {row.discountBorne > 0 ? (
                          <span className="font-bold text-amber-700">-{formatCurrency(row.discountBorne)}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-nexoraText">{formatCurrency(row.takeHome)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          {(row.canPay || row.canOverride) && (
                            <button
                              type="button"
                              onClick={() =>
                                setPayTarget({
                                  businessStaffLinkId: row.businessStaffLinkId,
                                  displayName: row.displayName,
                                  amount: row.hourlyPay + row.commission + row.bonus,
                                  canOverride: row.canOverride,
                                })
                              }
                              className="text-[11px] font-bold text-nexoraBrand hover:underline"
                            >
                              {t('taxiq.weeklyPayroll.payButton')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDailyDetailTarget({ businessStaffLinkId: row.businessStaffLinkId, displayName: row.displayName })}
                            className="text-[11px] font-bold text-nexoraMuted hover:underline"
                          >
                            {t('taxiq.weeklyPayroll.dailyDetailButton')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {payTarget && (
        <WeeklyPayrollPayModal
          businessId={businessId}
          businessStaffLinkId={payTarget.businessStaffLinkId}
          displayName={payTarget.displayName}
          amount={payTarget.amount}
          canOverride={payTarget.canOverride}
          weekStart={data?.weekStart}
          onClose={() => setPayTarget(null)}
        />
      )}

      {payAllOpen && (
        <WeeklyPayrollPayAllModal
          businessId={businessId}
          amount={readyTotal}
          weekStart={data?.weekStart}
          onClose={() => setPayAllOpen(false)}
        />
      )}

      {dailyDetailTarget && (
        <WeeklyPayrollDailyDetailModal
          businessStaffLinkId={dailyDetailTarget.businessStaffLinkId}
          displayName={dailyDetailTarget.displayName}
          weekStart={data?.weekStart}
          onClose={() => setDailyDetailTarget(null)}
        />
      )}
    </div>
  )
}
