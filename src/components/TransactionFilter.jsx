import React from 'react'
import { SlidersHorizontal, RotateCcw, Search } from 'lucide-react'
import CustomSelect from './CustomSelect'
import { useTranslation } from '../contexts/LanguageContext'

export default function TransactionFilter({
  searchQuery,
  setSearchQuery,
  dateRangePreset,
  setDateRangePreset,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  selectedStaff,
  setSelectedStaff,
  selectedTouchpoint,
  setSelectedTouchpoint,
  selectedPayment,
  setSelectedPayment,
  selectedStatus,
  setSelectedStatus,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  resetFilters,
  staffOptions = [],
  touchpointOptions = []
}) {
  const { t } = useTranslation()

  const paymentOptions = [
    { value: 'all', label: t('dashboard.activity_log.all_payments') || 'All Payment Methods' },
    { value: 'Venmo', label: 'Venmo' },
    { value: 'Cash App', label: 'Cash App' },
    { value: 'Zelle', label: 'Zelle' },
    { value: 'VLINKPAY', label: 'VLINKPAY' }
  ]

  const statusOptions = [
    { value: 'all', label: t('dashboard.activity_log.all_statuses') || 'All Statuses' },
    { value: 'Success', label: 'Success' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Failed', label: 'Failed' }
  ]

  const datePresetOptions = [
    { value: 'all', label: t('dashboard.activity_log.preset_all') || 'All Time' },
    { value: 'today', label: t('dashboard.activity_log.preset_today') || 'Today' },
    { value: 'yesterday', label: t('dashboard.activity_log.preset_yesterday') || 'Yesterday' },
    { value: '7days', label: t('dashboard.activity_log.preset_7days') || 'Last 7 Days' },
    { value: '30days', label: t('dashboard.activity_log.preset_30days') || 'Last 30 Days' },
    { value: 'custom', label: t('dashboard.activity_log.preset_custom') || 'Custom Range' }
  ]

  return (
    <div className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-nexoraRule pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-nexoraBrand" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-nexoraText">
            {t('dashboard.activity_log.filter_title') || 'Filters'}
          </h3>
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 text-xs font-bold text-nexoraMuted hover:text-nexoraBrand transition-colors cursor-pointer select-none"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('dashboard.activity_log.filter_reset') || 'Reset'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {/* Search Query */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase text-nexoraMuted tracking-wider">
            {t('dashboard.activity_log.filter_search') || 'Search'}
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nexoraSubtle" />
            <input
              type="text"
              placeholder={t('dashboard.activity_log.search_placeholder') || 'Search ID, staff, touchpoint...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded border border-nexoraBorder pl-8 pr-2.5 text-xs font-semibold font-sans outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white transition-all"
            />
          </div>
        </div>

        {/* Date Preset */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase text-nexoraMuted tracking-wider">
            {t('dashboard.activity_log.filter_date') || 'Date'}
          </label>
          <CustomSelect
            size="sm"
            value={dateRangePreset}
            onChange={(e) => setDateRangePreset(e.target.value)}
            options={datePresetOptions}
          />
        </div>

        {/* Amount range */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase text-nexoraMuted tracking-wider">
            {t('dashboard.activity_log.filter_amount') || 'Amount'}
          </label>
          <div className="flex items-center gap-1.5">
            <div className="relative w-full">
              <span className="absolute left-2 top-[8.5px] text-[10px] font-bold text-nexoraSubtle">$</span>
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="h-9 w-full rounded border border-nexoraBorder pl-5 pr-1 text-xs font-semibold font-sans outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white transition-all"
              />
            </div>
            <span className="text-nexoraSubtle text-xs">-</span>
            <div className="relative w-full">
              <span className="absolute left-2 top-[8.5px] text-[10px] font-bold text-nexoraSubtle">$</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="h-9 w-full rounded border border-nexoraBorder pl-5 pr-1 text-xs font-semibold font-sans outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Staff */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase text-nexoraMuted tracking-wider">
            {t('dashboard.activity_log.filter_staff') || 'Staff'}
          </label>
          <CustomSelect
            size="sm"
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            options={staffOptions}
          />
        </div>

        {/* Touch Point */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase text-nexoraMuted tracking-wider">
            {t('dashboard.activity_log.filter_tp') || 'Touch Point'}
          </label>
          <CustomSelect
            size="sm"
            value={selectedTouchpoint}
            onChange={(e) => setSelectedTouchpoint(e.target.value)}
            options={touchpointOptions}
          />
        </div>

        {/* Payment Method */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase text-nexoraMuted tracking-wider">
            {t('dashboard.activity_log.filter_payment') || 'Payment method'}
          </label>
          <CustomSelect
            size="sm"
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            options={paymentOptions}
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase text-nexoraMuted tracking-wider">
            {t('dashboard.activity_log.filter_status') || 'Status'}
          </label>
          <CustomSelect
            size="sm"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Custom date range selection */}
      {dateRangePreset === 'custom' && (
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-dashed border-nexoraRule transition-all">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold uppercase text-nexoraMuted tracking-wider">
              {t('dashboard.activity_log.start_date') || 'Start Date'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 rounded border border-nexoraBorder px-2.5 text-xs font-semibold font-sans outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold uppercase text-nexoraMuted tracking-wider">
              {t('dashboard.activity_log.end_date') || 'End Date'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 rounded border border-nexoraBorder px-2.5 text-xs font-semibold font-sans outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white transition-all"
            />
          </div>
        </div>
      )}
    </div>
  )
}
