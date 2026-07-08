import { useEffect, useMemo, useState } from 'react'
import { Calendar, ChevronDown, ChevronUp, Download, FileClock, List, Plus, Search, SlidersHorizontal, User } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { PayoutStatus, PayoutType } from '../../../data/payoutConstants'
import {
  useMerchantPayoutDetail,
  useMerchantPayoutStats,
  useMerchantPayoutsList,
  useMerchantUnpaidTips,
} from '../../../data/hooks/useMerchantPayouts'
import type { MerchantPayoutsListQuery } from '../../../data/repositories/payouts'
import type { PayoutRecord, StaffMember, UnpaidTipDebtRecord } from '../../../types/domain'
import Pagination from '../../ui/Pagination'
import PayoutToolbarSelect from '../payouts/PayoutToolbarSelect'
import PayoutList from '../payouts/PayoutList'
import { usePagination } from '../../../hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '../../../constants/pagination'
import PayoutStatsCards from '../payouts/PayoutStatsCards'
import CreatePayoutModal from '../payouts/CreatePayoutModal'
import PayoutDetailModal from '../payouts/PayoutDetailModal'
import PayoutExportModal from '../payouts/PayoutExportModal'
import UnpaidTipDebtsPanel from '../payouts/UnpaidTipDebtsPanel'
import PayoutDebtHistoryModal from '../payouts/PayoutDebtHistoryModal'
import { formatLocalDateIso } from '../../../utils/localDate'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', labelKey: 'dashboard.tips.payouts_manager.filter_all_status' },
  { value: String(PayoutStatus.Pending), labelKey: 'dashboard.tips.payouts_manager.status_pending' },
  { value: String(PayoutStatus.Confirmed), labelKey: 'dashboard.tips.payouts_manager.status_confirmed' },
  { value: String(PayoutStatus.Cancelled), labelKey: 'dashboard.tips.payouts_manager.status_cancelled' },
]

const TYPE_FILTER_OPTIONS = [
  { value: 'all', labelKey: 'dashboard.tips.payouts_manager.filter_all_types' },
  { value: String(PayoutType.Tip), labelKey: 'dashboard.tips.payouts_manager.type_tip' },
  { value: String(PayoutType.Salary), labelKey: 'dashboard.tips.payouts_manager.type_salary' },
  { value: String(PayoutType.Bonus), labelKey: 'dashboard.tips.payouts_manager.type_bonus' },
  { value: String(PayoutType.Other), labelKey: 'dashboard.tips.payouts_manager.type_other' },
]

const FILTER_DEBOUNCE_MS = 400

function currentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { periodFrom: formatLocalDateIso(start), periodTo: formatLocalDateIso(end) }
}

export default function TipsPayoutsTab({ staff = [] }: { staff?: StaffMember[] }) {
  const { t, currentLanguage } = useTranslation()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [staffFilter, setStaffFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [debouncedPeriodFrom, setDebouncedPeriodFrom] = useState('')
  const [debouncedPeriodTo, setDebouncedPeriodTo] = useState('')
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isUnpaidDialogOpen, setIsUnpaidDialogOpen] = useState(false)
  const [editingPayout, setEditingPayout] = useState<PayoutRecord | null>(null)
  const [preferredStaffProfileId, setPreferredStaffProfileId] = useState<string | null>(null)
  const [historyStaffProfile, setHistoryStaffProfile] = useState<UnpaidTipDebtRecord | null>(null)
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)

  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({ pageSize: DEFAULT_PAGE_SIZE })

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), FILTER_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedPeriodFrom(periodFrom), FILTER_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [periodFrom])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedPeriodTo(periodTo), FILTER_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [periodTo])

  const isFilterPending =
    search.trim() !== debouncedSearch
    || (periodFilter === 'custom' && (periodFrom !== debouncedPeriodFrom || periodTo !== debouncedPeriodTo))

  const apiQuery = useMemo<MerchantPayoutsListQuery>(() => {
    const monthRange = periodFilter === 'month' ? currentMonthRange() : {}
    return {
      page: pageNumber,
      pageSize,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(staffFilter !== 'all' ? { staffProfileId: staffFilter } : {}),
      ...(statusFilter !== 'all' ? { status: Number(statusFilter) } : {}),
      ...(typeFilter !== 'all' ? { payoutType: Number(typeFilter) } : {}),
      ...(periodFilter === 'custom' && debouncedPeriodFrom ? { periodFrom: debouncedPeriodFrom } : {}),
      ...(periodFilter === 'custom' && debouncedPeriodTo ? { periodTo: debouncedPeriodTo } : {}),
      ...(periodFilter === 'month' ? monthRange : {}),
    }
  }, [
    pageNumber,
    pageSize,
    debouncedSearch,
    staffFilter,
    statusFilter,
    typeFilter,
    periodFilter,
    debouncedPeriodFrom,
    debouncedPeriodTo,
  ])

  const { data: stats, isPending: isStatsPending } = useMerchantPayoutStats()
  const { data: unpaidPage, isPending: isUnpaidTipsPending } = useMerchantUnpaidTips()
  const { data: payoutsPage, isPending, isFetching } = useMerchantPayoutsList(apiQuery)
  const { data: payoutDetail, isPending: isDetailLoading } = useMerchantPayoutDetail(selectedPayoutId, {
    enabled: Boolean(selectedPayoutId),
  })

  const payouts = payoutsPage?.items ?? []
  const totalCount = payoutsPage?.totalCount ?? 0
  const totalPages = Math.max(1, payoutsPage?.totalPages ?? 1)
  const unpaidDebts = unpaidPage?.items ?? []

  const staffOptions = useMemo(
    () => [
      { value: 'all', label: t('dashboard.tips.payouts_manager.filter_all_staff') },
      ...staff
        .filter((member) => member.staffProfileId)
        .map((member) => ({
          value: member.staffProfileId as string,
          label: `${(member.displayName || member.fullName || member.nickname) as string}${member.staffCode ? ` (${member.staffCode})` : ''}`,
        })),
    ],
    [staff, t],
  )

  const statusOptions = STATUS_FILTER_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) }))
  const typeOptions = TYPE_FILTER_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) }))

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'all') count += 1
    if (typeFilter !== 'all') count += 1
    if (staffFilter !== 'all') count += 1
    if (periodFilter !== 'all') count += 1
    return count
  }, [statusFilter, typeFilter, staffFilter, periodFilter])

  useEffect(() => {
    resetPage()
  }, [
    debouncedSearch,
    statusFilter,
    typeFilter,
    staffFilter,
    periodFilter,
    debouncedPeriodFrom,
    debouncedPeriodTo,
    resetPage,
  ])

  useEffect(() => {
    if (pageNumber > totalPages) setPage(totalPages)
  }, [pageNumber, totalPages, setPage])

  const selectedPayout =
    payoutDetail ?? (selectedPayoutId ? payouts.find((row) => row.id === selectedPayoutId) ?? null : null)

  const openCreate = () => {
    setEditingPayout(null)
    setPreferredStaffProfileId(null)
    setIsCreateOpen(true)
  }

  const openCreateForStaff = (staffProfileId: string) => {
    setEditingPayout(null)
    setPreferredStaffProfileId(staffProfileId)
    setIsUnpaidDialogOpen(false)
    setIsCreateOpen(true)
  }

  const openEdit = (payout: PayoutRecord) => {
    setEditingPayout(payoutDetail?.id === payout.id ? payoutDetail : payout)
    setSelectedPayoutId(null)
    setIsCreateOpen(true)
  }

  const closeCreate = () => {
    setIsCreateOpen(false)
    setEditingPayout(null)
    setPreferredStaffProfileId(null)
  }

  return (
    <div className="space-y-6">
      <PayoutStatsCards stats={stats} isLoading={isStatsPending} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full min-w-[200px] flex-1 sm:max-w-[340px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#687381]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('dashboard.tips.payouts_manager.search_placeholder')}
                className="h-9 w-full rounded-lg border border-[#dde5ef] bg-white pl-9 pr-3 text-xs text-[#0b1220] placeholder:text-[#687381] shadow-sm outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsFiltersExpanded((prev) => !prev)}
              aria-expanded={isFiltersExpanded}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#dde5ef] bg-white px-3 text-xs font-bold text-[#0b1220] shadow-sm transition hover:border-nexoraBrand/30 hover:bg-nexoraSurfaceMuted"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-nexoraBrand" />
              <span>
                {isFiltersExpanded
                  ? t('dashboard.tips.payouts_manager.hide_filters')
                  : t('dashboard.tips.payouts_manager.show_filters')}
              </span>
              {!isFiltersExpanded && activeFilterCount > 0 ? (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-nexoraBrand px-1 text-[10px] font-extrabold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
              {isFiltersExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-[#687381]" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-[#687381]" />
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUnpaidDialogOpen(true)}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-amber-200 bg-amber-50/60 px-3.5 text-xs font-bold text-amber-900 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
            >
              <FileClock className="h-3.5 w-3.5 shrink-0 text-amber-600" strokeWidth={2.25} />
              <span>{t('dashboard.tips.payouts_manager.unpaid_button', { count: unpaidDebts.length })}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-sky-200 bg-sky-50/60 px-3.5 text-xs font-bold text-sky-900 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
            >
              <Download className="h-3.5 w-3.5 shrink-0 text-sky-600" strokeWidth={2.25} />
              <span>{t('dashboard.tips.payouts_manager.export_btn')}</span>
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#393bc8]"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              <span>{t('dashboard.tips.payouts_manager.create_btn')}</span>
            </button>
          </div>
        </div>

        {isFiltersExpanded ? (
          <div className="flex flex-col gap-2 rounded-xl border border-[#dde5ef] bg-white p-3 shadow-sm">
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <PayoutToolbarSelect
                icon={Calendar}
                label={t('dashboard.tips.payouts_manager.filter_period_label')}
                value={periodFilter}
                onChange={setPeriodFilter}
                options={[
                  { value: 'all', label: t('dashboard.tips.payouts_manager.filter_all_period') },
                  { value: 'month', label: t('dashboard.tips.payouts_manager.filter_this_month') },
                  { value: 'custom', label: t('dashboard.tips.payouts_manager.filter_custom_period') },
                ]}
                fullWidth
              />

              <PayoutToolbarSelect
                icon={User}
                label={t('dashboard.tips.payouts_manager.filter_staff_label')}
                value={staffFilter}
                onChange={setStaffFilter}
                options={staffOptions}
                menuMinWidth={220}
                fullWidth
              />

              <PayoutToolbarSelect
                icon={List}
                label={t('dashboard.tips.payouts_manager.filter_type_label')}
                value={typeFilter}
                onChange={setTypeFilter}
                options={typeOptions}
                fullWidth
              />

              <PayoutToolbarSelect
                label={t('dashboard.tips.payouts_manager.filter_status_label')}
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                fullWidth
              />
            </div>

            {periodFilter === 'custom' ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  className="h-9 rounded-lg border border-[#dde5ef] bg-white px-2 text-xs font-semibold text-[#0b1220] shadow-sm"
                  value={periodFrom}
                  onChange={(e) => setPeriodFrom(e.target.value)}
                />
                <span className="text-xs text-[#687381]">–</span>
                <input
                  type="date"
                  className="h-9 rounded-lg border border-[#dde5ef] bg-white px-2 text-xs font-semibold text-[#0b1220] shadow-sm"
                  value={periodTo}
                  onChange={(e) => setPeriodTo(e.target.value)}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-nexoraBorder bg-white">
        <PayoutList
          payouts={payouts}
          isPending={isPending}
          currentLanguage={currentLanguage}
          t={t}
          onSelectPayout={setSelectedPayoutId}
        />

        <Pagination
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalPages={totalPages}
          totalCount={totalCount}
          hasNextPage={payoutsPage?.hasNextPage}
          hasPreviousPage={payoutsPage?.hasPreviousPage}
          onPageChange={setPage}
          isLoading={isFetching || isFilterPending}
          className="px-4"
        />
      </div>

      <UnpaidTipDebtsPanel
        isOpen={isUnpaidDialogOpen}
        onClose={() => setIsUnpaidDialogOpen(false)}
        debts={unpaidDebts}
        isLoading={isUnpaidTipsPending}
        currentLanguage={currentLanguage}
        t={t}
        onCreatePayout={openCreateForStaff}
        onViewHistory={(staffDebt) => {
          setHistoryStaffProfile(staffDebt)
        }}
      />

      <CreatePayoutModal
        isOpen={isCreateOpen}
        onClose={closeCreate}
        staffList={staff}
        unpaidDebts={unpaidDebts}
        initialStaffProfileId={preferredStaffProfileId}
        editingPayout={editingPayout}
      />

      <PayoutDetailModal
        payout={selectedPayout}
        isLoading={isDetailLoading && Boolean(selectedPayoutId)}
        onClose={() => setSelectedPayoutId(null)}
        onEdit={(payout) => openEdit(payout)}
      />

      <PayoutExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        staffList={staff}
      />

      <PayoutDebtHistoryModal
        staff={historyStaffProfile}
        onClose={() => setHistoryStaffProfile(null)}
      />
    </div>
  )
}
