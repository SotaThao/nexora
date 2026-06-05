import React, { useState, useMemo, useRef } from 'react'
import {
  ArrowLeft,
  Calendar,
  Check,
  ClipboardList,
  Copy,
  Edit2,
  ExternalLink,
  QrCode,
  Star,
  Trash2,
  TrendingUp,
  Wallet,
  Phone,
  Mail
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'

// Helper to format values as USD currency
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
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
  onBack,
  transactions,
  reviews,
  onEdit,
  onQr,
  onDelete
}) {
  const { t } = useTranslation()
  const [copiedWallet, setCopiedWallet] = useState(null)
  const [reviewFilter, setReviewFilter] = useState('all') // 'all' | 'google' | 'private'
  const [hoverIndex, setHoverIndex] = useState(null)
  const chartRef = useRef(null)

  // 1. Calculate baseline and dynamic statistics
  const stats = useMemo(() => {
    if (!staffMember) return null

    // Determine baseline stats from mock metrics (matching nickname/name)
    const basePerformances = {
      'Mia T.': { tips: 612.3, rating: 4.86, reviews: 58, specialty: 'Gel-X Lead', conversion: 24.6 },
      'Vivian L.': { tips: 487.45, rating: 4.72, reviews: 47, specialty: 'Acrylic Specialist', conversion: 20.2 },
      'Ashley P.': { tips: 402.1, rating: 4.69, reviews: 39, specialty: 'Pedicure Lead', conversion: 18.7 },
      'Hanna Ng.': { tips: 318.25, rating: 4.61, reviews: 28, specialty: 'Nail Art Designer', conversion: 16.8 },
      'Hannah K.': { tips: 276.58, rating: 4.57, reviews: 24, specialty: 'Dip Powder Specialist', conversion: 15.1 }
    }

    const baseline = basePerformances[staffMember.nickname] || {
      tips: 0,
      rating: 5.0,
      reviews: 0,
      specialty: staffMember.position || 'Nail Tech',
      conversion: 20.0
    }

    // Filter transactions associated with this tech
    const staffTx = transactions.filter(
      (tx) => tx.staffId === staffMember.id || tx.staffName === staffMember.nickname
    )

    // Filter reviews associated with this tech
    const staffReviews = reviews.filter(
      (rev) => rev.staffId === staffMember.id || rev.staffName === staffMember.nickname
    )

    // Calculate alignment values (exact match to dashboard leaderboard data)
    const totalTips = baseline.tips
    const totalReviews = baseline.reviews
    const averageRating = baseline.rating.toFixed(2)
    const conversion = baseline.conversion
    const mockScans = Math.round(totalReviews / (conversion / 100))

    return {
      totalTips,
      averageRating,
      totalReviews,
      conversion,
      specialty: baseline.specialty,
      recentTransactions: staffTx,
      filteredReviews: staffReviews,
      scansCount: mockScans
    }
  }, [staffMember, transactions, reviews])

  // 2. Generate tips over time data for SVG chart
  const chartData = useMemo(() => {
    if (!stats) return []
    const total = stats.totalTips
    const percentages = [0.12, 0.16, 0.22, 0.14, 0.18, 0.15, 0.03] // Weekly tip distribution
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    return days.map((day, index) => ({
      label: t(`common.days.${day}`),
      value: total * percentages[index]
    }))
  }, [stats, t])

  // 3. Build bezier points for weekly trend SVG
  const svgMetrics = useMemo(() => {
    if (chartData.length === 0) return null
    const width = 500
    const height = 150
    const values = chartData.map((d) => d.value)
    const maxVal = Math.max(...values, 10)
    const roundedMax = Math.ceil(maxVal / 20) * 20

    const points = chartData.map((d, i) => ({
      x: (i / (chartData.length - 1)) * width,
      y: height - (d.value / roundedMax) * height,
      label: d.label,
      value: d.value
    }))

    // Bezier path generator
    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const cp1x = p0.x + (p1.x - p0.x) / 3
      const cp1y = p0.y
      const cp2x = p0.x + (2 * (p1.x - p0.x)) / 3
      const cp2y = p1.y
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`
    }

    const areaPath = `${path} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

    return { points, max: roundedMax, width, height, path, areaPath }
  }, [chartData])

  if (!staffMember || !stats) {
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
      console.error('Failed to copy:', err)
    })
  }

  // Filter reviews feed by category tab
  const displayReviews = (() => {
    // Render relevant reviews from reviews state matching staff nickname
    const allMatching = reviews.filter(r => r.staffId === staffMember.id || r.staffName === staffMember.nickname)
    
    if (reviewFilter === 'all') return allMatching
    if (reviewFilter === 'google') return allMatching.filter(r => r.rating >= 4)
    if (reviewFilter === 'private') return allMatching.filter(r => r.rating < 4)
    return allMatching
  })()

  // Handle Scrubbing interaction on SVG chart
  const handlePointerMove = (event) => {
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect || !svgMetrics) return
    const relativeX = (event.clientX - rect.left) / rect.width
    const clampedX = Math.min(1, Math.max(0, relativeX))
    const index = Math.round(clampedX * (svgMetrics.points.length - 1))
    setHoverIndex(index)
  }

  const handlePointerLeave = () => {
    setHoverIndex(null)
  }

  const activePoint = hoverIndex !== null && svgMetrics ? svgMetrics.points[hoverIndex] : null

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
                {staffMember.nickname.charAt(0)}
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
                    {staffMember.showInTipsFlow !== false ? (t('common.show_in_tips') || 'Hiện trong tips') : (t('common.hide_in_tips') || 'Ẩn trong tips')}
                  </span>
                </div>
              </div>
              <p className="text-xs font-semibold text-nexoraMuted">{stats.specialty || staffMember.position}</p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-nexoraSubtle">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-brandCyan" /> {t('staff_detail.joined_gateway')}
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
            <button
              onClick={() => onEdit(staffMember)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraText shadow-sm hover:bg-nexoraSurfaceMuted transition"
            >
              <Edit2 className="h-4 w-4 text-luxuryGold" /> {t('staff_detail.edit_profile')}
            </button>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Tips */}
        <div className="nexora-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-indigo-50 p-2 text-nexoraBrand">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" /> +14.2%
            </span>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-nexoraMuted">{t('staff_detail.tips_collected')}</p>
          <p className="mt-1 text-2xl font-black text-nexoraText">{formatCurrency(stats.totalTips)}</p>
        </div>

        {/* KPI 2: Avg Rating */}
        <div className="nexora-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-500">
              <Star className="h-5 w-5 fill-current" />
            </div>
            <span className="text-xs font-bold text-amber-600">High Rating</span>
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
            <span className="text-xs font-bold text-emerald-600">Direct Route</span>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-nexoraMuted">{t('staff_detail.reviews_routed')}</p>
          <p className="mt-1 text-2xl font-black text-nexoraText">{t('staff_detail.reviews_count', { count: stats.totalReviews })}</p>
        </div>

        {/* KPI 4: Conversion */}
        <div className="nexora-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-rose-50 p-2 text-rose-500">
              <ExternalLink className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-nexoraMuted">{t('staff_detail.scans', { count: stats.scansCount })}</span>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-nexoraMuted">{t('staff_detail.conversion_rate')}</p>
          <p className="mt-1 text-2xl font-black text-nexoraText">{stats.conversion}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 3. WEEKLY TIPS TREND CHART */}
        <div className="nexora-card p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider mb-4">{t('staff_detail.weekly_trend')}</h2>
          {svgMetrics ? (
            <div className="space-y-4">
              <div
                ref={chartRef}
                className="relative cursor-crosshair select-none pb-4"
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              >
                <div className="relative h-[150px] w-full">
                  <svg
                    className="h-full w-full overflow-visible"
                    viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}
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

                    {/* Horizontal grid lines */}
                    {[0.25, 0.5, 0.75, 1].map((ratio) => (
                      <line
                        key={ratio}
                        x1="0"
                        x2={svgMetrics.width}
                        y1={svgMetrics.height * (1 - ratio)}
                        y2={svgMetrics.height * (1 - ratio)}
                        className="stroke-slate-100"
                        strokeWidth="1.5"
                      />
                    ))}

                    {/* Area fill */}
                    <path d={svgMetrics.areaPath} fill="url(#staff-chart-grad)" />

                    {/* Bezier Line */}
                    <path
                      d={svgMetrics.path}
                      fill="none"
                      stroke="url(#staff-line-grad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Active Scrubber guide line */}
                    {activePoint && (
                      <line
                        x1={activePoint.x}
                        x2={activePoint.x}
                        y1="0"
                        y2={svgMetrics.height}
                        className="stroke-slate-300"
                        strokeWidth="1.5"
                      />
                    )}
                  </svg>

                  {/* Regular data points (rendered as HTML to prevent distortion) */}
                  {svgMetrics.points.map((pt, i) => (
                    <div
                      key={i}
                      className="pointer-events-none absolute h-2.5 w-2.5 rounded-full border-[2.5px] border-nexoraBrand bg-white shadow-sm"
                      style={{
                        left: `calc(${(pt.x / svgMetrics.width) * 100}% - 5px)`,
                        top: `calc(${(pt.y / svgMetrics.height) * 100}% - 5px)`,
                        zIndex: 8
                      }}
                    />
                  ))}

                  {/* Active Scrubber elements (rendered as HTML to prevent distortion) */}
                  {activePoint && (
                    <>
                      {/* Pulsing ring */}
                      <div
                        className="pointer-events-none absolute h-4 w-4 rounded-full bg-nexoraBrand/10 animate-ping"
                        style={{
                          left: `calc(${(activePoint.x / svgMetrics.width) * 100}% - 8px)`,
                          top: `calc(${(activePoint.y / svgMetrics.height) * 100}% - 8px)`,
                          zIndex: 9
                        }}
                      />
                      {/* Main active dot */}
                      <div
                        className="pointer-events-none absolute h-[13px] w-[13px] rounded-full border-[2.5px] border-white bg-nexoraBrand shadow-md"
                        style={{
                          left: `calc(${(activePoint.x / svgMetrics.width) * 100}% - 6.5px)`,
                          top: `calc(${(activePoint.y / svgMetrics.height) * 100}% - 6.5px)`,
                          zIndex: 10
                        }}
                      />
                    </>
                  )}

                  {/* Scrubber Tooltip */}
                  {activePoint && (
                    <div
                      className="absolute bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none transition-all duration-75"
                      style={{
                        left: `clamp(0px, calc(${(activePoint.x / svgMetrics.width) * 100}% - 40px), calc(100% - 80px))`,
                        top: `calc(${(activePoint.y / svgMetrics.height) * 100}% - 38px)`,
                        zIndex: 11
                      }}
                    >
                      {t('staff_detail.tooltip_tips')} {formatCurrency(activePoint.value)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-[11px] font-semibold text-nexoraSubtle">
                {chartData.map((d) => (
                  <span key={d.label}>{d.label}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center text-xs text-nexoraMuted">{t('staff_detail.no_chart_data')}</div>
          )}
        </div>

        {/* 4. WALLET DETAILS / ADRESSES */}
        <div className="nexora-card p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider mb-1">{t('staff_detail.direct_wallets')}</h2>
            <p className="text-xs text-nexoraMuted mb-4">{t('staff_detail.direct_wallets_desc')}</p>
          </div>

          <div className="space-y-3">
            {Object.entries(staffMember.paymentAccounts || {}).map(([key, value]) => {
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
                      <span className="font-mono text-nexoraMuted">{value}</span>
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
                    <td className="px-4 py-3.5 text-nexoraMuted">{tx.dateTime}</td>
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
                    "{rev.comment}"
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
