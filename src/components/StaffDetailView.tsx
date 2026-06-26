import React, { useState, useMemo, useRef } from 'react'
import {
  ArrowLeft,
  Calendar,
  Check,
  ClipboardList,
  Copy,
  Eye,
  QrCode,
  Star,
  Trash2,
  Wallet,
  Phone,
  Mail
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import { logger } from '../utils/logger'
import { formatTransactionDateTime, formatCurrency } from './dashboard/utils'
import { buildChartPoints, getBezierPath } from './dashboard/overview/chartUtils'
import { useMerchantStaffStats } from '../data/hooks/useMerchantStaff'


function formatIsoDate(date) {
  return date.toISOString().split('T')[0]
}

function getRangeDates(range) {
  const end = new Date()
  const start = new Date()

  if (range === '7 Days') {
    start.setDate(end.getDate() - 6)
  } else if (range === '30 Days') {
    start.setDate(end.getDate() - 29)
  } else if (range === '90 Days') {
    start.setDate(end.getDate() - 89)
  } else if (range === '180 Days') {
    start.setDate(end.getDate() - 179)
  } else if (range === '365 Days') {
    start.setDate(end.getDate() - 364)
  } else {
    start.setDate(end.getDate() - 6)
  }

  return {
    startDate: formatIsoDate(start),
    endDate: formatIsoDate(end),
  }
}

function staffRecordMatchesMember(member, record) {
  if (!member || !record) return false
  const profileId = member.staffProfileId
  const staffCode = member.staffCode
  const linkId = member.id || member.linkId
  const name = member.fullName || member.nickname

  if (profileId && record.staffProfileId === profileId) return true
  if (staffCode && record.staffCode === staffCode) return true
  if (linkId && (record.staffId === linkId || record.id === linkId)) return true
  if (name && record.staffName === name) return true
  return false
}

function buildChartFromTipsTrend(tipsTrend, range, startDate, endDate, t, currentLanguage) {
  if (!tipsTrend?.length) return []

  if (range === '7 Days') {
    const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    return tipsTrend.map((point) => {
      const dateObj = new Date(`${point.date}T00:00:00`)
      const dayIndex = dateObj.getDay()
      const label = t(`common.days.${daysOfWeek[dayIndex]}`)
      return { label, value: point.totalAmount ?? 0 }
    })
  }

  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  const totalTime = end.getTime() - start.getTime()
  const pointsCount = 5
  const monthNames = currentLanguage === 'vi'
    ? ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const chartPoints = []
  for (let i = 0; i < pointsCount; i++) {
    const intervalStart = new Date(start.getTime() + (totalTime / pointsCount) * i)
    const intervalEnd = new Date(start.getTime() + (totalTime / pointsCount) * (i + 1))

    const value = tipsTrend
      .filter((point) => {
        const pointDate = new Date(`${point.date}T00:00:00`)
        return !Number.isNaN(pointDate.getTime()) && pointDate >= intervalStart && pointDate < intervalEnd
      })
      .reduce((sum, point) => sum + (point.totalAmount ?? 0), 0)

    let label = ''
    if (range === '30 Days') {
      label = i === pointsCount - 1
        ? t('components.StaffDetailView.today')
        : `${t('components.StaffDetailView.week')} ${i + 1}`
    } else {
      label = `${monthNames[intervalStart.getMonth()]} ${intervalStart.getDate()}`
    }
    chartPoints.push({ label, value })
  }
  return chartPoints
}

// Helper to render text with styled star rating symbols (★) in luxuryGold and 4px space
function renderTextWithGoldStars(text) {
  if (!text) return null
  const parts = text.split('★')
  return parts.map((part, index) => {
    if (index === parts.length - 1) {
      return part
    }
    return (
      <span key={index}>
        {part}
        <span className="text-luxuryGold ml-flox-4 inline-block font-normal">★</span>
      </span>
    )
  })
}

export default function StaffDetailView({
  staffMember,
  staffProfileId = null,
  onBack,
  transactions = [],
  reviews = [],
  isTipsLoading = false,
  onViewStaff,
  onQr,
  onDelete
}) {
  const { currentLanguage, t } = useTranslation()
  const [copiedWallet, setCopiedWallet] = useState<any | null>(null)
  const [reviewFilter, setReviewFilter] = useState('all') // 'all' | 'google' | 'private'
  const [hoverIndex, setHoverIndex] = useState<any | null>(null)
  const chartRef = useRef(null)

  const initialRange = getRangeDates('7 Days')
  const [range, setRange] = useState('7 Days')
  const [startDate, setStartDate] = useState(initialRange.startDate)
  const [endDate, setEndDate] = useState(initialRange.endDate)

  const statsDateRange = useMemo(() => ({
    dateFrom: `${startDate}T00:00:00.000Z`,
    dateTo: `${endDate}T23:59:59.999Z`,
  }), [startDate, endDate])

  const {
    data: staffStats,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
  } = useMerchantStaffStats(staffProfileId, statsDateRange, { enabled: !!staffProfileId })

  const usesApiStats = !!staffProfileId
  const isMetricsLoading = usesApiStats ? (isStatsLoading || isStatsFetching) : isTipsLoading

  const handleRangeChange = (newRange) => {
    setRange(newRange)
    if (newRange !== 'Custom') {
      const next = getRangeDates(newRange)
      setStartDate(next.startDate)
      setEndDate(next.endDate)
    }
  }

  // 1. Calculate statistics from API stats or legacy tips/reviews lists
  const stats = useMemo(() => {
    if (!staffMember) return null

    if (usesApiStats && staffStats) {
      const { period, allTime } = staffStats
      return {
        totalTips: period.tipsCollected,
        averageRating: Number(allTime.averageRating ?? 0).toFixed(2),
        totalReviews: period.totalReviews ?? allTime.totalReviews ?? 0,
        specialty: staffMember.roleAtBusiness || staffMember.position || '',
        recentTransactions: staffStats.recentTips,
        filteredReviews: staffStats.recentReviews,
        tipsTrend: period.tipsTrend,
      }
    }

    const staffTx = transactions.filter((tx) => staffRecordMatchesMember(staffMember, tx))
    const staffReviews = reviews.filter((rev) => staffRecordMatchesMember(staffMember, rev))

    const staffTxFiltered = staffTx.filter((tx) => {
      const rawDate = tx.dateTime?.split('T')[0] || tx.dateTime?.split(' ')[0] || ''
      return rawDate >= startDate && rawDate <= endDate
    })

    const staffReviewsFiltered = staffReviews.filter((rev) => {
      const rawDate = rev.createdAt?.split('T')[0] || rev.date?.split(',')[0] || rev.date || ''
      return rawDate >= startDate && rawDate <= endDate
    })

    const totalTips = staffTxFiltered.reduce(
      (sum, tx) => (tx.status === 'Success' || tx.status === 'Confirmed' ? sum + tx.amount : sum),
      0,
    )

    const ratedReviews = staffReviewsFiltered.filter((rev) => Number(rev.rating) > 0)
    const averageRating = ratedReviews.length > 0
      ? (ratedReviews.reduce((sum, rev) => sum + Number(rev.rating), 0) / ratedReviews.length).toFixed(2)
      : Number(staffMember.averageRating ?? 0).toFixed(2)

    const totalReviews = staffReviewsFiltered.length

    return {
      totalTips,
      averageRating,
      totalReviews,
      specialty: staffMember.roleAtBusiness || staffMember.position || '',
      recentTransactions: staffTxFiltered,
      filteredReviews: staffReviewsFiltered,
      tipsTrend: null,
    }
  }, [staffMember, usesApiStats, staffStats, transactions, reviews, startDate, endDate])

  // 2. Generate tips over time data for SVG chart
  const chartData = useMemo(() => {
    if (!stats) return []

    if (usesApiStats && stats.tipsTrend) {
      return buildChartFromTipsTrend(stats.tipsTrend, range, startDate, endDate, t, currentLanguage)
    }

    const txList = stats.recentTransactions.filter(
      (tx) => tx.status === 'Success' || tx.status === 'Confirmed',
    )

    const sumTxInRange = (predicate) => txList
      .filter(predicate)
      .reduce((sum, tx) => sum + tx.amount, 0)

    if (range === '7 Days') {
      const dates = []
      let curr = new Date(startDate + 'T00:00:00')
      const end = new Date(endDate + 'T00:00:00')
      while (curr <= end) {
        dates.push(curr.toISOString().split('T')[0])
        curr.setDate(curr.getDate() + 1)
      }

      return dates.map((dateStr) => {
        const dateObj = new Date(dateStr + 'T00:00:00')
        const dayIndex = dateObj.getDay()
        const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        const label = t(`common.days.${daysOfWeek[dayIndex]}`)
        const value = sumTxInRange((tx) => {
          const rawDate = tx.dateTime?.split('T')[0] || tx.dateTime?.split(' ')[0] || ''
          return rawDate === dateStr || tx.dateTime?.startsWith(dateStr)
        })
        return { label, value }
      })
    }

    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')
    const totalTime = end.getTime() - start.getTime()
    const pointsCount = 5
    const monthNames = currentLanguage === 'vi'
      ? ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const chartPoints = []
    for (let i = 0; i < pointsCount; i++) {
      const intervalStart = new Date(start.getTime() + (totalTime / pointsCount) * i)
      const intervalEnd = new Date(start.getTime() + (totalTime / pointsCount) * (i + 1))

      const value = sumTxInRange((tx) => {
        const txDate = new Date(tx.dateTime)
        return !Number.isNaN(txDate.getTime()) && txDate >= intervalStart && txDate < intervalEnd
      })

      let label = ''
      if (range === '30 Days') {
        label = i === pointsCount - 1
          ? t('components.StaffDetailView.today')
          : `${t('components.StaffDetailView.week')} ${i + 1}`
      } else {
        label = `${monthNames[intervalStart.getMonth()]} ${intervalStart.getDate()}`
      }
      chartPoints.push({ label, value })
    }
    return chartPoints
  }, [stats, usesApiStats, t, range, startDate, endDate, currentLanguage])

  const { points: chartPoints, max: chartMax, width: chartWidth, height: chartHeight } = useMemo(
    () => buildChartPoints(chartData),
    [chartData],
  )
  const chartLinePath = useMemo(() => getBezierPath(chartPoints), [chartPoints])
  const chartAreaPath = useMemo(() => {
    if (chartPoints.length === 0) return ''
    return `${chartLinePath} L ${chartPoints[chartPoints.length - 1].x} ${chartHeight} L ${chartPoints[0].x} ${chartHeight} Z`
  }, [chartLinePath, chartPoints, chartHeight])
  const chartYTicks = useMemo(
    () => [chartMax, Math.round(chartMax * 0.75), Math.round(chartMax * 0.5), Math.round(chartMax * 0.25), 0],
    [chartMax],
  )

  if (!staffMember) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-3 nexora-card p-6">
        <div className="text-sm font-semibold text-nexoraMuted">{t('staff_detail.not_found')}</div>
        <button onClick={onBack} className="nexora-primary-button">{t('staff_detail.back_to_directory')}</button>
      </div>
    )
  }

  if (usesApiStats && isStatsLoading && !staffStats) {
    return (
      <div className="nexora-card p-6">
        <div className="h-64 animate-pulse rounded-lg bg-nexoraSurfaceMuted" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-3 nexora-card p-6">
        <div className="text-sm font-semibold text-nexoraMuted">{t('staff_detail.not_found')}</div>
        <button onClick={onBack} className="nexora-primary-button">{t('staff_detail.back_to_directory')}</button>
      </div>
    )
  }

  // Handle copy address to clipboard
  const handleCopy = (walletKey, address) => {
    if (!address) return
    navigator.clipboard.writeText(address).then(() => {
      setCopiedWallet(walletKey)
      setTimeout(() => setCopiedWallet(null), 1800)
    }).catch(err => {
      logger.error('Failed to copy:', err)
    })
  }

  // Filter reviews feed by category tab
  const displayReviews = (() => {
    const allMatching = usesApiStats && staffStats
      ? staffStats.recentReviews
      : reviews.filter((r) => staffRecordMatchesMember(staffMember, r))

    if (reviewFilter === 'all') return allMatching
    if (reviewFilter === 'google') return allMatching.filter((r) => r.category === 'google' || r.rating >= 4)
    if (reviewFilter === 'private') return allMatching.filter((r) => r.category === 'private' || r.rating < 4)
    return allMatching
  })()

  // Handle Scrubbing interaction on SVG chart
  const handlePointerMove = (event) => {
    if (chartPoints.length === 0) return
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect) return
    const relativeX = (event.clientX - rect.left) / rect.width
    const clampedX = Math.min(1, Math.max(0, relativeX))
    const index = Math.round(clampedX * (chartPoints.length - 1))
    setHoverIndex(index)
  }

  const handlePointerLeave = () => {
    setHoverIndex(null)
  }

  const activePoint = hoverIndex !== null && chartPoints.length > 0 ? chartPoints[hoverIndex] : null

  return (
    <div className="space-y-6 select-none">
      {/* 1. HEADER PROFILE CARD */}
      <div className="relative overflow-hidden nexora-card p-5 shadow-nexora-soft">
        {/* Glow backdrop decorative bubbles */}
        <div className="absolute -right-16 -top-16 h-36 w-36 bg-nexoraBrand/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 h-36 w-36 bg-brandCyan/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-nexoraBorder bg-white text-nexoraText hover:bg-nexoraSurfaceMuted transition"
                title={t('common.back')}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}

            {staffMember.avatar ? (
              <img
                src={staffMember.avatar}
                alt={staffMember.fullName}
                className="h-16 w-16 rounded-full border border-nexoraBorder object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-nexoraBrand to-nexoraLavender text-xl font-black text-white shadow-md">
                {(staffMember.nickname || staffMember.fullName || 'N').charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-nexoraText sm:text-2xl">{staffMember.fullName}</h1>
                <div className="flex gap-1">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                      staffMember.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {staffMember.isActive ? t('common.active') : t('common.inactive')}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                      staffMember.showInTipsFlow !== false
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {staffMember.showInTipsFlow !== false ? (t('common.show_in_tips')) : (t('common.hide_in_tips'))}
                  </span>
                </div>
              </div>
              <p className="text-xs font-semibold text-nexoraMuted">{stats.specialty || staffMember.position}</p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-nexoraSubtle">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-brandCyan" />
                  {staffMember.joinedDate
                    ? `${t('staff_detail.joined_gateway')}: ${staffMember.joinedDate}`
                    : t('staff_detail.joined_gateway')}
                </div>
                {staffMember.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-brandCyan" /> {staffMember.phone}
                  </div>
                )}
                {staffMember.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-brandCyan" /> {staffMember.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onQr(staffMember)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraText shadow-sm hover:bg-nexoraSurfaceMuted transition"
            >
              <QrCode className="h-4 w-4 text-brandCyan" /> {t('staff_detail.personal_qr')}
            </button>
            {onViewStaff && (
              <button
                onClick={() => onViewStaff(staffMember)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraText shadow-sm hover:bg-nexoraSurfaceMuted transition"
              >
                <Eye className="h-4 w-4 text-nexoraBrand" /> {t('common.view_detail')}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(staffMember.id)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                title={t('staff_detail.delete_tech')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* KPI 1: Tips */}
        <div className="nexora-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-indigo-50 p-2 text-nexoraBrand">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-nexoraMuted">{t('staff_detail.tips_collected')}</p>
          <p className="mt-1 text-2xl font-black text-nexoraText">
            {isMetricsLoading ? '—' : formatCurrency(stats.totalTips)}
          </p>
        </div>

        {/* KPI 2: Avg Rating */}
        <div className="nexora-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-500">
              <Star className="h-5 w-5 fill-current" />
            </div>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-nexoraMuted">{t('staff_detail.avg_rating')}</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-nexoraText">{stats.averageRating}</span>
            <span className="text-xs text-nexoraMuted">/ 5.0</span>
          </div>
        </div>

        {/* KPI 3: Total Reviews */}
        <div className="nexora-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-nexoraMuted">{t('staff_detail.total_reviews')}</p>
          <p className="mt-1 text-2xl font-black text-nexoraText">
            {isMetricsLoading ? '—' : stats.totalReviews}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        {/* 3. WEEKLY TIPS TREND CHART */}
        <div className="nexora-card flex min-w-0 flex-col p-5 shadow-sm">
        <div className="mb-4 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">
            {range === '7 Days' ? t('staff_detail.weekly_trend') : (t('components.StaffDetailView.tipsPerformanceTrend'))}
          </h2>
          <div className="-mx-1 overflow-x-auto pb-1 sm:mx-0 sm:overflow-visible sm:pb-0">
            <div className="flex min-w-max items-center gap-1.5 px-1 sm:min-w-0 sm:flex-wrap sm:justify-end sm:gap-2 sm:px-0">
            {['7 Days', '30 Days', '90 Days', '180 Days', '365 Days', 'Custom'].map((item) => {
              const rangeLabel = (itm) => {
                return {
                  '7 Days': t('dashboard.chart.7_days'),
                  '30 Days': t('dashboard.chart.30_days'),
                  '90 Days': t('dashboard.chart.90_days'),
                  '180 Days': t('dashboard.chart.180_days'),
                  '365 Days': t('dashboard.chart.365_days')
                }[itm] || itm
              }
              return (
                <button
                  key={item}
                  onClick={() => handleRangeChange(item)}
                  className={`min-h-8 rounded-lg px-3 text-[11px] font-bold transition cursor-pointer ${
                    range === item
                      ? 'bg-nexoraBrand text-white shadow-sm'
                      : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:text-nexoraText hover:bg-slate-200'
                  }`}
                >
                  {item === 'Custom'
                    ? (t('components.StaffDetailView.custom'))
                    : rangeLabel(item)}
                </button>
              )
            })}
            </div>
          </div>
        </div>

        {range === 'Custom' && (
          <div className="mb-4 flex shrink-0 flex-wrap items-center justify-end gap-3 animate-fadeIn border-t border-dashed border-nexoraRule pt-3">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold uppercase text-nexoraMuted tracking-wider">
                {t('components.StaffDetailView.from')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
                className="h-8 rounded border border-nexoraBorder px-2.5 text-xs font-semibold outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white cursor-pointer animate-fadeIn"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold uppercase text-nexoraMuted tracking-wider">
                {t('components.StaffDetailView.to')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="h-8 rounded border border-nexoraBorder px-2.5 text-xs font-semibold outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white cursor-pointer animate-fadeIn"
              />
            </div>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(28px,auto)_minmax(0,1fr)] items-stretch gap-1 sm:grid-cols-[40px_1fr] sm:gap-2">
          <div className="flex h-full flex-col justify-between pb-6 text-right text-[9px] leading-none text-nexoraSubtle sm:text-[10px]">
            {chartYTicks.map((tick, index) => (
              <span key={`${tick}-${index}`} className="whitespace-nowrap">
                {formatCurrency(tick).replace('.00', '')}
              </span>
            ))}
          </div>
          <div
            ref={chartRef}
            className="relative flex min-h-0 min-w-0 flex-1 cursor-crosshair flex-col select-none"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <div className="relative min-h-[120px] w-full flex-1">
              <svg
                className="h-full w-full overflow-visible"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="staff-chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4648D8" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#4648D8" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="staff-line-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4648D8" />
                    <stop offset="100%" stopColor="#32D7FF" />
                  </linearGradient>
                </defs>

                {chartYTicks.map((tick, index) => {
                  const yVal = chartMax === 0 ? chartHeight : chartHeight - (tick / chartMax) * chartHeight
                  return (
                    <line
                      key={`grid-${tick}-${index}`}
                      x1="0"
                      x2={chartWidth}
                      y1={yVal}
                      y2={yVal}
                      className="stroke-slate-100"
                      strokeWidth="1.5"
                    />
                  )
                })}

                {chartAreaPath && (
                  <path d={chartAreaPath} fill="url(#staff-chart-grad)" />
                )}

                {chartLinePath && (
                  <path
                    d={chartLinePath}
                    fill="none"
                    stroke="url(#staff-line-grad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                )}

                {activePoint && (
                  <line
                    x1={activePoint.x}
                    x2={activePoint.x}
                    y1="0"
                    y2={chartHeight}
                    className="stroke-slate-300"
                    strokeWidth="1.5"
                  />
                )}
              </svg>

              {chartPoints.map((pt, i) => (
                <div
                  key={i}
                  className="pointer-events-none absolute h-2.5 w-2.5 rounded-full border-[2.5px] border-nexoraBrand bg-white shadow-sm"
                  style={{
                    left: `calc(${(pt.x / chartWidth) * 100}% - 5px)`,
                    top: `calc(${(pt.y / chartHeight) * 100}% - 5px)`,
                    zIndex: 8
                  }}
                />
              ))}

              {activePoint && (
                <>
                  <div
                    className="pointer-events-none absolute h-4 w-4 rounded-full bg-nexoraBrand/10 animate-ping"
                    style={{
                      left: `calc(${(activePoint.x / chartWidth) * 100}% - 8px)`,
                      top: `calc(${(activePoint.y / chartHeight) * 100}% - 8px)`,
                      zIndex: 9
                    }}
                  />
                  <div
                    className="pointer-events-none absolute h-[13px] w-[13px] rounded-full border-[2.5px] border-white bg-nexoraBrand shadow-md"
                    style={{
                      left: `calc(${(activePoint.x / chartWidth) * 100}% - 6.5px)`,
                      top: `calc(${(activePoint.y / chartHeight) * 100}% - 6.5px)`,
                      zIndex: 10
                    }}
                  />
                </>
              )}

              {activePoint && (
                <div
                  className="absolute bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none transition-all duration-75"
                  style={{
                    left: `clamp(0px, calc(${(activePoint.x / chartWidth) * 100}% - 40px), calc(100% - 80px))`,
                    top: `clamp(4px, calc(${(activePoint.y / chartHeight) * 100}% - 38px), calc(100% - 40px))`,
                    zIndex: 11
                  }}
                >
                  {t('staff_detail.tooltip_tips')} {formatCurrency(activePoint.value)}
                </div>
              )}
            </div>

            <div className="mt-1 flex shrink-0 justify-between gap-0.5 text-[10px] font-semibold text-nexoraSubtle sm:text-[11px]">
              {chartData.map((d, i) => (
                <span key={`${d.label}-${i}`} className="min-w-0 flex-1 truncate text-center first:text-left last:text-right">
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
        </div>

        {/* 4. WALLET DETAILS / ADRESSES */}
        <div className="nexora-card flex min-w-0 flex-col justify-between p-5 shadow-sm">
          <div>
            <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider mb-1">{t('staff_detail.direct_wallets')}</h2>
            <p className="text-xs text-nexoraMuted mb-4">{t('staff_detail.direct_wallets_desc')}</p>
          </div>

          <div className="space-y-3">
            {Object.entries(staffMember.paymentAccounts || {})
              .filter(([key]) => key !== 'bankwire')
              .map(([key, value]) => {
              const label = {
                venmo: 'Venmo',
                cashapp: 'Cash App',
                zelle: 'Zelle',
                vlinkpay: 'VLINKPAY',
                paypal: 'PayPal',
                bankwire: 'Bank Wire',
                applecash: 'Apple Cash'
              }[key] || key
              const isConfigured = Boolean(value)
              const isCopied = copiedWallet === key

              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-3 rounded-lg border text-xs transition ${
                    isConfigured
                      ? 'bg-nexoraSurfaceMuted border-nexoraBorder'
                      : 'bg-slate-50/30 border-dashed border-nexoraBorder opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-nexoraText">{label}</span>
                    {isConfigured ? (
                      <span className="font-mono text-nexoraMuted">{String(value ?? '')}</span>
                    ) : (
                      <span className="italic text-nexoraSubtle">{t('staff_detail.not_configured')}</span>
                    )}
                  </div>

                  {isConfigured && (
                    <button
                      onClick={() => handleCopy(key, value)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-bold transition ${
                        isCopied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-nexoraMuted border border-nexoraBorder hover:bg-nexoraSurfaceMuted'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 stroke-[3px]" /> {t('common.copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> {t('common.copy')}
                        </>
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 5. RECENT TRANSACTIONS LEDGER */}
      <div className="nexora-card p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider mb-4">{t('staff_detail.recent_ledger')}</h2>
        {stats.recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                <tr>
                  <th className="px-4 py-3">{t('staff_detail.col_id')}</th>
                  <th className="px-4 py-3">{t('staff_detail.col_date')}</th>
                  <th className="px-4 py-3">{t('staff_detail.col_amount')}</th>
                  <th className="px-4 py-3">{t('staff_detail.col_station')}</th>
                  <th className="px-4 py-3">{t('staff_detail.col_method')}</th>
                  <th className="px-4 py-3 text-right">{t('staff_detail.col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-nexoraRule hover:bg-slate-50/50">
                    <td className="px-4 py-3.5 font-bold text-nexoraText">{tx.id}</td>
                    <td className="px-4 py-3.5 text-nexoraMuted">{formatTransactionDateTime(tx.dateTime, currentLanguage)}</td>
                    <td className="px-4 py-3.5 font-black text-nexoraText">{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-3.5 text-nexoraMuted">{tx.touchpoint}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded bg-nexoraSurfaceMuted px-1.5 py-0.5 font-semibold text-[10px] text-nexoraText">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                      {tx.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center text-center p-4">
            <div className="text-xs text-nexoraMuted font-semibold">{t('staff_detail.no_tips_yet')}</div>
            <p className="text-[10px] text-nexoraSubtle mt-1">{t('staff_detail.no_tips_desc')}</p>
          </div>
        )}
      </div>

      {/* 6. REVIEWS ROUTING FILTERABLE FEED */}
      <div className="nexora-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">{t('staff_detail.filtered_reviews')}</h2>
            <p className="text-xs text-nexoraMuted mt-0.5">{t('staff_detail.reviews_desc')}</p>
          </div>

          <div className="flex gap-1.5 self-start">
            {[
              { id: 'all', label: t('staff_detail.tab_all') },
              { id: 'google', label: t('staff_detail.tab_google') },
              { id: 'private', label: t('staff_detail.tab_private') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReviewFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition ${
                  reviewFilter === tab.id
                    ? 'bg-nexoraBrand text-white shadow-sm'
                    : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
                }`}
              >
                {renderTextWithGoldStars(tab.label)}
              </button>
            ))}
          </div>
        </div>

        {displayReviews.length > 0 ? (
          <div className="space-y-4">
            {displayReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl border border-nexoraRule bg-slate-50/50 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < rev.rating ? 'fill-current' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        rev.rating >= 4
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {rev.category}
                    </span>
                  </div>

                  <p className="text-xs text-nexoraText italic leading-relaxed">
                    {rev.comment}
                  </p>
                  <p className="text-[10px] text-nexoraSubtle font-medium">
                    Logged: {rev.date}
                  </p>
                </div>

                <div className="self-end sm:self-start shrink-0 text-right">
                  <span
                    className={`inline-block text-[10px] font-black uppercase tracking-wider rounded-lg px-2.5 py-1 ${
                      rev.rating >= 4
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {rev.rating >= 4 ? t('staff_detail.publicly_routed') : t('staff_detail.private_recovery')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center text-center p-4">
            <div className="text-xs text-nexoraMuted font-semibold">{t('staff_detail.no_reviews_matching')}</div>
            <p className="text-[10px] text-nexoraSubtle mt-1">{t('staff_detail.no_reviews_desc')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
