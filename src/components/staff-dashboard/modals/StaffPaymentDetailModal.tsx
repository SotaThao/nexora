import { CreditCard, CheckCircle, Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { WalletLogos } from '../../dashboard/constants'
import { formatCurrency, formatTransactionDateTime } from '../../dashboard/utils'
import type { StaffPaymentRecord } from '../../../types/domain'
import { PaymentStatus } from '../../../types/domain'
import { DirectPaymentStatusBadge } from '../../dashboard/direct-payments/DirectPaymentStatusBadge'
import {
  getDirectPaymentStatusDescKey,
  isStaffDirectPaymentRecordCompleted,
  needsStaffAcknowledge,
  normalizePaymentStatusValue,
} from '../../../utils/directPaymentStatus'

function getPaymentMethodLogo(method: string) {
  const norm = (method || '').toLowerCase().replace(/\s+/g, '')
  const logo = WalletLogos[norm as keyof typeof WalletLogos]
  if (logo) return logo
  return <CreditCard className="h-[18px] w-[18px] text-slate-500" />
}

function truncateMid(str: string, head = 8, tail = 6): string {
  if (!str || str.length <= head + tail + 3) return str
  return `${str.slice(0, head)}…${str.slice(-tail)}`
}

export default function StaffPaymentDetailModal({
  payment,
  isLoading = false,
  onClose,
  onAcknowledge,
  isAcknowledging = false,
}: {
  payment: StaffPaymentRecord | null
  isLoading?: boolean
  onClose: () => void
  onAcknowledge?: (paymentId: string) => void
  isAcknowledging?: boolean
}) {
  const { t, currentLanguage } = useTranslation()

  if (!payment && !isLoading) return null

  const paymentStatus = payment ? normalizePaymentStatusValue(payment.status) : PaymentStatus.Initiated
  const awaitingAck = payment ? needsStaffAcknowledge(payment) : false
  const completed = payment ? isStaffDirectPaymentRecordCompleted(payment) : false
  const waitingCustomer = payment ? paymentStatus === PaymentStatus.Initiated : false

  const handleAcknowledge = () => {
    if (!payment?.id || isAcknowledging || !onAcknowledge) return
    onAcknowledge(payment.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-nexoraBorder bg-white p-4 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-nexoraBorder pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t('staff_payments.detail_title')}
            </span>
            <p className="mt-0.5 text-xs text-nexoraMuted">{t('staff_payments.detail_desc')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-nexoraMuted transition-colors hover:bg-slate-100 hover:text-nexoraText"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-nexoraBrand" />
          </div>
        ) : payment ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 py-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-nexoraMuted">
                {t('dashboard.activity_log.col_amount')}
              </span>
              <h3 className="mt-1 text-3xl font-black text-nexoraText">{formatCurrency(payment.amount)}</h3>
              <div className="mt-2 flex flex-col items-center gap-1">
                <DirectPaymentStatusBadge status={paymentStatus} t={t} size="md" variant="staff" className="mt-0" />
                {!completed ? (
                  <p className="max-w-xs text-center text-[11px] leading-relaxed text-nexoraMuted">
                    {t(getDirectPaymentStatusDescKey(paymentStatus, 'staff'))}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-nexoraBorder pt-4 text-xs">
              <div>
                <span className="block text-[10px] font-bold text-nexoraMuted">
                  {t('dashboard.activity_log.col_id')}
                </span>
                <span className="mt-0.5 block font-mono text-[11px] font-semibold text-nexoraText" title={payment.id}>
                  {truncateMid(payment.id)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-nexoraMuted">
                  {t('dashboard.activity_log.col_time')}
                </span>
                <span className="mt-0.5 block font-semibold text-nexoraText">
                  {formatTransactionDateTime(payment.createdAt, currentLanguage)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-nexoraMuted">
                  {t('staff_payments.col_method')}
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  {getPaymentMethodLogo(payment.paymentMethodType)}
                  <span className="font-semibold text-nexoraText">{payment.paymentMethodType || '—'}</span>
                </div>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-nexoraMuted">
                  {t('staff_payments.account_info')}
                </span>
                <span className="mt-0.5 block break-all font-semibold text-nexoraText">
                  {payment.accountInfo || '—'}
                </span>
              </div>
              {payment.customerConfirmedAt || payment.staffConfirmedAt ? (
                <>
                  <div>
                    <span className="block text-[10px] font-bold text-nexoraMuted">
                      {t('staff_payments.customer_confirmed_at')}
                    </span>
                    <span className="mt-0.5 block font-semibold text-nexoraText">
                      {payment.customerConfirmedAt
                        ? formatTransactionDateTime(payment.customerConfirmedAt, currentLanguage)
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-nexoraMuted">
                      {t('staff_payments.staff_confirmed_at')}
                    </span>
                    <span className="mt-0.5 block font-semibold text-nexoraText">
                      {payment.staffConfirmedAt
                        ? formatTransactionDateTime(payment.staffConfirmedAt, currentLanguage)
                        : '—'}
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            {waitingCustomer ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-600" />
                <p className="text-[11px] leading-normal text-amber-800">
                  {t('staff_payments.waiting_customer_confirm')}
                </p>
              </div>
            ) : null}

            {awaitingAck && onAcknowledge ? (
              <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                <p className="text-[11px] leading-normal text-violet-700">
                  {t('staff_payments.confirm_receipt_help')}
                </p>
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  disabled={isAcknowledging}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-nexoraBrand px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-nexoraBrand/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAcknowledging ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {t('staff_payments.confirm_receipt')}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
