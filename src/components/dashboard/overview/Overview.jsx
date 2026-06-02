import { useState, useEffect, useRef } from 'react'
import { Calendar, QrCode, Eye, Download, Sparkles, Pointer, Star } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { formatCurrency } from '../utils'
import Panel from '../../ui/Panel'
import KpiCard from '../../ui/KpiCard'
import TipsOverTimePanel from './TipsOverTimePanel'
import StaffLeaderboardPanel from './StaffLeaderboardPanel'

function renderStars(rating) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    const fillPercentage = Math.max(0, Math.min(1, rating - i + 1))
    stars.push(
      <div key={i} className="relative inline-block h-4 w-4 text-gray-200">
        <Star className="absolute top-0 left-0 h-4 w-4 text-amber-400 opacity-30" />
        {fillPercentage > 0 && (
          <div
            className="absolute top-0 left-0 overflow-hidden h-4 text-amber-400"
            style={{ width: `${fillPercentage * 100}%` }}
          >
            <Star className="h-4 w-4 fill-current text-amber-400" />
          </div>
        )}
      </div>
    )
  }
  return <div className="flex gap-0.5">{stars}</div>
}

function Overview({
  metrics,
  activeKpi,
  setActiveKpi,
  chartRange,
  setChartRange,
  selectedStaff,
  setSelectedStaff,
  onOpenTouchpoints,
  onOpenReviews,
  businessName,
  previewQr,
  hasKyb = true
}) {
  const { currentLanguage, t } = useTranslation()
  const { showToast } = useNotification()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const dateRangeOptions = [
    { value: '7 Days', label: currentLanguage === 'vi' ? '20 thg 5 - 26 thg 5, 2024' : 'May 20 - May 26, 2024' },
    { value: '30 Days', label: currentLanguage === 'vi' ? '27 thg 4 - 26 thg 5, 2024' : 'Apr 27 - May 26, 2024' },
    { value: '90 Days', label: currentLanguage === 'vi' ? '27 thg 2 - 26 thg 5, 2024' : 'Feb 27 - May 26, 2024' },
    { value: '180 Days', label: currentLanguage === 'vi' ? '28 thg 11, 2023 - 26 thg 5, 2024' : 'Nov 28, 2023 - May 26, 2024' },
    { value: '365 Days', label: currentLanguage === 'vi' ? '27 thg 5, 2023 - 26 thg 5, 2024' : 'May 27, 2023 - May 26, 2024' }
  ]

  const selectedOption = dateRangeOptions.find((opt) => opt.value === chartRange) || dateRangeOptions[0]

  return (
    <div className="space-y-8">
      {/* Header Overview Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" ref={dropdownRef}>
        <h1 className="text-xl font-extrabold tracking-tight text-nexoraText uppercase">
          {t('dashboard.overview_title') || 'Dashboard Overview'}
        </h1>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex h-10 items-center justify-between gap-3 rounded-lg border border-nexoraBorder bg-white px-4 py-2 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-nexoraMuted" />
              <span>{selectedOption.label}</span>
            </div>
            <span className="text-nexoraMuted">▼</span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 z-30 w-64 rounded-lg border border-nexoraBorder bg-white py-1 shadow-lg">
              {dateRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setChartRange(opt.value)
                    setIsDropdownOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-bold transition hover:bg-nexoraSurfaceMuted ${
                    chartRange === opt.value ? 'text-nexoraBrand bg-nexoraCanvas' : 'text-nexoraText'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-[10px] text-nexoraMuted uppercase tracking-wider">{opt.value}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t('dashboard.kpi.total_tips')}
          value={formatCurrency(metrics.totalTips)}
          delta="18.5%"
          active={activeKpi === 'tips'}
          onClick={() => setActiveKpi('tips')}
        />
        <KpiCard
          label={t('dashboard.kpi.total_transactions')}
          value={metrics.totalTransactions.toString()}
          delta="16.7%"
          active={activeKpi === 'transactions'}
          onClick={() => setActiveKpi('transactions')}
        />
        <KpiCard
          label={t('dashboard.kpi.avg_tip')}
          value={formatCurrency(metrics.averageTip)}
          delta="9.3%"
          active={activeKpi === 'avg_tip'}
          onClick={() => setActiveKpi('avg_tip')}
        />
        <KpiCard
          label={t('dashboard.kpi.total_reviews')}
          value={metrics.totalReviews.toString()}
          delta="20.4%"
          active={activeKpi === 'reviews'}
          onClick={() => setActiveKpi('reviews')}
        />
      </div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <TipsOverTimePanel range={chartRange} setRange={setChartRange} hasKyb={hasKyb} />
        <StaffLeaderboardPanel selectedStaff={selectedStaff} setSelectedStaff={setSelectedStaff} hasKyb={hasKyb} />
      </div>

      {/* Master Gateways Panel */}
      <Panel className="p-7">
        <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">
          {t('dashboard.master_gateway.title') || 'Master QR & NFC Gateways'}
        </h2>
        <p className="mt-1 text-xs text-nexoraMuted">
          {t('dashboard.master_gateway.subtitle') || 'Quick access welcome points for direct customer engagement.'}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Master QR section */}
          <div className="rounded-xl border border-nexoraBorder bg-nexoraCanvas p-5 flex flex-col md:flex-row justify-between gap-5">
            <div className="flex-grow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand">
                    <QrCode className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-nexoraText">
                      {t('dashboard.master_gateway.qr_title') || 'Master Store QR'}
                    </h3>
                    <p className="text-[10px] text-nexoraMuted">
                      {t('dashboard.master_gateway.qr_desc') || 'Lobby entrance / general pool tips'}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-normal text-nexoraMuted">
                  {t('dashboard.master_gateway.qr_body') || 'Place this QR code at the reception desk. Customers scan to choose their technician and submit reviews.'}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => previewQr({ name: 'Master Welcome QR', subtitle: 'Store Main Portal', slug: 'general', isActive: true })}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  {t('dashboard.master_gateway.btn_open') || 'Open QR'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(
                      `${window.location.origin}${window.location.pathname}?flow=customer&tech=general&biz=${encodeURIComponent(businessName)}`
                    )}`
                    const link = document.createElement('a')
                    link.href = qrUrl
                    link.download = 'master-qr.png'
                    link.target = '_blank'
                    link.click()
                  }}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white hover:bg-nexoraBrandDark transition cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  {t('dashboard.master_gateway.btn_download') || 'Download QR'}
                </button>
              </div>
            </div>

            {/* Visual QR mockup thumbnail */}
            <div
              onClick={() => previewQr({ name: 'Master Welcome QR', subtitle: 'Store Main Portal', slug: 'general', isActive: true })}
              className="flex-shrink-0 mx-auto md:mx-0 w-28 h-28 rounded-lg bg-white border border-nexoraBorder/80 p-2 flex items-center justify-center shadow-sm relative overflow-hidden cursor-pointer hover:border-nexoraBrand transition select-none group"
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `${window.location.origin}${window.location.pathname}?flow=customer&tech=general&biz=${encodeURIComponent(businessName)}`
                )}`}
                alt="Master QR Code Preview"
                className="h-full w-full object-contain group-hover:scale-105 transition duration-200"
              />
              <div className="absolute inset-0 bg-nexoraBrand/80 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 text-white select-none">
                <QrCode className="h-5 w-5" />
                <span className="text-[9px] font-black uppercase tracking-wider">PREVIEW</span>
              </div>
            </div>
          </div>

          {/* Master NFC section */}
          <div className="rounded-xl border border-nexoraBorder bg-nexoraCanvas p-5 flex flex-col md:flex-row justify-between gap-5">
            <div className="flex-grow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-nexoraText">
                      {t('dashboard.master_gateway.nfc_title') || 'Master NFC Tag'}
                    </h3>
                    <p className="text-[10px] text-nexoraMuted">
                      {t('dashboard.master_gateway.nfc_desc') || 'Contactless desk pucks / smart signs'}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-normal text-nexoraMuted">
                  {t('dashboard.master_gateway.nfc_body') || 'Write the customer portal link to physical NFC tags. Customers tap their smartphones to pay tips and write reviews instantly.'}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nfcUrl = `${window.location.origin}${window.location.pathname}?flow=customer&tech=general&biz=${encodeURIComponent(businessName)}`
                    navigator.clipboard.writeText(nfcUrl)
                    showToast('Copied NFC redirect link to clipboard!', 'success')
                  }}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition cursor-pointer"
                >
                  <Pointer className="h-4 w-4" />
                  {t('dashboard.master_gateway.btn_copy_link') || 'Copy Link'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    const configData = {
                      version: "1.0",
                      platform: "nexora-touch",
                      businessName: businessName,
                      gatewayUrl: `${window.location.origin}${window.location.pathname}?flow=customer&tech=general&biz=${encodeURIComponent(businessName)}`,
                      nfcTagId: "master-nfc-general"
                    }
                    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `${slugify(businessName)}-nfc-config.json`
                    link.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white hover:bg-nexoraBrandDark transition cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  {t('dashboard.master_gateway.btn_download_config') || 'Download Config'}
                </button>
              </div>
            </div>

            {/* Visual NFC puck mockup */}
            <div className="flex-shrink-0 mx-auto md:mx-0 w-28 h-28 rounded-lg bg-white border border-nexoraBorder/80 p-3 flex flex-col items-center justify-center shadow-sm relative overflow-hidden select-none">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400/10 to-amber-500/20 border border-dashed border-amber-500/40 flex items-center justify-center animate-pulse">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white shadow-md">
                  <Sparkles className="h-[18px] w-[18px]" />
                </span>
              </div>
              <div className="text-[9px] font-black uppercase text-amber-600 tracking-widest mt-2 animate-pulse">
                NFC Active
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Review KPI Cards (Bottom Grid) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Google Reviews */}
        <Panel className="p-5 flex flex-col justify-between min-h-[140px] hover:shadow-premium transition">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.review_kpi.google_reviews')}
            </div>
            <div className="mt-2 text-2xl font-black text-nexoraText tracking-tight">
              {metrics.googleRating}
            </div>
          </div>
          <div className="mt-4 space-y-1">
            {renderStars(metrics.googleRating)}
            <div className="text-xs text-nexoraMuted mt-0.5">
              {t('dashboard.review_kpi.reviews_count', { count: metrics.googleReviews })}
            </div>
          </div>
        </Panel>

        {/* Yelp Reviews */}
        <Panel className="p-5 flex flex-col justify-between min-h-[140px] hover:shadow-premium transition">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.review_kpi.yelp_reviews')}
            </div>
            <div className="mt-2 text-2xl font-black text-nexoraText tracking-tight">
              {metrics.yelpRating}
            </div>
          </div>
          <div className="mt-4 space-y-1">
            {renderStars(metrics.yelpRating)}
            <div className="text-xs text-nexoraMuted mt-0.5">
              {t('dashboard.review_kpi.reviews_count', { count: metrics.yelpReviews })}
            </div>
          </div>
        </Panel>

        {/* Response Rate */}
        <Panel className="p-5 flex flex-col justify-between min-h-[140px] hover:shadow-premium transition">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.review_kpi.response_rate')}
            </div>
            <div className="mt-2 text-2xl font-black text-nexoraText tracking-tight">
              {metrics.responseRate}%
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <span>{t('dashboard.review_kpi.great') || 'Great!'}</span>
          </div>
        </Panel>

        {/* Returning Customers */}
        <Panel className="p-5 flex flex-col justify-between min-h-[140px] hover:shadow-premium transition">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.review_kpi.returning_customers')}
            </div>
            <div className="mt-2 text-2xl font-black text-nexoraText tracking-tight">
              {metrics.returningCustomers}%
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <span>▲ {metrics.returningCustomersDelta}%</span>
            <span className="text-nexoraMuted font-semibold">
              {t('dashboard.kpi.vs_last_week') || 'vs last week'}
            </span>
          </div>
        </Panel>
      </div>
    </div>
  )
}

export default Overview
