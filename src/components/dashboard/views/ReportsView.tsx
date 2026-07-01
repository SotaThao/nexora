import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CreditCard, Coins, CheckCircle, Clock, XCircle, AlertCircle, Loader2, Eye } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency, formatTransactionDateTime, isAwaitingShopConfirmation } from '../utils'
import { WalletLogos } from '../constants'
import TransactionFilter from '../../TransactionFilter'
import Pagination from '../../ui/Pagination'
import TransactionDetailModal from '../modals/TransactionDetailModal'
import { usePagination } from '../../../hooks/usePagination'
import { DEFAULT_PAGE_SIZE, STAFF_FILTER_LIST_PAGE_SIZE } from '../../../constants/pagination'
import { useConfirmMerchantTipsReceipt, useTransactionsPaginated } from '../../../data/hooks/useTransactions'
import {
  useConfirmStaffTipsReceipt,
  useStaffTransactionsPaginated,
  useStaffProfile,
} from '../../../data/hooks/useStaffSelf'
import { useMerchantStaff } from '../../../data/hooks/useMerchantStaff'
import { useTouchpoints } from '../../../data/hooks/useMerchantTouchpoints'
import type { TransactionsListQuery } from '../../../data/repositories/transactions'
import ReportsTableSkeleton from './ReportsTableSkeleton'
import ReportsDirectPaymentsTab from './ReportsDirectPaymentsTab'

// A tip can be manually marked Completed from the table row while it is
// still Initiated or Confirmed. Confirm-receipt ownership follows US-024/US-025:
// direct-to-staff tips (isMultiStaff false) are only confirmed by the staff
// member, shop-account / multi-staff tips are only confirmed by the owner —
// each audience only ever sees the button for the tips it owns.
function isCompletableTip(tx, isStaffAudience) {
  const status = String(tx?.status || '').toLowerCase()
  if (status !== 'initiated' && status !== 'confirmed') return false
  if (isStaffAudience) {
    if (tx?.isMultiStaff) return false
    return !tx?.staffConfirmedAt
  }
  if (!tx?.isMultiStaff) return false
  return !tx?.merchantConfirmedAt
}

const REPORTS_TAB_TIPS = 'tips'
const REPORTS_TAB_DIRECT_PAYMENTS = 'direct_payments'

function toIsoDate(date: Date) {
  return date.toISOString().split('T')[0]
}

function toApiDateTime(dateStr: string, endOfDay = false) {
  if (!dateStr) return undefined
  if (dateStr.includes('T')) return dateStr
  return endOfDay ? `${dateStr}T23:59:59` : `${dateStr}T00:00:00`
}

function resolveDateRange(
  preset: string,
  startDate: string,
  endDate: string,
): Pick<TransactionsListQuery, 'dateFrom' | 'dateTo'> {
  const today = new Date()

  if (preset === 'today') {
    const value = toIsoDate(today)
    return { dateFrom: toApiDateTime(value), dateTo: toApiDateTime(value, true) }
  }
  if (preset === 'yesterday') {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const value = toIsoDate(yesterday)
    return { dateFrom: toApiDateTime(value), dateTo: toApiDateTime(value, true) }
  }
  if (preset === '7days') {
    const limit = new Date(today)
    limit.setDate(limit.getDate() - 7)
    return {
      dateFrom: toApiDateTime(toIsoDate(limit)),
      dateTo: toApiDateTime(toIsoDate(today), true),
    }
  }
  if (preset === '30days') {
    const limit = new Date(today)
    limit.setDate(limit.getDate() - 30)
    return {
      dateFrom: toApiDateTime(toIsoDate(limit)),
      dateTo: toApiDateTime(toIsoDate(today), true),
    }
  }
  if (preset === 'custom') {
    return {
      dateFrom: startDate ? toApiDateTime(startDate) : undefined,
      dateTo: endDate ? toApiDateTime(endDate, true) : undefined,
    }
  }
  return {}
}

// Sentinel status-filter value for tips the customer paid into the shop
// account that still need the owner to confirm receipt. Not a real API
// status — it maps to { status: 'Confirmed', isMultiStaff: true } plus the
// client-side isAwaitingShopConfirmation predicate.
const AWAITING_STATUS = 'AwaitingShopConfirmation'

function getStaffDisplayName(member) {
  return (
    member.nickname?.trim() ||
    member.fullName?.trim() ||
    member.staffCode?.trim() ||
    member.email?.trim() ||
    'Staff'
  )
}

function formatStaffCell(tx) {
  if (tx.staffName) return tx.staffName
  if (tx.isMultiStaff && Array.isArray(tx.tipItems) && tx.tipItems.length > 0) {
    return tx.tipItems.map((item) => item.staffName).filter(Boolean).join(', ')
  }
  return '—'
}

function ReportsView({
  audience = 'merchant',
  staff: staffProp = [],
  touchpoints: touchpointsProp = [],
  businessName = '',
  businessSlug = '',
  showPageHeader = true,
}) {
  const { t, currentLanguage } = useTranslation()
  const isStaffAudience = audience === 'staff'
  const [searchParams, setSearchParams] = useSearchParams()
  const [completingId, setCompletingId] = useState<string | null>(null)
  const merchantCompleteMutation = useConfirmMerchantTipsReceipt()
  const staffCompleteMutation = useConfirmStaffTipsReceipt()
  const completeMutation = isStaffAudience ? staffCompleteMutation : merchantCompleteMutation

  const handleCompleteTip = useCallback((tx, event) => {
    event.stopPropagation()
    if (completeMutation.isPending) return
    setCompletingId(tx.id)
    completeMutation.mutate([tx.id], {
      onSettled: () => setCompletingId(null),
    })
  }, [completeMutation])

  const activeTab =
    !isStaffAudience && searchParams.get('tab') === REPORTS_TAB_DIRECT_PAYMENTS
      ? REPORTS_TAB_DIRECT_PAYMENTS
      : REPORTS_TAB_TIPS
  const selectedPaymentId = searchParams.get('paymentId')

  const setActiveTab = useCallback((tab: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    if (tab !== REPORTS_TAB_DIRECT_PAYMENTS) {
      next.delete('paymentId')
      next.delete('status')
    }
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const openDirectPayment = useCallback((paymentId: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', REPORTS_TAB_DIRECT_PAYMENTS)
    next.set('paymentId', paymentId)
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const closeDirectPayment = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', REPORTS_TAB_DIRECT_PAYMENTS)
    next.delete('paymentId')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  // Allow deep-linking the awaiting-confirmation filter, e.g. the dashboard
  // overview "View" banner navigates to /dashboard/reports?status=AwaitingShopConfirmation.
  const initialStatus =
    !isStaffAudience && searchParams.get('status') === AWAITING_STATUS ? AWAITING_STATUS : 'all'
  const directPaymentsStatusFilter = useMemo(() => {
    const status = searchParams.get('status')
    if (status === '1' || status === 'confirmed') return '1'
    return 'all'
  }, [searchParams])

  // Filter States
  const [dateRangePreset, setDateRangePreset] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [selectedStaff, setSelectedStaff] = useState('all')
  const [selectedTouchpoint, setSelectedTouchpoint] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState(initialStatus)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedTx, setSelectedTx] = useState<any | null>(null)
  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({ pageSize: DEFAULT_PAGE_SIZE })

  // Awaiting-confirmation is driven by the visible Status filter, not a
  // separate toggle, so the criteria is transparent and clears via Reset.
  const isAwaitingFilter = selectedStatus === AWAITING_STATUS

  const { data: staffPage } = useMerchantStaff({
    pageNumber: 1,
    pageSize: STAFF_FILTER_LIST_PAGE_SIZE,
    enabled: !isStaffAudience,
  })
  const { data: touchpointsPage } = useTouchpoints(
    { PageNumber: 1, PageSize: 100 },
    { enabled: !isStaffAudience },
  )
  const { data: staffProfile } = useStaffProfile({ enabled: isStaffAudience })

  const staff = staffPage?.items?.length ? staffPage.items : staffProp
  const touchpoints = touchpointsPage?.items?.length ? touchpointsPage.items : touchpointsProp

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const resetFilters = () => {
    setDateRangePreset('all')
    setStartDate('')
    setEndDate('')
    setMinAmount('')
    setMaxAmount('')
    setSelectedStaff('all')
    setSelectedTouchpoint('all')
    setSelectedPayment('all')
    setSelectedStatus('all')
    setSearchQuery('')
  }

  const renderStatusBadge = (tx) => {
    const status = tx?.status;
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'hoàn thành') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20">
          <CheckCircle className="h-3 w-3" />
          {status}
        </span>
      );
    }
    if (s === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100/50 dark:border-violet-500/20">
          <CheckCircle className="h-3 w-3" />
          {status}
        </span>
      );
    }
    if (s === 'success' || s === 'succeeded' || s === 'thành công') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20">
          <CheckCircle className="h-3 w-3" />
          {status}
        </span>
      );
    }
    if (s === 'pending' || s === 'processing' || s === 'initiated' || s === 'đang chờ') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-500/20">
          <Clock className="h-3 w-3" />
          {status}
        </span>
      );
    }
    if (s === 'failed' || s === 'skipped' || s === 'thất bại' || s === 'lỗi') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-500/20">
          <XCircle className="h-3 w-3" />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-100/50 dark:border-white/10">
        <AlertCircle className="h-3 w-3" />
        {status}
      </span>
    );
  };

  // Helper for Payment Method logos
  const getPaymentMethodLogo = (method) => {
    const norm = (method || '').toLowerCase().replace(/\s+/g, '')
    if (norm === 'card') {
      return <CreditCard className="h-[18px] w-[18px] text-slate-500" />
    }
    if (norm === 'crypto') {
      return <Coins className="h-[18px] w-[18px] text-amber-500" />
    }
    const logo = WalletLogos[norm]
    if (logo) return logo
    return <CreditCard className="h-[18px] w-[18px] text-slate-500" />
  }

  const apiQuery = useMemo<TransactionsListQuery>(() => ({
    pageNumber,
    pageSize,
    ...resolveDateRange(dateRangePreset, startDate, endDate),
    ...(!isStaffAudience && selectedStaff !== 'all' ? { staffProfileId: selectedStaff } : {}),
    ...(!isStaffAudience && selectedTouchpoint !== 'all'
      ? { touchPointId: selectedTouchpoint }
      : {}),
    ...(selectedPayment !== 'all' ? { paymentMethod: selectedPayment } : {}),
    ...(!isStaffAudience && isAwaitingFilter
      ? { status: 'Confirmed', isMultiStaff: true }
      : selectedStatus !== 'all'
        ? { status: selectedStatus }
        : {}),
    ...(!isStaffAudience && debouncedSearch ? { staffSearch: debouncedSearch } : {}),
  }), [
    pageNumber,
    pageSize,
    dateRangePreset,
    startDate,
    endDate,
    selectedStaff,
    selectedTouchpoint,
    selectedPayment,
    selectedStatus,
    isAwaitingFilter,
    debouncedSearch,
    isStaffAudience,
  ])

  const {
    data: merchantTransactionsPage,
    isPending: isMerchantPending,
    isFetching: isMerchantFetching,
  } = useTransactionsPaginated(apiQuery, { enabled: !isStaffAudience })

  const {
    data: staffTransactionsPage,
    isPending: isStaffPending,
    isFetching: isStaffFetching,
  } = useStaffTransactionsPaginated(apiQuery, { enabled: isStaffAudience })

  const transactionsPage = isStaffAudience ? staffTransactionsPage : merchantTransactionsPage
  const isPending = isStaffAudience ? isStaffPending : isMerchantPending
  const isFetching = isStaffAudience ? isStaffFetching : isMerchantFetching

  const transactions = transactionsPage?.items ?? []
  const totalCount = transactionsPage?.totalCount ?? 0
  const totalPages = Math.max(1, transactionsPage?.totalPages ?? 1)
  const hasNextPage = transactionsPage?.hasNextPage ?? false
  const hasPreviousPage = transactionsPage?.hasPreviousPage ?? false

  // Amount filter only — not supported by tips API
  // For the awaiting-confirmation filter, also refine client-side to the exact eligibility predicate
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (minAmount && tx.amount < parseFloat(minAmount)) return false
      if (maxAmount && tx.amount > parseFloat(maxAmount)) return false
      if (!isStaffAudience && isAwaitingFilter && !isAwaitingShopConfirmation(tx)) return false
      if (isStaffAudience && debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        const haystack = [tx.id, tx.touchpoint, tx.businessName, tx.staffName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (isStaffAudience && selectedTouchpoint !== 'all') {
        const tp = String(tx.touchpoint || '').toLowerCase()
        if (tp !== selectedTouchpoint.toLowerCase()) return false
      }
      return true
    })
  }, [
    transactions,
    minAmount,
    maxAmount,
    isAwaitingFilter,
    isStaffAudience,
    debouncedSearch,
    selectedTouchpoint,
  ])

  useEffect(() => {
    resetPage()
  }, [
    dateRangePreset,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    selectedStaff,
    selectedTouchpoint,
    selectedPayment,
    selectedStatus,
    debouncedSearch,
    resetPage,
  ])

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPage(totalPages)
    }
  }, [pageNumber, totalPages, setPage])

  const staffOptions = useMemo(() => {
    if (isStaffAudience) {
      const profileId = staffProfile?.id
      const label =
        staffProfile?.displayName?.trim() ||
        staffProfile?.staffCode?.trim() ||
        'Staff'
      return [
        { value: 'all', label: t('dashboard.activity_log.all_staff') },
        ...(profileId ? [{ value: profileId, label }] : []),
      ]
    }

    const eligibleStaff = (staff || []).filter(
      (member) => member.staffProfileId && member.isActive !== false,
    )
    return [
      { value: 'all', label: t('dashboard.activity_log.all_staff') },
      ...eligibleStaff.map((member) => ({
        value: member.staffProfileId,
        label: getStaffDisplayName(member),
      })),
    ]
  }, [isStaffAudience, staff, staffProfile, t])

  const touchpointOptions = useMemo(() => {
    if (isStaffAudience) {
      const names = new Set<string>()
      for (const tx of transactions) {
        if (tx.touchpoint) names.add(tx.touchpoint)
      }
      return [
        { value: 'all', label: t('dashboard.activity_log.all_touchpoints') },
        ...Array.from(names)
          .sort((a, b) => a.localeCompare(b))
          .map((name) => ({ value: name, label: name })),
      ]
    }

    return [
      { value: 'all', label: t('dashboard.activity_log.all_touchpoints') },
      ...(touchpoints || [])
        .filter((point) => point.id && point.name)
        .map((point) => ({ value: point.id, label: point.name })),
    ]
  }, [isStaffAudience, touchpoints, transactions, t])

  const statusOptions = useMemo(() => {
    const options = [
      { value: 'all', label: t('dashboard.activity_log.all_statuses') },
      { value: 'Initiated', label: t('dashboard.activity_log.status_initiated') },
      { value: 'Confirmed', label: t('dashboard.activity_log.status_confirmed') },
      { value: 'Skipped', label: t('dashboard.activity_log.status_skipped') },
      { value: 'Completed', label: t('dashboard.activity_log.status_completed') },
    ]
    if (!isStaffAudience) {
      options.push({
        value: AWAITING_STATUS,
        label: t('merchant_dashboard.tips.awaiting_shop_confirmation'),
      })
    }
    return options
  }, [isStaffAudience, t])

  const showTableSkeleton = (isPending && !transactionsPage) || isFetching
  const tableColumnCount = isStaffAudience ? 7 : 8

  return (
    <div className="space-y-5">
      {showPageHeader ? (
        <div className="flex flex-col gap-4 border-b border-nexoraBorder pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-nexoraText">{t('dashboard.menu.transactions')}</h2>
            <p className="mt-1 max-w-[22rem] text-xs leading-relaxed text-nexoraMuted">
              {!isStaffAudience && activeTab === REPORTS_TAB_DIRECT_PAYMENTS
                ? t('merchant_payments.description')
                : t('dashboard.activity_log.title')}
            </p>
          </div>

          {!isStaffAudience ? (
            <div className="flex w-full gap-1 rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted p-1 sm:w-auto">
              {[
                { id: REPORTS_TAB_TIPS, label: t('dashboard.reports.tabs.tips') },
                { id: REPORTS_TAB_DIRECT_PAYMENTS, label: t('dashboard.reports.tabs.direct_payments') },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-9 min-w-0 flex-1 rounded-lg px-2 text-[10px] font-bold transition-all sm:flex-none sm:px-4 sm:text-xs ${
                    activeTab === tab.id
                      ? 'bg-white text-nexoraBrand shadow-sm font-black'
                      : 'text-nexoraMuted hover:text-nexoraText'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {!isStaffAudience && activeTab === REPORTS_TAB_DIRECT_PAYMENTS ? (
        <ReportsDirectPaymentsTab
          selectedPaymentId={selectedPaymentId}
          onOpenPayment={openDirectPayment}
          onClosePayment={closeDirectPayment}
          initialStatusFilter={directPaymentsStatusFilter}
        />
      ) : (
        <>
      <TransactionFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateRangePreset={dateRangePreset}
        setDateRangePreset={setDateRangePreset}
        minAmount={minAmount}
        setMinAmount={setMinAmount}
        maxAmount={maxAmount}
        setMaxAmount={setMaxAmount}
        selectedStaff={selectedStaff}
        setSelectedStaff={setSelectedStaff}
        selectedTouchpoint={selectedTouchpoint}
        setSelectedTouchpoint={setSelectedTouchpoint}
        selectedPayment={selectedPayment}
        setSelectedPayment={setSelectedPayment}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        resetFilters={resetFilters}
        staffOptions={staffOptions}
        touchpointOptions={touchpointOptions}
        statusOptions={statusOptions}
        variant={isStaffAudience ? 'staff' : 'merchant'}
        defaultCollapsed
      />

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[780px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_id')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_time')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_amount')}</th>
              {!isStaffAudience ? (
                <th className="px-4 py-3">{t('dashboard.activity_log.col_staff')}</th>
              ) : null}
              <th className="px-4 py-3">{t('dashboard.activity_log.col_tp')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_payment')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_status')}</th>
              <th className="px-4 py-3 text-right">{t('dashboard.activity_log.col_action')}</th>
            </tr>
          </thead>
          <tbody>
            {showTableSkeleton ? (
              <ReportsTableSkeleton rows={pageSize} columns={tableColumnCount} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={tableColumnCount} className="px-4 py-8 text-center text-nexoraMuted font-medium">
                  {t('dashboard.activity_log.empty_activity')}
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="border-t border-nexoraRule hover:bg-slate-50 transition-colors cursor-pointer select-none"
                >
                  <td className="px-4 py-3 font-bold text-nexoraText">{tx.id}</td>
                  <td className="px-4 py-3 text-nexoraMuted">
                    {formatTransactionDateTime(tx.dateTime, currentLanguage)}
                  </td>
                  <td className="px-4 py-3 font-extrabold text-nexoraText">{formatCurrency(tx.amount)}</td>
                  {!isStaffAudience ? (
                    <td className="px-4 py-3">{formatStaffCell(tx)}</td>
                  ) : null}
                  <td className="px-4 py-3">{tx.touchpoint}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodLogo(tx.paymentMethod)}
                      <span>{tx.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {renderStatusBadge(tx)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isCompletableTip(tx, isStaffAudience) ? (
                        <button
                          type="button"
                          title={t('dashboard.activity_log.action_complete')}
                          disabled={completingId === tx.id}
                          onClick={(e) => handleCompleteTip(tx, e)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                        >
                          {completingId === tx.id ? (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="hidden sm:inline">{t('dashboard.activity_log.action_complete')}</span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        title={t('components.dashboard.views.ReportsView.details')}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTx(tx)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-2.5 py-1.5 text-[11px] font-bold text-nexoraText transition-colors hover:bg-nexoraCanvas"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0" />
                        <span className="hidden sm:inline">{t('components.dashboard.views.ReportsView.details')}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalCount > 0 && (
          <Pagination
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalPages={totalPages}
            totalCount={totalCount}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            onPageChange={setPage}
            isLoading={isFetching}
            className="mt-0 border-t-0"
          />
        )}
      </div>

      {selectedTx ? (
        <TransactionDetailModal
          selectedTx={selectedTx}
          onClose={() => setSelectedTx(null)}
          businessName={businessName}
          businessSlug={businessSlug}
          touchpoints={touchpoints}
          staff={staff}
          audience={audience}
        />
      ) : null}
        </>
      )}
    </div>
  )
}

export default ReportsView
