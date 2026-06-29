import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { CheckCircle, CreditCard, Eye, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { formatCurrency, formatTransactionDateTime } from '../utils'
import { WalletLogos } from '../constants'
import Pagination from '../../ui/Pagination'
import { usePagination } from '../../../hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '../../../constants/pagination'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useAcknowledgeMerchantPayment,
  useMerchantPaymentDetail,
  useMerchantPaymentsList,
} from '../../../data/hooks/useMerchantPayments'
import type { MerchantPaymentsListQuery } from '../../../data/repositories/merchantPayments'
import { PaymentType } from '../../../types/domain'
import { getApiErrorCode } from '../../../types/domain'
import MerchantPaymentDetailModal from '../modals/MerchantPaymentDetailModal'
import {
  DirectPaymentStatusBadge,
  DirectPaymentStatusLegend,
} from '../direct-payments/DirectPaymentStatusBadge'
import {
  DIRECT_PAYMENT_STATUS_ORDER,
  getDirectPaymentStatusDescKey,
  getDirectPaymentStatusLabelKey,
  needsMerchantAcknowledge,
  normalizePaymentStatusValue,
} from '../../../utils/directPaymentStatus'

function toIsoDate(date: Date) {
  return date.toISOString().split('T')[0]
}

function toApiDateTime(dateStr: string, endOfDay = false) {
  if (!dateStr) return undefined
  if (dateStr.includes('T')) return dateStr
  return endOfDay ? `${dateStr}T23:59:59` : `${dateStr}T00:00:00`
}

function resolveDateRange(preset: string, startDate: string, endDate: string) {
  const today = new Date()

  if (preset === 'today') {
    const value = toIsoDate(today)
    return { from: toApiDateTime(value), to: toApiDateTime(value, true) }
  }
  if (preset === '7days') {
    const limit = new Date(today)
    limit.setDate(limit.getDate() - 7)
    return {
      from: toApiDateTime(toIsoDate(limit)),
      to: toApiDateTime(toIsoDate(today), true),
    }
  }
  if (preset === '30days') {
    const limit = new Date(today)
    limit.setDate(limit.getDate() - 30)
    return {
      from: toApiDateTime(toIsoDate(limit)),
      to: toApiDateTime(toIsoDate(today), true),
    }
  }
  if (preset === 'custom') {
    return {
      from: startDate ? toApiDateTime(startDate) : undefined,
      to: endDate ? toApiDateTime(endDate, true) : undefined,
    }
  }
  return {}
}

function getPaymentMethodLogo(method: string) {
  const norm = (method || '').toLowerCase().replace(/\s+/g, '')
  const logo = WalletLogos[norm as keyof typeof WalletLogos]
  if (logo) return logo
  return <CreditCard className="h-[18px] w-[18px] text-slate-500" />
}

export default function ReportsDirectPaymentsTab({
  selectedPaymentId = null,
  onOpenPayment,
  onClosePayment,
  initialStatusFilter = 'all',
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [datePreset, setDatePreset] = useState('30days')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null)
  const acknowledgeMutation = useAcknowledgeMerchantPayment()

  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({
    pageSize: DEFAULT_PAGE_SIZE,
  })

  const apiQuery = useMemo<MerchantPaymentsListQuery>(() => ({
    page: pageNumber,
    pageSize,
    type: PaymentType.DirectPayment,
    ...(statusFilter !== 'all' ? { status: Number(statusFilter) } : {}),
    ...resolveDateRange(datePreset, startDate, endDate),
  }), [pageNumber, pageSize, statusFilter, datePreset, startDate, endDate])

  const { data: paymentsPage, isPending, isFetching } = useMerchantPaymentsList(apiQuery)
  const { data: selectedPaymentDetail, isPending: isDetailLoading } = useMerchantPaymentDetail(
    selectedPaymentId,
    { enabled: Boolean(selectedPaymentId) },
  )

  const payments = paymentsPage?.items ?? []
  const totalCount = paymentsPage?.totalCount ?? 0
  const totalPages = Math.max(1, paymentsPage?.totalPages ?? 1)

  useEffect(() => {
    setStatusFilter(initialStatusFilter)
  }, [initialStatusFilter])

  useEffect(() => {
    resetPage()
  }, [statusFilter, datePreset, startDate, endDate, resetPage])

  const selectedPayment =
    selectedPaymentDetail ??
    (selectedPaymentId ? payments.find((item) => item.id === selectedPaymentId) ?? null : null)

  const statusFilterOptions = useMemo(() => [
    { value: 'all', label: t('dashboard.activity_log.all_statuses'), desc: '' },
    ...DIRECT_PAYMENT_STATUS_ORDER.map((status) => ({
      value: String(status),
      label: t(getDirectPaymentStatusLabelKey(status)),
      desc: t(getDirectPaymentStatusDescKey(status)),
    })),
  ], [t])

  const handleAcknowledge = (paymentId: string, event?: MouseEvent, options?: { onSuccess?: () => void }) => {
    event?.stopPropagation()
    if (acknowledgeMutation.isPending) return
    setAcknowledgingId(paymentId)
    acknowledgeMutation.mutate(paymentId, {
      onSuccess: () => {
        showToast(t('merchant_payments.confirm_success'), 'success')
        options?.onSuccess?.()
      },
      onError: (err) => {
        showToast(t(getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))), 'error')
      },
      onSettled: () => setAcknowledgingId(null),
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-nexoraMuted">{t('merchant_payments.description')}</p>

      <DirectPaymentStatusLegend t={t} />

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-nexoraMuted">
            {t('dashboard.activity_log.filter_status')}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 min-w-[12rem] rounded-lg border border-nexoraBorder bg-white px-3 text-xs font-semibold text-nexoraText"
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value} title={option.desc}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-nexoraMuted">
            {t('dashboard.activity_log.filter_date')}
          </label>
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="h-9 rounded-lg border border-nexoraBorder bg-white px-3 text-xs font-semibold text-nexoraText"
          >
            <option value="all">{t('dashboard.activity_log.preset_all')}</option>
            <option value="today">{t('dashboard.activity_log.preset_today')}</option>
            <option value="7days">{t('dashboard.activity_log.preset_7days')}</option>
            <option value="30days">{t('dashboard.activity_log.preset_30days')}</option>
            <option value="custom">{t('dashboard.activity_log.preset_custom')}</option>
          </select>
        </div>
        {datePreset === 'custom' ? (
          <>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-nexoraMuted">
                {t('dashboard.activity_log.start_date')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 rounded-lg border border-nexoraBorder px-3 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-nexoraMuted">
                {t('dashboard.activity_log.end_date')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 rounded-lg border border-nexoraBorder px-3 text-xs"
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-nexoraBorder bg-nexoraCanvas/60 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              <tr>
                <th className="px-4 py-3">{t('dashboard.activity_log.col_time')}</th>
                <th className="px-4 py-3">{t('dashboard.activity_log.col_amount')}</th>
                <th className="px-4 py-3">{t('merchant_payments.col_method')}</th>
                <th className="px-4 py-3">{t('dashboard.activity_log.filter_status')}</th>
                <th className="w-[1%] whitespace-nowrap px-2 py-3 text-right">{t('merchant_payments.col_action')}</th>
              </tr>
            </thead>
            <tbody>
              {isPending && !paymentsPage ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-nexoraMuted">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-nexoraMuted">
                    {t('merchant_payments.empty')}
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const paymentStatus = normalizePaymentStatusValue(payment.status)
                  const showAcknowledge = needsMerchantAcknowledge(payment)
                  const isAcknowledging = acknowledgingId === payment.id && acknowledgeMutation.isPending

                  return (
                  <tr
                    key={payment.id}
                    className="border-b border-nexoraBorder/60 transition hover:bg-nexoraBrandSoft/30"
                  >
                    <td className="px-4 py-3 font-semibold text-nexoraText">
                      {formatTransactionDateTime(payment.createdAt, currentLanguage)}
                    </td>
                    <td className="px-4 py-3 font-black text-nexoraText">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-semibold text-nexoraText">
                        {getPaymentMethodLogo(payment.paymentMethodType)}
                        {payment.paymentMethodType || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <DirectPaymentStatusBadge status={paymentStatus} t={t} />
                    </td>
                    <td className="whitespace-nowrap px-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title={t('merchant_payments.view_detail')}
                          aria-label={t('merchant_payments.view_detail')}
                          onClick={() => onOpenPayment?.(payment.id)}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-nexoraBorder text-nexoraMuted transition hover:bg-nexoraCanvas hover:text-nexoraText"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {showAcknowledge ? (
                          <button
                            type="button"
                            title={t('merchant_payments.confirm_receipt')}
                            aria-label={t('merchant_payments.confirm_receipt')}
                            onClick={(e) => handleAcknowledge(payment.id, e)}
                            disabled={isAcknowledging}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-nexoraBrand text-white transition hover:bg-nexoraBrand/90 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isAcknowledging ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 pb-4">
          <Pagination
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalPages={totalPages}
            totalCount={totalCount}
            hasNextPage={paymentsPage?.hasNextPage}
            hasPreviousPage={paymentsPage?.hasPreviousPage}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </div>
      </div>

      {selectedPaymentId ? (
        <MerchantPaymentDetailModal
          payment={selectedPayment}
          isLoading={isDetailLoading && !selectedPayment}
          onClose={() => onClosePayment?.()}
          onAcknowledge={(paymentId) => handleAcknowledge(paymentId, undefined, { onSuccess: () => onClosePayment?.() })}
          isAcknowledging={acknowledgeMutation.isPending && acknowledgingId === selectedPaymentId}
        />
      ) : null}
    </div>
  )
}
