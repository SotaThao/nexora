import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, List, Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { PayoutStatus } from '../../../data/payoutConstants'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useConfirmStaffPayout,
  useStaffPayoutStats,
  useStaffPayoutsList,
  useStaffUnpaidDebt,
} from '../../../data/hooks/useStaffPayouts'
import type { StaffPayoutsListQuery } from '../../../data/repositories/payouts'
import { getApiErrorCode, type PayoutRecord } from '../../../types/domain'
import { DEFAULT_PAGE_SIZE } from '../../../constants/pagination'
import { usePagination } from '../../../hooks/usePagination'
import { formatCurrency, formatTransactionDateTime } from '../../dashboard/utils'
import PayoutMethodBadge from '../../tips/payouts/PayoutMethodBadge'
import PayoutStatusBadge from '../../tips/payouts/PayoutStatusBadge'
import PayoutToolbarSelect from '../../tips/payouts/PayoutToolbarSelect'
import Pagination from '../../ui/Pagination'
import { formatPayoutPeriodRange, getPayoutStatusDescI18nKey, getPayoutTypeI18nKeys } from '../../../utils/payoutDisplay'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', labelKey: 'staff_payouts.filter_all_status' },
  { value: String(PayoutStatus.Pending), labelKey: 'staff_payouts.status_pending' },
  { value: String(PayoutStatus.Confirmed), labelKey: 'staff_payouts.status_confirmed' },
  { value: String(PayoutStatus.Cancelled), labelKey: 'staff_payouts.status_cancelled' },
]

const STAFF_PAYOUT_COL_KEYS = {
  code: 'staff_payouts.col_code',
  date: 'staff_payouts.col_date',
  amount: 'staff_payouts.col_amount',
  method: 'staff_payouts.col_method',
  types: 'staff_payouts.col_types',
  period: 'staff_payouts.col_period',
  status: 'staff_payouts.col_status',
  actions: 'staff_payouts.col_actions',
} as const

function StatCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string
  value: string
  sub?: string
  loading?: boolean
}) {
  return (
    <div className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">{label}</p>
      <p className="mt-2 text-2xl font-black text-nexoraText">{loading ? '—' : value}</p>
      {sub ? <p className="mt-1 text-[11px] font-semibold text-nexoraMuted">{sub}</p> : null}
    </div>
  )
}

function StaffPayoutList({
  payouts,
  isPending,
  currentLanguage,
  t,
  onViewDetail,
}: {
  payouts: PayoutRecord[]
  isPending?: boolean
  currentLanguage: string
  t: (key: string, params?: Record<string, unknown>) => string
  onViewDetail: (payout: PayoutRecord) => void
}) {
  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-nexoraBrand" />
      </div>
    )
  }

  if (!payouts.length) {
    return (
      <div className="px-4 py-16 text-center text-sm text-nexoraMuted">
        {t('staff_payouts.empty')}
      </div>
    )
  }

  return (
    <>
      <div className="divide-y divide-nexoraBorder/60 md:hidden">
        {payouts.map((row) => {
          const canConfirm = row.status === PayoutStatus.Pending
          return (
            <article key={row.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-black text-nexoraText">{formatCurrency(row.amount)}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-nexoraMuted">
                    {formatTransactionDateTime(row.createdAt, currentLanguage)}
                  </p>
                </div>
                <PayoutStatusBadge status={row.status} audience="staff" />
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-nexoraBrand">{row.payoutCode}</p>
                <PayoutMethodBadge method={row.payoutMethodType} />
              </div>

              <p className="text-xs text-nexoraMuted">
                {formatPayoutPeriodRange(row.periodStart, row.periodEnd, currentLanguage)}
              </p>

              <div className="flex flex-wrap gap-1">
                {getPayoutTypeI18nKeys(row.payoutTypes).map((key) => (
                  <span
                    key={key}
                    className="rounded-md border border-nexoraBorder bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold"
                  >
                    {t(key)}
                  </span>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onViewDetail(row)}
                  title={canConfirm ? t('staff_payouts.confirm_receipt') : t('staff_payments.view_detail')}
                  aria-label={canConfirm ? t('staff_payouts.confirm_receipt') : t('staff_payments.view_detail')}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${
                    canConfirm
                      ? 'bg-nexoraBrand text-white'
                      : 'border border-nexoraBorder bg-white text-nexoraText'
                  }`}
                >
                  {canConfirm ? <CheckCircle2 className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-[940px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t(STAFF_PAYOUT_COL_KEYS.code)}</th>
              <th className="px-4 py-3">{t(STAFF_PAYOUT_COL_KEYS.date)}</th>
              <th className="px-4 py-3">{t(STAFF_PAYOUT_COL_KEYS.amount)}</th>
              <th className="px-4 py-3">{t(STAFF_PAYOUT_COL_KEYS.method)}</th>
              <th className="px-4 py-3">{t(STAFF_PAYOUT_COL_KEYS.types)}</th>
              <th className="px-4 py-3">{t(STAFF_PAYOUT_COL_KEYS.period)}</th>
              <th className="px-4 py-3">{t(STAFF_PAYOUT_COL_KEYS.status)}</th>
              <th className="px-4 py-3">{t(STAFF_PAYOUT_COL_KEYS.actions)}</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((row) => {
              const canConfirm = row.status === PayoutStatus.Pending
              return (
                <tr key={row.id} className="border-t border-nexoraBorder/70 hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-nexoraBrand">{row.payoutCode}</td>
                  <td className="px-4 py-3 text-xs text-nexoraMuted">
                    {formatTransactionDateTime(row.createdAt, currentLanguage)}
                  </td>
                  <td className="px-4 py-3 text-sm font-black text-nexoraText">{formatCurrency(row.amount)}</td>
                  <td className="px-4 py-3">
                    <PayoutMethodBadge method={row.payoutMethodType} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {getPayoutTypeI18nKeys(row.payoutTypes).map((key) => (
                        <span
                          key={key}
                          className="rounded-md border border-nexoraBorder bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold"
                        >
                          {t(key)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-nexoraMuted">
                    {formatPayoutPeriodRange(row.periodStart, row.periodEnd, currentLanguage)}
                  </td>
                  <td className="px-4 py-3">
                    <PayoutStatusBadge status={row.status} audience="staff" />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onViewDetail(row)}
                      title={canConfirm ? t('staff_payouts.confirm_receipt') : t('staff_payments.view_detail')}
                      aria-label={canConfirm ? t('staff_payouts.confirm_receipt') : t('staff_payments.view_detail')}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                        canConfirm
                          ? 'bg-nexoraBrand text-white'
                          : 'border border-nexoraBorder bg-white text-nexoraText'
                      }`}
                    >
                      {canConfirm ? <CheckCircle2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

function StaffPayoutDetailModal({
  payout,
  currentLanguage,
  t,
  confirmingId,
  onClose,
  onConfirm,
}: {
  payout: PayoutRecord | null
  currentLanguage: string
  t: (key: string, params?: Record<string, unknown>) => string
  confirmingId: string | null
  onClose: () => void
  onConfirm: (payoutId: string) => void
}) {
  if (!payout) return null
  const canConfirm = payout.status === PayoutStatus.Pending
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-nexoraBorder bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-nexoraBorder px-5 py-4">
          <div>
            <h3 className="text-base font-black text-nexoraText">{t('staff_payouts.detail_title')}</h3>
            <p className="mt-1 text-xs text-nexoraMuted">{t('staff_payouts.detail_sub')}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-nexoraBorder p-2 text-nexoraMuted hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl bg-nexoraCanvas p-4 text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
              {t('staff_payouts.field_amount')}
            </p>
            <p className="mt-1 text-3xl font-black text-nexoraText">{formatCurrency(payout.amount)}</p>
            <div className="mt-2 flex flex-col items-center gap-1.5">
              <PayoutStatusBadge status={payout.status} audience="staff" />
              <p className="max-w-xs text-center text-[11px] text-nexoraMuted">
                {t(getPayoutStatusDescI18nKey(payout.status, 'staff'))}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="font-semibold text-nexoraMuted">{t(STAFF_PAYOUT_COL_KEYS.code)}</dt>
            <dd className="font-mono text-xs font-bold text-nexoraBrand">{payout.payoutCode}</dd>
            <dt className="font-semibold text-nexoraMuted">{t(STAFF_PAYOUT_COL_KEYS.date)}</dt>
            <dd className="font-semibold text-nexoraText">{formatTransactionDateTime(payout.createdAt, currentLanguage)}</dd>
            <dt className="font-semibold text-nexoraMuted">{t(STAFF_PAYOUT_COL_KEYS.method)}</dt>
            <dd><PayoutMethodBadge method={payout.payoutMethodType} /></dd>
            <dt className="font-semibold text-nexoraMuted">{t(STAFF_PAYOUT_COL_KEYS.types)}</dt>
            <dd className="flex flex-wrap gap-1">
              {getPayoutTypeI18nKeys(payout.payoutTypes).map((key) => (
                <span key={key} className="rounded-md border border-nexoraBorder bg-slate-50 px-2 py-0.5 text-[10px] font-bold">
                  {t(key)}
                </span>
              ))}
            </dd>
            <dt className="font-semibold text-nexoraMuted">{t(STAFF_PAYOUT_COL_KEYS.period)}</dt>
            <dd className="font-semibold text-nexoraText">
              {formatPayoutPeriodRange(payout.periodStart, payout.periodEnd, currentLanguage)}
            </dd>
            {payout.notes ? (
              <>
                <dt className="font-semibold text-nexoraMuted">{t('staff_payouts.field_notes')}</dt>
                <dd className="text-nexoraText">{payout.notes}</dd>
              </>
            ) : null}
          </dl>
        </div>

        {canConfirm ? (
          <div className="border-t border-nexoraBorder px-5 py-4">
            <button
              type="button"
              onClick={() => onConfirm(payout.id)}
              disabled={confirmingId === payout.id}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {confirmingId === payout.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {t('staff_payouts.confirm_receipt')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function StaffPayouts() {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmingPayoutId, setConfirmingPayoutId] = useState<string | null>(null)
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null)
  const confirmMutation = useConfirmStaffPayout()
  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({ pageSize: DEFAULT_PAGE_SIZE })

  const listQuery = useMemo<StaffPayoutsListQuery>(
    () => ({
      page: pageNumber,
      pageSize,
      ...(statusFilter !== 'all' ? { status: Number(statusFilter) } : {}),
    }),
    [pageNumber, pageSize, statusFilter],
  )

  const { data: stats, isPending: isStatsPending } = useStaffPayoutStats()
  const { data: unpaidDebtPage, isPending: isUnpaidDebtPending } = useStaffUnpaidDebt()
  const { data: payoutsPage, isPending, isFetching } = useStaffPayoutsList(listQuery)

  const payouts = payoutsPage?.items ?? []
  const unpaidDebts = unpaidDebtPage?.items ?? []
  const totalCount = payoutsPage?.totalCount ?? 0
  const totalPages = Math.max(1, payoutsPage?.totalPages ?? 1)
  const statusOptions = STATUS_FILTER_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) }))

  const totalUnpaidDebt = unpaidDebts.reduce((sum, debt) => sum + debt.balance, 0)

  useEffect(() => {
    resetPage()
  }, [statusFilter, resetPage])

  useEffect(() => {
    if (pageNumber > totalPages) setPage(totalPages)
  }, [pageNumber, totalPages, setPage])

  const handleConfirmReceipt = (payoutId: string, options?: { onSuccess?: () => void }) => {
    if (confirmMutation.isPending) return
    setConfirmingPayoutId(payoutId)
    confirmMutation.mutate(payoutId, {
      onSuccess: () => {
        showToast(t('staff_payouts.confirm_success'), 'success')
        options?.onSuccess?.()
      },
      onError: (err) => {
        showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
      },
      onSettled: () => setConfirmingPayoutId(null),
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('staff_payouts.stat_received_all_time')}
          value={formatCurrency(stats?.totalReceivedAllTime ?? 0)}
          loading={isStatsPending}
        />
        <StatCard
          label={t('staff_payouts.stat_received_this_month')}
          value={formatCurrency(stats?.totalReceivedThisMonth ?? 0)}
          loading={isStatsPending}
        />
        <StatCard
          label={t('staff_payouts.stat_pending')}
          value={formatCurrency(stats?.totalPendingAmount ?? 0)}
          sub={
            stats?.totalPendingCount
              ? t('staff_payouts.stat_pending_sub', { count: stats.totalPendingCount })
              : undefined
          }
          loading={isStatsPending}
        />
        <StatCard
          label={t('staff_payouts.stat_current_debt')}
          value={formatCurrency(stats?.currentDebtBalance ?? 0)}
          loading={isStatsPending}
        />
      </div>

      <div className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm">
        <h3 className="text-sm font-black text-nexoraText">{t('staff_payouts.unpaid_debt_title')}</h3>
        {isUnpaidDebtPending ? (
          <div className="flex items-center gap-2 pt-3 text-xs text-nexoraMuted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('common.loading')}
          </div>
        ) : unpaidDebts.length === 0 ? (
          <p className="pt-2 text-xs text-nexoraMuted">{t('staff_payouts.unpaid_debt_empty')}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {unpaidDebts.map((row) => (
              <div
                key={`${row.payoutDebtId}-${row.businessId}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-nexoraText">{row.businessName}</p>
                  <p className="text-[11px] text-nexoraMuted">
                    {formatTransactionDateTime(row.lastUpdatedAt, currentLanguage)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-black text-amber-700">{formatCurrency(row.balance)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-nexoraBorder pt-2 text-xs font-bold">
              <span className="text-nexoraMuted">{t('staff_payouts.unpaid_debt_total')}</span>
              <span className="text-nexoraText">{formatCurrency(totalUnpaidDebt)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-nexoraBorder p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-black text-nexoraText">{t('staff_payouts.list_title')}</h3>
          <PayoutToolbarSelect
            icon={List}
            label={t('staff_payouts.filter_status_label')}
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        </div>

        <StaffPayoutList
          payouts={payouts}
          isPending={isPending}
          currentLanguage={currentLanguage}
          t={t}
          onViewDetail={setSelectedPayout}
        />

        <Pagination
          className="px-4"
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalPages={totalPages}
          totalCount={totalCount}
          hasNextPage={payoutsPage?.hasNextPage}
          hasPreviousPage={payoutsPage?.hasPreviousPage}
          onPageChange={setPage}
          isLoading={isFetching}
        />
      </div>

      <StaffPayoutDetailModal
        payout={selectedPayout}
        currentLanguage={currentLanguage}
        t={t}
        confirmingId={confirmingPayoutId}
        onClose={() => setSelectedPayout(null)}
        onConfirm={(payoutId) => {
          handleConfirmReceipt(payoutId, {
            onSuccess: () => setSelectedPayout(null),
          })
        }}
      />
    </div>
  )
}
