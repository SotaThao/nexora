import { X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useWeeklyPayrollDailyDetail } from '../../../../../data/hooks/useWeeklyPayroll'
import { SkeletonList } from '../../../../ui/skeleton'
import { formatCurrency } from '../../../utils'

interface Props {
  businessStaffLinkId: string
  displayName: string
  weekStart?: string
  onClose: () => void
}

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(d)
}

export default function WeeklyPayrollDailyDetailModal({ businessStaffLinkId, displayName, weekStart, onClose }: Props) {
  const { t } = useTranslation()
  const detailQuery = useWeeklyPayrollDailyDetail(businessStaffLinkId, weekStart)
  const data = detailQuery.data

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.weeklyPayroll.dailyDetailModal.title', { name: displayName })}</h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        {detailQuery.isPending ? (
          <SkeletonList count={4} lines={2} />
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto">
            <div className="overflow-x-auto rounded-xl border border-nexoraBorder">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                  <tr>
                    <th className="px-3 py-2">{t('taxiq.weeklyPayroll.dailyDetailModal.columns.date')}</th>
                    <th className="px-3 py-2">{t('taxiq.weeklyPayroll.dailyDetailModal.columns.services')}</th>
                    <th className="px-3 py-2">{t('taxiq.weeklyPayroll.dailyDetailModal.columns.hours')}</th>
                    <th className="px-3 py-2">{t('taxiq.weeklyPayroll.dailyDetailModal.columns.sales')}</th>
                    <th className="px-3 py-2">{t('taxiq.weeklyPayroll.dailyDetailModal.columns.tips')}</th>
                    <th className="px-3 py-2">{t('taxiq.weeklyPayroll.dailyDetailModal.columns.discountBorne')}</th>
                    <th className="px-3 py-2">{t('taxiq.weeklyPayroll.dailyDetailModal.columns.estimatedPay')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.days.map((day) => (
                    <tr key={day.date} className="border-t border-nexoraRule">
                      <td className="px-3 py-2 font-bold text-nexoraText">{formatDate(day.date)}</td>
                      <td className="px-3 py-2 text-nexoraText">{day.services.length > 0 ? day.services.join(' · ') : '—'}</td>
                      <td className="px-3 py-2 text-nexoraText">{day.hours.toFixed(1)}h</td>
                      <td className="px-3 py-2 text-nexoraText">{formatCurrency(day.sales)}</td>
                      <td className="px-3 py-2 text-nexoraText">{formatCurrency(day.tips)}</td>
                      {/* Which service caused the deduction and why, so the technician can check it
                          the same week instead of arguing at payday. */}
                      <td className="px-3 py-2 text-nexoraText">
                        {day.discountBorne > 0 ? (
                          <>
                            <span className="font-bold text-amber-700">-{formatCurrency(day.discountBorne)}</span>
                            <ul className="mt-0.5 space-y-0.5 text-[10px] text-nexoraMuted">
                              {day.discountDetails.map((detail, index) => (
                                <li key={`${day.date}-${detail.serviceName}-${index}`}>
                                  {detail.serviceName} {formatCurrency(detail.amount)}
                                  {detail.note ? ` — ${detail.note}` : ''}
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2 text-nexoraText">~{formatCurrency(day.estimatedPay)}</td>
                    </tr>
                  ))}
                  {data && (
                    <tr className="border-t border-nexoraRule bg-nexoraCanvas font-bold">
                      <td className="px-3 py-2 text-nexoraText" colSpan={2}>{t('taxiq.weeklyPayroll.dailyDetailModal.weekTotal')}</td>
                      <td className="px-3 py-2 text-nexoraText">{data.totalHours.toFixed(1)}h</td>
                      <td className="px-3 py-2 text-nexoraText">{formatCurrency(data.totalSales)}</td>
                      <td className="px-3 py-2 text-nexoraText">{formatCurrency(data.totalTips)}</td>
                      <td className="px-3 py-2 text-nexoraText">
                        {data.totalDiscountBorne > 0 ? `-${formatCurrency(data.totalDiscountBorne)}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-nexoraText">{formatCurrency(data.totalEstimatedPay)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-nexoraMuted">{t('taxiq.weeklyPayroll.dailyDetailModal.estimateHint')}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
