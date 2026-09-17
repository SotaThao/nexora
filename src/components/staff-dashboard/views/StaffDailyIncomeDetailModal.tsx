import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffIncomeReportTickets } from '../../../data/hooks/useStaffIncomeReportTickets'
import PosTechnicianReportPrintDocument from '../../dashboard/views/pos/receipt/PosTechnicianReportPrintDocument'
import { buildStaffDailyIncomeReceipt } from './buildStaffDailyIncomeReceipt'

type Props = {
  businessId: string
  date: string
  name: string
  periodLabel: string
  currencyFormatter: Intl.NumberFormat
  onClose: () => void
}

export default function StaffDailyIncomeDetailModal({
  businessId,
  date,
  name,
  periodLabel,
  currencyFormatter,
  onClose,
}: Props) {
  const { t, currentLanguage } = useTranslation()
  const ticketsQuery = useStaffIncomeReportTickets({ businessId, date })

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="pos-service-income-lines-card max-w-md"
        role="dialog"
        aria-modal="true"
        aria-label={t('staff_salon_report.detail.dailyTitle')}
      >
        <header className="flex shrink-0 items-center justify-end border-b border-nexoraBorder px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            aria-label={t('staff_salon_report.detail.close')}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder text-nexoraText transition hover:border-nexoraBrand"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4">
          {ticketsQuery.isPending ? (
            <div role="status" className="px-4 py-8 text-center text-sm font-bold text-nexoraMuted">
              {t('staff_salon_report.loading')}
            </div>
          ) : ticketsQuery.isError ? (
            <div role="alert" className="px-4 py-8 text-center">
              <p className="text-sm font-bold text-nexoraDanger">
                {t('staff_salon_report.detail.loadError')}
              </p>
              <button
                type="button"
                onClick={() => void ticketsQuery.refetch()}
                className="mt-3 h-10 rounded-lg bg-nexoraBrand px-4 text-xs font-semibold text-white transition hover:bg-nexoraBrandDark"
              >
                {t('staff_salon_report.detail.retry')}
              </button>
            </div>
          ) : (
            <PosTechnicianReportPrintDocument
              report={buildStaffDailyIncomeReceipt(
                ticketsQuery.data,
                name,
                periodLabel,
                currencyFormatter,
                currentLanguage,
                t,
              )}
            />
          )}
        </div>
      </section>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}
