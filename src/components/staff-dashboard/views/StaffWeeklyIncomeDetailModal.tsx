import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { useTranslation } from '../../../contexts/LanguageContext'

export type StaffWeeklyIncomeDetailRow = {
  date: string
  amount: number
  tips: number
}

export type StaffWeeklyIncomeDetailTotals = {
  amount: number
  tips: number
  discount: number
  commission: number
  cashCollected: number
}

type Props = {
  periodLabel: string
  rows: StaffWeeklyIncomeDetailRow[]
  totals: StaffWeeklyIncomeDetailTotals
  currencyFormatter: Intl.NumberFormat
  onClose: () => void
}

export default function StaffWeeklyIncomeDetailModal({
  periodLabel,
  rows,
  totals,
  currencyFormatter,
  onClose,
}: Props) {
  const { t, currentLanguage } = useTranslation()

  const dayFormatter = new Intl.DateTimeFormat(currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const formatDay = (isoDate: string) => dayFormatter.format(new Date(`${isoDate}T12:00:00`))

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="pos-service-income-lines-card max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-weekly-income-detail-title"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-nexoraBorder px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {periodLabel}
            </p>
            <h2
              id="staff-weekly-income-detail-title"
              className="break-words text-base font-extrabold text-nexoraText"
            >
              {t('staff_salon_report.detail.weeklyTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('staff_salon_report.detail.close')}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder text-nexoraText transition hover:border-nexoraBrand"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-left text-xs" aria-label={t('staff_salon_report.detail.weeklyTitle')}>
              <thead className="sticky top-0 z-[1] bg-nexoraCanvas/95">
                <tr className="border-b border-nexoraBorder text-[10px] uppercase tracking-wide text-nexoraMuted">
                  <th className="px-3 py-2.5">{t('staff_salon_report.detail.day')}</th>
                  <th className="px-3 py-2.5 text-right">{t('staff_salon_report.detail.amount')}</th>
                  <th className="px-3 py-2.5 text-right">{t('staff_salon_report.detail.tips')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.date} className="border-b border-nexoraBorder/70 last:border-b-0">
                    <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-nexoraText">
                      {formatDay(row.date)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-nexoraText">
                      {currencyFormatter.format(row.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-nexoraText">
                      {currencyFormatter.format(row.tips)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="shrink-0 space-y-1 border-t border-nexoraBorder bg-nexoraCanvas/50 px-4 py-3 text-xs">
          <div className="flex items-center justify-between font-extrabold text-nexoraText">
            <span>{t('staff_salon_report.detail.totalAmount')}</span>
            <span className="tabular-nums">{currencyFormatter.format(totals.amount)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold text-nexoraMuted">
            <span>{t('staff_salon_report.detail.totalTips')}</span>
            <span className="tabular-nums">{currencyFormatter.format(totals.tips)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold text-nexoraMuted">
            <span>{t('staff_salon_report.detail.totalDiscount')}</span>
            <span className="tabular-nums">{currencyFormatter.format(totals.discount)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold text-nexoraMuted">
            <span>{t('staff_salon_report.detail.totalCommission')}</span>
            <span className="tabular-nums">{currencyFormatter.format(totals.commission)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-nexoraBorder pt-1.5 font-extrabold text-nexoraBrandDark">
            <span>{t('staff_salon_report.detail.cashCollected')}</span>
            <span className="tabular-nums">{currencyFormatter.format(totals.cashCollected)}</span>
          </div>
        </footer>
      </section>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}
