import { useState, useMemo } from 'react'
import { CreditCard, Coins, X, QrCode, Share2, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { useNotification } from '../../../contexts/NotificationContext'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency } from '../utils'
import CustomSelect from '../../CustomSelect'
import { WalletLogos } from '../constants'
import TransactionFilter from '../../TransactionFilter'

function ReportsView({ transactions, staff = [], touchpoints = [] }) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()

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
  const [selectedTx, setSelectedTx] = useState(null)

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
    if (s === 'success' || s === 'succeeded' || s === 'hoàn thành' || s === 'thành công') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20">
          <CheckCircle className="h-3 w-3" />
          {currentLanguage === 'vi' ? 'Thành công' : 'Success'}
        </span>
      );
    }
    if (s === 'pending' || s === 'processing' || s === 'đang chờ') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-500/20">
          <Clock className="h-3 w-3" />
          {currentLanguage === 'vi' ? 'Đang chờ' : 'Pending'}
        </span>
      );
    }
    if (s === 'failed' || s === 'thất bại' || s === 'lỗi') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-500/20">
          <XCircle className="h-3 w-3" />
          {currentLanguage === 'vi' ? 'Thất bại' : 'Failed'}
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

      // 7. Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchId = tx.id.toLowerCase().includes(q)
        const matchStaff = (tx.staffName || '').toLowerCase().includes(q)
        const matchTouchpoint = (tx.touchpoint || '').toLowerCase().includes(q)
        const matchPayment = (tx.paymentMethod || '').toLowerCase().includes(q)
        if (!matchId && !matchStaff && !matchTouchpoint && !matchPayment) {
          return false
        }
      }

      return true
    })
  }, [transactions, dateRangePreset, startDate, endDate, minAmount, maxAmount, selectedStaff, selectedTouchpoint, selectedPayment, selectedStatus, searchQuery])

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
              <th className="px-4 py-3 text-right">{currentLanguage === 'vi' ? 'Chi tiết' : 'Details'}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-nexoraMuted font-medium">
                  {t('dashboard.activity_log.empty_activity') || 'No transactions matched the criteria.'}
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
                  <td className="px-4 py-3 text-nexoraMuted">{tx.dateTime}</td>
                  <td className="px-4 py-3 font-extrabold text-nexoraText">{formatCurrency(tx.amount)}</td>
                  <td className="px-4 py-3">{tx.staffName}</td>
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
                      {currentLanguage === 'vi' ? 'Chi tiết' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detailed Transaction modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-nexoraBorder shadow-2xl p-6 relative overflow-hidden transition-all duration-300 transform scale-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-nexoraBorder pb-4 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">
                  {t('dashboard.activity_log.modal_title') || 'Transaction Details'}
                </span>
                <h4 className="text-sm font-extrabold text-nexoraText mt-0.5">{selectedTx.id}</h4>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-nexoraMuted hover:text-nexoraText transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5">
              {/* Hero Amount & Status */}
              <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-nexoraMuted uppercase tracking-wider">
                  {t('dashboard.activity_log.col_amount') || 'Amount'}
                </span>
                <h3 className="text-3xl font-black text-nexoraText mt-1">
                  {formatCurrency(selectedTx.amount)}
                </h3>
                {renderStatusBadge(selectedTx.status)}
              </div>

              {/* Data Table / Details Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs border-t border-nexoraBorder pt-4">
                <div>
                  <span className="text-[10px] font-bold text-nexoraMuted block">
                    {t('dashboard.activity_log.col_time') || 'Date & Time'}
                  </span>
                  <span className="font-semibold text-nexoraText block mt-0.5">{selectedTx.dateTime}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-nexoraMuted block">
                    {t('dashboard.activity_log.col_payment') || 'Payment Method'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {getPaymentMethodLogo(selectedTx.paymentMethod)}
                    <span className="font-semibold text-nexoraText">{selectedTx.paymentMethod}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-nexoraMuted block">
                    {t('dashboard.activity_log.col_staff') || 'Staff Name'}
                  </span>
                  <span className="font-semibold text-nexoraText block mt-0.5">{selectedTx.staffName}</span>
                  <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                    ID: {selectedTx.staffId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-nexoraMuted block">
                    {t('dashboard.activity_log.col_tp') || 'Touch Point'}
                  </span>
                  <span className="font-semibold text-nexoraText block mt-0.5">{selectedTx.touchpoint}</span>
                </div>
              </div>

              {/* Tipping QR utility footer */}
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?flow=customer&tech=staff/${encodeURIComponent(selectedTx.staffId)}`)}`}
                  alt="Staff Tipping QR"
                  className="h-20 w-20 object-contain bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0"
                />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase text-nexoraMuted tracking-widest">
                    {currentLanguage === 'vi' ? 'MÃ QR NHẬN TÍP' : 'TIPPING QR CODE'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 leading-normal">
                    {currentLanguage === 'vi' ? 'Quét để chuyển khoản tiền típ cho nhân viên này' : 'Scan to tip this staff member'}
                  </span>
                  {/* Share Link Button */}
                  <button
                    onClick={async () => {
                      const shareUrl = `${window.location.origin}${window.location.pathname}?flow=customer&tech=staff/${encodeURIComponent(selectedTx.staffId)}`;
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: 'Tip ' + selectedTx.staffName,
                            url: shareUrl
                          });
                        } catch (err) {
                          console.log(err);
                        }
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        showToast(currentLanguage === 'vi' ? 'Đã sao chép liên kết nhận típ!' : 'Tipping link copied to clipboard!', 'success');
                      }
                    }}
                    className="mt-2.5 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[10px] font-black uppercase tracking-wider text-indigo-600 transition-colors w-max cursor-pointer"
                  >
                    <Share2 className="h-3 w-3" />
                    {currentLanguage === 'vi' ? 'Chia sẻ liên kết' : 'Share Link'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsView
