import { useState, useMemo } from 'react'
import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency } from '../utils'
import CustomSelect from '../../CustomSelect'

function ReportsView({ transactions, staff = [], touchpoints = [] }) {
  const { t } = useTranslation()

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
  }

  // Filter logic
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Date filter
      if (dateRangePreset !== 'all') {
        const txDateStr = tx.dateTime.split(' ')[0]

        if (dateRangePreset === 'today') {
          const todayStr = new Date().toISOString().split('T')[0]
          if (txDateStr !== todayStr) return false
        } else if (dateRangePreset === 'yesterday') {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]
          if (txDateStr !== yesterdayStr) return false
        } else if (dateRangePreset === '7days') {
          const limit = new Date()
          limit.setDate(limit.getDate() - 7)
          const limitStr = limit.toISOString().split('T')[0]
          if (txDateStr < limitStr) return false
        } else if (dateRangePreset === '30days') {
          const limit = new Date()
          limit.setDate(limit.getDate() - 30)
          const limitStr = limit.toISOString().split('T')[0]
          if (txDateStr < limitStr) return false
        } else if (dateRangePreset === 'custom') {
          if (startDate && txDateStr < startDate) return false
          if (endDate && txDateStr > endDate) return false
        }
      }

      // 2. Amount filter
      if (minAmount && tx.amount < parseFloat(minAmount)) return false
      if (maxAmount && tx.amount > parseFloat(maxAmount)) return false

      // 3. Staff filter
      if (selectedStaff !== 'all' && tx.staffName !== selectedStaff) return false

      // 4. Touchpoint filter
      if (selectedTouchpoint !== 'all' && tx.touchpoint !== selectedTouchpoint) return false

      // 5. Payment method filter
      if (selectedPayment !== 'all' && tx.paymentMethod.toLowerCase() !== selectedPayment.toLowerCase()) return false

      // 6. Status filter
      if (selectedStatus !== 'all' && tx.status.toLowerCase() !== selectedStatus.toLowerCase()) return false

      return true
    })
  }, [transactions, dateRangePreset, startDate, endDate, minAmount, maxAmount, selectedStaff, selectedTouchpoint, selectedPayment, selectedStatus])

  // Options memoization
  const staffOptions = useMemo(() => {
    return [
      { value: 'all', label: t('dashboard.activity_log.all_staff') || 'All Staff' },
      ...(staff || []).map(member => ({ value: member.nickname, label: member.nickname }))
    ]
  }, [staff, t])

  const touchpointOptions = useMemo(() => {
    const uniqueFromTx = Array.from(new Set(transactions.map(tx => tx.touchpoint)))
    const uniquePoints = Array.from(new Set([
      ...(touchpoints || []).map(tp => tp.name),
      ...uniqueFromTx
    ])).filter(Boolean)

    return [
      { value: 'all', label: t('dashboard.activity_log.all_touchpoints') || 'All Touch Points' },
      ...uniquePoints.map(name => ({ value: name, label: name }))
    ]
  }, [touchpoints, transactions, t])

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

  const statusColorClass = (status) => {
    if (status?.toLowerCase() === 'success') return 'text-emerald-600 font-semibold'
    if (status?.toLowerCase() === 'failed') return 'text-rose-600 font-semibold'
    return 'text-amber-600 font-semibold'
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('dashboard.menu.transactions')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('dashboard.activity_log.title')}</p>
        </div>
      </div>

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* Date Preset */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
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
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
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
                  className="h-9 w-full rounded-lg border border-nexoraBorder pl-5 pr-1 text-xs outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white transition-all"
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
                  className="h-9 w-full rounded-lg border border-nexoraBorder pl-5 pr-1 text-xs outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Staff */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
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
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
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
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
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
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
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
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                {t('dashboard.activity_log.start_date') || 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 rounded-lg border border-nexoraBorder px-2.5 text-xs outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                {t('dashboard.activity_log.end_date') || 'End Date'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 rounded-lg border border-nexoraBorder px-2.5 text-xs outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white transition-all"
              />
            </div>
          </div>
        )}
      </div>

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
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-nexoraMuted font-medium">
                  {t('dashboard.activity_log.empty_activity') || 'No transactions matched the criteria.'}
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id} className="border-t border-nexoraRule">
                  <td className="px-4 py-3 font-bold text-nexoraText">{tx.id}</td>
                  <td className="px-4 py-3 text-nexoraMuted">{tx.dateTime}</td>
                  <td className="px-4 py-3 font-extrabold text-nexoraText">{formatCurrency(tx.amount)}</td>
                  <td className="px-4 py-3">{tx.staffName}</td>
                  <td className="px-4 py-3">{tx.touchpoint}</td>
                  <td className="px-4 py-3">{tx.paymentMethod}</td>
                  <td className={`px-4 py-3 ${statusColorClass(tx.status)}`}>{tx.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ReportsView
