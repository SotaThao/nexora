import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle, CreditCard, Eye, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { formatCurrency, formatTransactionDateTime } from '../../dashboard/utils'
import { WalletLogos } from '../../dashboard/constants'
import Pagination from '../../ui/Pagination'
import { usePagination } from '../../../hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '../../../constants/pagination'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useAcknowledgeStaffPayment,
  useStaffPaymentDetail,
  useStaffPaymentsList,
} from '../../../data/hooks/useStaffPayments'
import { useDirectPaymentStatusPoll } from '../../../data/hooks/useDirectPaymentStatusPoll'
import type { StaffPaymentsListQuery } from '../../../data/repositories/staffPayments'
import { PaymentType } from '../../../types/domain'
import { getApiErrorCode } from '../../../types/domain'
import StaffPaymentDetailModal from '../modals/StaffPaymentDetailModal'
import CustomSelect from '../../CustomSelect'
import { SkeletonLayout } from '../../ui/skeleton'
import { STAFF_PAYMENTS_SKELETON } from '../skeletons/staffDashboardSkeletons'
import { dismissAckPrompt } from '../../../utils/directPaymentAckDismiss'
import { resolveDirectPaymentDateRange } from '../../../utils/directPaymentDateRange'
import {
  DirectPaymentStatusBadge,
  DirectPaymentStatusLegend,
} from '../../dashboard/direct-payments/DirectPaymentStatusBadge'
import {
  DIRECT_PAYMENT_STATUS_ORDER,
  getDirectPaymentStatusDescKey,
  getDirectPaymentStatusLabelKey,
  needsStaffAcknowledge,
  normalizePaymentStatusValue,
} from '../../../utils/directPaymentStatus'

function getPaymentMethodLogo(method: string) {
  const norm = (method || '').toLowerCase().replace(/\s+/g, '')
  const logo = WalletLogos[norm as keyof typeof WalletLogos]
  if (logo) return logo
  return <CreditCard className="h-[18px] w-[18px] text-slate-500" />
}

export default function StaffPayments() {
  const { paymentId: selectedPaymentId = null } = useParams()
  const navigate = useNavigate()
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const [statusFilter, setStatusFilter] = useState('all')
  const [datePreset, setDatePreset] = useState('30days')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null)
  const acknowledgeMutation = useAcknowledgeStaffPayment()

  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({
    pageSize: DEFAULT_PAGE_SIZE,
  })

  const apiQuery = useMemo<StaffPaymentsListQuery>(() => ({
    page: pageNumber,
    pageSize,
    type: PaymentType.StaffDirectPayment,
    ...(statusFilter !== 'all' ? { status: Number(statusFilter) } : {}),
    ...resolveDirectPaymentDateRange(datePreset, startDate, endDate),
  }), [pageNumber, pageSize, statusFilter, datePreset, startDate, endDate])

  const { data: paymentsPage, isPending, isFetching } = useStaffPaymentsList(apiQuery)
  const { data: selectedPaymentDetail, isPending: isDetailLoading } = useStaffPaymentDetail(
    selectedPaymentId,
    { enabled: Boolean(selectedPaymentId) },
  )

  const payments = paymentsPage?.items ?? []
  const totalCount = paymentsPage?.totalCount ?? 0
  const totalPages = Math.max(1, paymentsPage?.totalPages ?? 1)

  const pendingAckPayments = useMemo(
    () => payments.filter((payment) => needsStaffAcknowledge(payment)),
    [payments],
  )

  useEffect(() => {
    resetPage()
  }, [statusFilter, datePreset, startDate, endDate, resetPage])

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPage(totalPages)
    }
  }, [pageNumber, totalPages, setPage])

  const selectedPayment =
    selectedPaymentDetail ??
    (selectedPaymentId
      ? payments.find((item) => item.id === selectedPaymentId)
        ?? pendingAckPayments.find((item) => item.id === selectedPaymentId)
        ?? null
      : null)

  useDirectPaymentStatusPoll(selectedPaymentId, {
    enabled: Boolean(selectedPaymentId),
    seedStatus: selectedPayment?.status,
    seedPayment: selectedPayment,
  })

  const openPayment = (paymentId: string) => {
    navigate(`/staff/payments/${encodeURIComponent(paymentId)}`)
  }

  const closePayment = () => {
    if (selectedPayment && needsStaffAcknowledge(selectedPayment)) {
      dismissAckPrompt(selectedPayment.id)
    }
    navigate('/staff/payments')
  }

  const statusFilterOptions = useMemo(() => [
    { value: 'all', label: t('dashboard.activity_log.all_statuses'), desc: '' },
    ...DIRECT_PAYMENT_STATUS_ORDER.map((status) => ({
      value: String(status),
      label: t(getDirectPaymentStatusLabelKey(status, 'staff')),
      desc: t(getDirectPaymentStatusDescKey(status, 'staff')),
    })),
  ], [t])

  const datePresetOptions = useMemo(() => [
    { value: 'all', label: t('dashboard.activity_log.preset_all') },
    { value: 'today', label: t('dashboard.activity_log.preset_today') },
    { value: '7days', label: t('dashboard.activity_log.preset_7days') },
    { value: '30days', label: t('dashboard.activity_log.preset_30days') },
    { value: 'custom', label: t('dashboard.activity_log.preset_custom') },
  ], [t])

  const filterFieldClass = 'text-[9px] font-bold uppercase tracking-wide text-nexoraMuted sm:text-[10px] sm:tracking-wider'
  const filterControlClass =
    'h-8 w-full rounded-lg border border-nexoraBorder bg-white px-3.5 text-[11px] font-semibold text-nexoraText sm:h-9 sm:px-4 sm:text-xs'
  const filterSelectButtonClass = 'px-3.5 text-[11px] sm:px-4 sm:text-xs'
  const filterSelectOptionsClass = 'text-[11px] sm:text-xs'

  const handleAcknowledge = (paymentId: string, event?: MouseEvent, options?: { onSuccess?: () => void }) => {
    event?.stopPropagation()
    if (acknowledgeMutation.isPending) return
    setAcknowledgingId(paymentId)
    acknowledgeMutation.mutate(paymentId, {
      onSuccess: () => {
        showToast(t('staff_payments.confirm_success'), 'success')
        options?.onSuccess?.()
      },
      onError: (err) => {
        showToast(t(getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))), 'error')
      },
      onSettled: () => setAcknowledgingId(null),
    })
  }

  const renderPaymentActions = (
    paymentId: string,
    showAcknowledge: boolean,
    isAcknowledging: boolean,
    layout: 'icons' | 'buttons' = 'icons',
  ) => (
    <div
      className={layout === 'buttons' ? 'flex gap-2' : 'flex items-center justify-end gap-1'}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title={t('staff_payments.view_detail')}
        aria-label={t('staff_payments.view_detail')}
        onClick={() => openPayment(paymentId)}
        className={
          layout === 'buttons'
            ? 'inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-3 py-2 text-[11px] font-bold text-nexoraText transition hover:bg-nexoraCanvas'
            : 'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-nexoraBorder text-nexoraMuted transition hover:bg-nexoraCanvas hover:text-nexoraText'
        }
      >
        <Eye className="h-4 w-4 shrink-0" />
        {layout === 'buttons' ? <span>{t('staff_payments.view_detail')}</span> : null}
      </button>
      {showAcknowledge ? (
        <button
          type="button"
          title={t('staff_payments.confirm_receipt')}
          aria-label={t('staff_payments.confirm_receipt')}
          onClick={(e) => handleAcknowledge(paymentId, e)}
          disabled={isAcknowledging}
          className={
            layout === 'buttons'
              ? 'inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-3 py-2 text-[11px] font-bold text-white transition hover:bg-nexoraBrand/90 disabled:cursor-not-allowed disabled:opacity-60'
              : 'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-nexoraBrand text-white transition hover:bg-nexoraBrand/90 disabled:cursor-not-allowed disabled:opacity-60'
          }
        >
          {isAcknowledging ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 shrink-0" />
          )}
          {layout === 'buttons' ? <span>{t('staff_payments.confirm_receipt')}</span> : null}
        </button>
      ) : null}
    </div>
  )

  const renderEmptyOrLoading = (className = '') => {
    if (payments.length === 0 && !isPending && paymentsPage) {
      return (
        <div className={`px-4 py-10 text-center text-sm text-nexoraMuted ${className}`}>
          {t('staff_payments.empty')}
        </div>
      )
    }
    return null
  }

  if (isPending && !paymentsPage) {
    return <SkeletonLayout blocks={STAFF_PAYMENTS_SKELETON} />
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <DirectPaymentStatusLegend t={t} variant="staff" />

      {pendingAckPayments.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-violet-200 bg-violet-50/80 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-violet-900">
                {t('staff_payments.pending_ack_banner_title', { count: pendingAckPayments.length })}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-violet-800/90">
                {t('staff_payments.pending_ack_banner_desc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openPayment(pendingAckPayments[0].id)}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-violet-700 px-4 text-xs font-bold text-white transition hover:bg-violet-800"
          >
            {t('staff_payments.pending_ack_banner_action')}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-nexoraBorder bg-white p-3.5 shadow-sm sm:grid-cols-2 sm:gap-3 sm:p-4 lg:grid-cols-4">
        <div className="min-w-0">
          <label className={`mb-1 block ${filterFieldClass}`}>
            {t('dashboard.activity_log.filter_status')}
          </label>
          <CustomSelect
            size="sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusFilterOptions}
            buttonClass={filterSelectButtonClass}
            optionsClass={filterSelectOptionsClass}
          />
        </div>
        <div className="min-w-0">
          <label className={`mb-1 block ${filterFieldClass}`}>
            {t('dashboard.activity_log.filter_date')}
          </label>
          <CustomSelect
            size="sm"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            options={datePresetOptions}
            buttonClass={filterSelectButtonClass}
            optionsClass={filterSelectOptionsClass}
          />
        </div>
        {datePreset === 'custom' ? (
          <>
            <div className="min-w-0">
              <label className={`mb-1 block ${filterFieldClass}`}>
                {t('dashboard.activity_log.start_date')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={filterControlClass}
              />
            </div>
            <div className="min-w-0">
              <label className={`mb-1 block ${filterFieldClass}`}>
                {t('dashboard.activity_log.end_date')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={filterControlClass}
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-sm">
        {renderEmptyOrLoading() ?? (
          <>
            <div className="divide-y divide-nexoraBorder/60 md:hidden">
              {payments.map((payment) => {
                const paymentStatus = normalizePaymentStatusValue(payment.status)
                const showAcknowledge = needsStaffAcknowledge(payment)
                const isAcknowledging = acknowledgingId === payment.id && acknowledgeMutation.isPending

                return (
                  <article key={payment.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-black text-nexoraText">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-nexoraMuted">
                          {formatTransactionDateTime(payment.createdAt, currentLanguage)}
                        </p>
                      </div>
                      <DirectPaymentStatusBadge status={paymentStatus} t={t} variant="staff" className="shrink-0" />
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-nexoraText">
                      {getPaymentMethodLogo(payment.paymentMethodType)}
                      <span className="truncate">{payment.paymentMethodType || '—'}</span>
                    </div>
                    {renderPaymentActions(payment.id, showAcknowledge, isAcknowledging, 'buttons')}
                  </article>
                )
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[780px] w-full text-left text-xs">
                <thead className="border-b border-nexoraBorder bg-nexoraCanvas/60 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                  <tr>
                    <th className="px-4 py-3">{t('dashboard.activity_log.col_time')}</th>
                    <th className="px-4 py-3">{t('dashboard.activity_log.col_amount')}</th>
                    <th className="px-4 py-3">{t('staff_payments.col_method')}</th>
                    <th className="px-4 py-3">{t('dashboard.activity_log.filter_status')}</th>
                    <th className="w-[1%] whitespace-nowrap px-2 py-3 text-right">{t('staff_payments.col_action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const paymentStatus = normalizePaymentStatusValue(payment.status)
                    const showAcknowledge = needsStaffAcknowledge(payment)
                    const isAcknowledging = acknowledgingId === payment.id && acknowledgeMutation.isPending

                    return (
                      <tr
                        key={payment.id}
                        className="border-b border-nexoraBorder/60 transition hover:bg-nexoraBrandSoft/30"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-nexoraText">
                          {formatTransactionDateTime(payment.createdAt, currentLanguage)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-black text-nexoraText">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-semibold text-nexoraText">
                            {getPaymentMethodLogo(payment.paymentMethodType)}
                            {payment.paymentMethodType || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <DirectPaymentStatusBadge status={paymentStatus} t={t} variant="staff" />
                        </td>
                        <td className="whitespace-nowrap px-2 py-3">
                          {renderPaymentActions(payment.id, showAcknowledge, isAcknowledging)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="px-1 pb-1 sm:px-2 sm:pb-2">
          {totalCount > 0 ? (
            <Pagination
              className="border-t-0 px-2 py-3 sm:px-4 sm:py-4"
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
              isLoading={isFetching}
            />
          ) : null}
        </div>
      </div>

      {selectedPaymentId ? (
        <StaffPaymentDetailModal
          payment={selectedPayment}
          isLoading={isDetailLoading && !selectedPayment}
          onClose={closePayment}
          onAcknowledge={(paymentId) => handleAcknowledge(paymentId, undefined, { onSuccess: closePayment })}
          isAcknowledging={acknowledgeMutation.isPending && acknowledgingId === selectedPaymentId}
        />
      ) : null}
    </div>
  )
}
