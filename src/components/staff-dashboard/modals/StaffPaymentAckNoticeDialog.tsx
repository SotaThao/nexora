import { Bell, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency, formatTransactionDateTime } from '../../dashboard/utils'
import type { StaffPaymentRecord } from '../../../types/domain'
import { DirectPaymentStatusBadge } from '../../dashboard/direct-payments/DirectPaymentStatusBadge'
import { normalizePaymentStatusValue } from '../../../utils/directPaymentStatus'

export default function StaffPaymentAckNoticeDialog({
  payment,
  pendingCount = 1,
  onViewDetail,
  onClose,
}: {
  payment: StaffPaymentRecord
  pendingCount?: number
  onViewDetail: () => void
  onClose: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  const paymentStatus = normalizePaymentStatusValue(payment.status)

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/55 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-labelledby="staff-payment-ack-notice-title"
        className="relative w-full max-w-md rounded-2xl border border-nexoraBorder bg-white p-5 shadow-2xl sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-nexoraMuted transition hover:bg-slate-100 hover:text-nexoraText"
          aria-label={t('common.close')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="staff-payment-ack-notice-title" className="text-base font-extrabold text-nexoraText">
              {t('staff_payments.ack_notice_title')}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-nexoraMuted">
              {pendingCount > 1
                ? t('staff_payments.ack_notice_desc_many', { count: pendingCount })
                : t('staff_payments.ack_notice_desc')}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-2xl font-black text-nexoraText">{formatCurrency(payment.amount)}</p>
              <p className="mt-1 text-[11px] font-semibold text-nexoraMuted">
                {formatTransactionDateTime(payment.createdAt, currentLanguage)}
              </p>
              {payment.paymentMethodType ? (
                <p className="mt-1 text-[11px] font-bold text-nexoraText">{payment.paymentMethodType}</p>
              ) : null}
            </div>
            <DirectPaymentStatusBadge status={paymentStatus} t={t} variant="staff" className="shrink-0" />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-violet-900/90">
            {t('staff_payments.confirm_receipt_help')}
          </p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraMuted transition hover:bg-slate-50"
          >
            {t('common.close')}
          </button>
          <button
            type="button"
            onClick={onViewDetail}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white transition hover:bg-nexoraBrand/90"
          >
            {t('staff_payments.view_detail')}
          </button>
        </div>
      </div>
    </div>
  )
}
