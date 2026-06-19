import { useState, useMemo, useEffect } from 'react'
import { CreditCard, Coins, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency, formatTransactionDateTime } from '../utils'
import { WalletLogos } from '../constants'
import TransactionFilter from '../../TransactionFilter'
import Pagination from '../../ui/Pagination'
import TransactionDetailModal from '../modals/TransactionDetailModal'
import { usePagination } from '../../../hooks/usePagination'
import { DEFAULT_PAGE_SIZE, STAFF_FILTER_LIST_PAGE_SIZE } from '../../../constants/pagination'
import { useTransactionsPaginated } from '../../../data/hooks/useTransactions'
import { useMerchantStaff } from '../../../data/hooks/useMerchantStaff'
import { useTouchpoints } from '../../../data/hooks/useMerchantTouchpoints'
import type { TransactionsListQuery } from '../../../data/repositories/transactions'
import ReportsTableSkeleton from './ReportsTableSkeleton'

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

function ReportsView({ staff: staffProp = [], touchpoints: touchpointsProp = [], businessName = '', businessSlug = '' }) {
  const { t, currentLanguage } = useTranslation()

  // Filter States
  const [dateRangePreset, setDateRangePreset] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [selectedStaff, setSelectedStaff] = useState('all')
  const [selectedTouchpoint, setSelectedTouchpoint] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedTx, setSelectedTx] = useState<any | null>(null)
  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({ pageSize: DEFAULT_PAGE_SIZE })

  const { data: staffPage } = useMerchantStaff({
    pageNumber: 1,
    pageSize: STAFF_FILTER_LIST_PAGE_SIZE,
  })
  const { data: touchpointsPage } = useTouchpoints({ PageNumber: 1, PageSize: 100 })

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

  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'success' || s === 'succeeded' || s === 'confirmed' || s === 'completed' || s === 'hoàn thành' || s === 'thành công') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20">
          <CheckCircle className="h-3 w-3" />
          {t('components.dashboard.views.ReportsView.success')}
        </span>
      );
    }
    if (s === 'pending' || s === 'processing' || s === 'initiated' || s === 'đang chờ') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-500/20">
          <Clock className="h-3 w-3" />
          {t('components.dashboard.views.ReportsView.pending')}
        </span>
      );
    }
    if (s === 'failed' || s === 'skipped' || s === 'thất bại' || s === 'lỗi') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-500/20">
          <XCircle className="h-3 w-3" />
          {t('components.dashboard.views.ReportsView.failed')}
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
    ...(selectedStaff !== 'all' ? { staffProfileId: selectedStaff } : {}),
    ...(selectedTouchpoint !== 'all' ? { touchPointId: selectedTouchpoint } : {}),
    ...(selectedPayment !== 'all' ? { paymentMethod: selectedPayment } : {}),
    ...(selectedStatus !== 'all' ? { status: selectedStatus } : {}),
    ...(debouncedSearch ? { staffSearch: debouncedSearch } : {}),
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
    debouncedSearch,
  ])

  const {
    data: transactionsPage,
    isPending,
    isFetching,
  } = useTransactionsPaginated(apiQuery)

  const transactions = transactionsPage?.items ?? []
  const totalCount = transactionsPage?.totalCount ?? 0
  const totalPages = Math.max(1, transactionsPage?.totalPages ?? 1)
  const hasNextPage = transactionsPage?.hasNextPage ?? false
  const hasPreviousPage = transactionsPage?.hasPreviousPage ?? false

  // Amount filter only — not supported by tips API
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (minAmount && tx.amount < parseFloat(minAmount)) return false
      if (maxAmount && tx.amount > parseFloat(maxAmount)) return false
      return true
    })
  }, [transactions, minAmount, maxAmount])

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
  }, [staff, t])

  const touchpointOptions = useMemo(() => {
    return [
      { value: 'all', label: t('dashboard.activity_log.all_touchpoints') },
      ...(touchpoints || [])
        .filter((point) => point.id && point.name)
        .map((point) => ({ value: point.id, label: point.name })),
    ]
  }, [touchpoints, t])

  const showTableSkeleton = (isPending && !transactionsPage) || isFetching

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('dashboard.menu.transactions')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('dashboard.activity_log.title')}</p>
        </div>
      </div>

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
      />


      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[780px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_id')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_time')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_amount')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_staff')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_tp')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_payment')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_status')}</th>
              <th className="px-4 py-3 text-right">{t('components.dashboard.views.ReportsView.details')}</th>
            </tr>
          </thead>
          <tbody>
            {showTableSkeleton ? (
              <ReportsTableSkeleton rows={pageSize} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-nexoraMuted font-medium">
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
                  <td className="px-4 py-3">{formatStaffCell(tx)}</td>
                  <td className="px-4 py-3">{tx.touchpoint}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getPaymentMethodLogo(tx.paymentMethod)}
                      <span>{tx.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {renderStatusBadge(tx.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTx(tx)
                      }}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      {t('components.dashboard.views.ReportsView.details')}
                    </button>
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
        />
      ) : null}
    </div>
  )
}

export default ReportsView
