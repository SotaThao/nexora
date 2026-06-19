import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Plus,
  Trash2,
  QrCode,
  ShieldAlert,
  HelpCircle,
  Check,
  X,
  Smartphone,
  Layers,
  Activity,
  AlertOctagon,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import CustomSelect from './CustomSelect'
import Pagination from './ui/Pagination'
import DevicesView from './DevicesView'
import { useTouchpoints } from '../data/hooks/useMerchantTouchpoints'
import { usePagination } from '../hooks/usePagination'
import { DEFAULT_PAGE_SIZE, STAFF_FILTER_LIST_PAGE_SIZE } from '../constants/pagination'
import { buildQrImageUrl, toLocalCustomerTouchUrl } from '../utils/staffTipUrl'
import { formatCurrency } from './dashboard/utils'

function Panel({ children, className = '' }) {
  return (
    <section className={`bg-white dark:bg-luxuryCoal border border-nexoraBorder dark:border-luxuryGold/18 rounded-flox-cards shadow-premium ${className}`}>
      {children}
    </section>
  )
}

function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-flox-buttons h-11 w-11 text-nexoraSubtle hover:text-nexoraText dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-nexoraBrand/50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default function TouchpointsView({
  onOpenAddModal,
  onDelete,
  onQr,
  onToggleStatus,
  togglingTouchpointId = null,
  onLinkDevice,
  transactions = [],
  businessName = '',
  devices = [],
  onAddDevice,
  onDeleteDevice,
  onToggleDeviceStatus,
  activeSubTab: propActiveSubTab,
  onTabChange
}) {
  const { t } = useTranslation()
  const [localActiveSubTab, setLocalActiveSubTab] = useState('stations')
  const activeSubTab = propActiveSubTab !== undefined ? propActiveSubTab : localActiveSubTab
  const setActiveSubTab = onTabChange !== undefined ? onTabChange : setLocalActiveSubTab
  const [deleteConfirmId, setDeleteConfirmId] = useState<any | null>(null)

  // Local state for the Add Touchpoint form (name also drives list filter via API)
  const [name, setName] = useState('')
  const [type, setType] = useState('Table QR')
  const [deviceId, setDeviceId] = useState('')
  const [debouncedNameFilter, setDebouncedNameFilter] = useState('')
  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({ pageSize: DEFAULT_PAGE_SIZE })

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedNameFilter(name.trim()), 400)
    return () => window.clearTimeout(timer)
  }, [name])

  useEffect(() => {
    resetPage()
  }, [debouncedNameFilter, resetPage])

  const listQuery = useMemo(() => ({
    PageNumber: pageNumber,
    PageSize: pageSize,
    ...(debouncedNameFilter ? { Name: debouncedNameFilter } : {}),
  }), [pageNumber, pageSize, debouncedNameFilter])

  const {
    data: touchpointsPage,
    isLoading,
    isFetching,
  } = useTouchpoints(listQuery)
  const { data: touchpointsStatsPage } = useTouchpoints(
    { PageNumber: 1, PageSize: STAFF_FILTER_LIST_PAGE_SIZE },
  )

  const touchpoints = touchpointsPage?.items ?? []
  const statsTouchpoints = touchpointsStatsPage?.items ?? touchpoints
  const totalCount = touchpointsPage?.totalCount ?? 0
  const totalPages = touchpointsPage?.totalPages ?? 1
  const hasNextPage = touchpointsPage?.hasNextPage ?? false
  const hasPreviousPage = touchpointsPage?.hasPreviousPage ?? false

  // Local state for Linking Devices
  const [linkingPointId, setLinkingPointId] = useState<any | null>(null)
  const [linkInputVal, setLinkInputVal] = useState('')

  // Highlighting selected device
  const [highlightedDeviceId, setHighlightedDeviceId] = useState<any | null>(null)
  
  // Suggestion overlay state
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionRef = useRef(null)

  // Click outside suggestions dropdown listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAdd = () => {
    // Hand off to the Add Touch Point modal, prefilled with anything typed here.
    if (onOpenAddModal) {
      onOpenAddModal({ name: name.trim(), type, deviceId: deviceId.trim() })
    }
    setName('')
    setDeviceId('')
  }

  const handleStartLink = (point) => {
    setLinkingPointId(point.id)
    setLinkInputVal(point.deviceId || '')
  }

  const handleSaveLink = (pointId) => {
    if (onLinkDevice) {
      onLinkDevice(pointId, linkInputVal.trim())
    }
    setLinkingPointId(null)
    setLinkInputVal('')
  }

  // Calculate dynamic Hardware KPIs
  const kpiTouchpoints = statsTouchpoints ?? touchpoints
  const totalTouchpoints = totalCount ?? kpiTouchpoints.length

  const activeNfcStands = kpiTouchpoints.filter(
    (point) =>
      point.deviceId &&
      point.deviceId.trim().toUpperCase().startsWith('NFC') &&
      point.isActive !== false
  ).length

  const totalScans = kpiTouchpoints.reduce((sum, point) => sum + (point.scans ?? 0), 0)

  const deviceIssues = kpiTouchpoints.filter(
    (point) => point.deviceId && point.isActive === false
  ).length

  return (
    <div className="space-y-6">
      {/* Tab Header & Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-nexoraBorder pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">
            {t('dashboard.menu.touchpoints')}
          </h2>
          <p className="mt-1 text-xs text-nexoraMuted">
            {t('setup.qr_touchpoints_desc')}
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-nexoraSurfaceMuted dark:bg-luxuryCoal p-1 rounded-xl border border-nexoraBorder dark:border-luxuryGold/10">
          {[
            { id: 'stations', label: t('dashboard.touchpoints.tabs.stations'), disabled: false },
            { id: 'devices', label: t('dashboard.touchpoints.tabs.devices'), disabled: true }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => !tab.disabled && setActiveSubTab(tab.id)}
              className={`h-9 rounded-lg px-4 text-xs font-bold transition-all min-w-[44px] ${
                tab.disabled
                  ? 'cursor-not-allowed opacity-45 text-nexoraMuted'
                  : activeSubTab === tab.id
                    ? 'bg-white dark:bg-luxuryBlack text-luxuryGold shadow-sm font-black'
                    : 'text-nexoraMuted hover:text-nexoraText dark:text-slate-400 dark:hover:text-white'
              }`}
              title={tab.disabled ? t('common.coming_soon') : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'stations' && (
        <>
          {/* Hardware KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1: Total Touchpoints */}
            <Panel className="p-4 flex items-center justify-between border-l-4 border-l-nexoraBrand relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.touchpoint_stats.total_touchpoints')}
                </p>
                <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">{totalTouchpoints}</p>
              </div>
              <div className="p-2.5 bg-nexoraBrandSoft dark:bg-nexoraBrand/10 text-nexoraBrand rounded-flox-buttons">
                <Layers className="h-5 w-5" />
              </div>
            </Panel>

            {/* KPI 2: Active physical NFC Stands */}
            <Panel className="p-4 flex items-center justify-between border-l-4 border-l-luxuryGold relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.touchpoint_stats.active_nfc')}
                </p>
                <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">{activeNfcStands}</p>
              </div>
              <div className="p-2.5 bg-amber-50 dark:bg-luxuryGold/10 text-luxuryGold rounded-flox-buttons">
                <Smartphone className="h-5 w-5" />
              </div>
            </Panel>

            {/* KPI 3: Total Scans */}
            <Panel className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500 relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.touchpoint_stats.total_scans')}
                </p>
                <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">{totalScans}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-flox-buttons">
                <Activity className="h-5 w-5" />
              </div>
            </Panel>

            {/* KPI 4: Device Issues */}
            <Panel className="p-4 flex items-center justify-between border-l-4 border-l-red-500 relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.touchpoint_stats.device_issues')}
                </p>
                <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">{deviceIssues}</p>
              </div>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-red-500 rounded-flox-buttons">
                <AlertOctagon className="h-5 w-5" />
              </div>
            </Panel>
          </div>

          {/* Add Touchpoint Form Panel */}
          <Panel className="p-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_180px_auto] items-end">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.modals.tp_name_label')}
                </label>
                <div className="relative">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('dashboard.modals.tp_name_placeholder')}
                    className="h-11 w-full rounded-flox-inputs border border-nexoraBorder dark:border-luxuryGold/18 bg-white dark:bg-luxuryCoal px-3 pr-10 text-base text-nexoraText outline-none focus:border-nexoraBrand dark:focus:border-luxuryGold"
                  />
                  {isFetching && !isLoading ? (
                    <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-nexoraBrand" />
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.modals.device_id_label')}
                </label>
                <input
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder={t('components.TouchpointsView.phExampleDeviceIds')}
                  className="h-11 w-full rounded-flox-inputs border border-nexoraBorder dark:border-luxuryGold/18 bg-white dark:bg-luxuryCoal px-3 text-base text-nexoraText outline-none focus:border-nexoraBrand dark:focus:border-luxuryGold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.modals.tp_type_label')}
                </label>
                <CustomSelect
                  buttonClass="h-11 text-sm focus:border-nexoraBrand dark:focus:border-luxuryGold"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  options={[
                    { value: 'Table QR', label: 'Table QR' },
                    { value: 'Front Desk', label: 'Front Desk' },
                    { value: 'Receipt QR', label: 'Receipt QR' },
                    { value: 'Business Main', label: 'Business Main' },
                    { value: 'Staff QR', label: 'Staff QR' }
                  ]}
                />
              </div>

              <button
                onClick={handleAdd}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-flox-buttons bg-nexoraBrand dark:bg-luxuryGold hover:bg-nexoraBrandDark dark:hover:bg-luxuryGoldLight text-white dark:text-luxuryBlack px-5 text-sm font-bold transition-all w-full lg:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span>{t('setup.add_tp_btn')}</span>
              </button>
            </div>
          </Panel>

          {/* Touchpoint Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              <Panel className="md:col-span-2 xl:col-span-3 flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-nexoraBrand" />
              </Panel>
            ) : touchpoints.length === 0 ? (
              <Panel className="md:col-span-2 xl:col-span-3 border-dashed border-nexoraBorder/80">
                <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-12 text-center sm:gap-5 sm:py-14">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-nexoraBrandSoft to-brandCyan/20 dark:from-nexoraBrand/20 dark:to-brandCyan/20 text-nexoraBrand shadow-sm ring-1 ring-nexoraBrand/10">
                    <HelpCircle className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-extrabold text-nexoraText">
                    {t('dashboard.touchpoints.empty_title')}
                  </h3>
                  <p className="max-w-md text-sm leading-relaxed text-nexoraMuted">
                    {t('dashboard.touchpoints.empty_desc')}
                  </p>
                </div>
              </Panel>
            ) : null}
            {!isLoading && touchpoints.map((point) => {
              const isPointActive = point.isActive !== false
              const isToggling = togglingTouchpointId === point.id
              let qrUrl = ''
              if (point.url) {
                qrUrl = toLocalCustomerTouchUrl(String(point.url))
              }
              if (!qrUrl && point.slug) {
                qrUrl = `${window.location.origin}/touch/${point.slug}`
              }

              const scans = point.scans ?? 0
              const revenue = point.revenue ?? 0
              const qrImageSrc = buildQrImageUrl(qrUrl, 150, point.qrImageUrl)

              return (
                <Panel key={point.id} className="p-3.5 flex gap-4 hover:shadow-premium transition-all duration-300 group border border-nexoraBorder relative overflow-hidden min-h-[160px]">
                  {/* Subtle top decoration strip */}
                  <div className={`absolute top-0 left-0 right-0 h-1 transition-colors ${isPointActive ? 'bg-gradient-to-r from-nexoraBrand to-floxElectricViolet' : 'bg-nexoraBorder'}`} />
                  
                  {/* Left Column: QR Code Box */}
                  <div 
                    onClick={() => isPointActive && onQr && onQr(point)}
                    className="relative w-[115px] h-[115px] rounded-xl bg-white border border-nexoraBorder/60 p-2 flex items-center justify-center shadow-sm cursor-pointer hover:border-nexoraBrand transition-all hover:scale-[1.03] active:scale-95 group/qr select-none overflow-hidden shrink-0 self-center"
                    title={t('dashboard.modals.download_print_qr')}
                  >
                    <img
                      src={qrImageSrc}
                      alt="Scan QR"
                      className={`h-full w-full object-contain transition-opacity duration-200 ${isPointActive ? 'opacity-100' : 'opacity-30 filter grayscale'}`}
                    />
                    {!isPointActive && (
                      <div className="absolute inset-0 bg-luxuryBlack/60 flex flex-col items-center justify-center text-white text-[9px] font-black uppercase tracking-wider p-1 text-center">
                        <ShieldAlert className="h-4 w-4 text-luxuryAmber mb-0.5 animate-pulse" />
                        <span>Disabled</span>
                      </div>
                    )}
                    {isPointActive && (
                      <div className="absolute inset-0 bg-nexoraBrand/80 opacity-0 group-hover/qr:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-black uppercase tracking-wider transition-opacity p-1 text-center gap-1 select-none">
                        <QrCode className="h-5 w-5" />
                        <span className="text-[9px] font-black uppercase tracking-wider">PREVIEW</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Details */}
                  <div className="flex-grow flex flex-col justify-between min-w-0 py-0.5">
                    {/* Top Section: Title & Delete Button */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-extrabold text-sm text-nexoraText leading-snug truncate" title={point.name}>
                          {point.name}
                        </h3>
                        <IconButton 
                          label={t('common.delete')} 
                          onClick={() => setDeleteConfirmId(point.id)} 
                          className="text-nexoraDanger hover:opacity-85 hover:bg-nexoraDanger/10 p-1 rounded transition shrink-0 h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-[9.5px] font-mono text-nexoraSubtle select-all truncate flex-grow">
                          {qrUrl.replace(/^https?:\/\//, '')}
                        </p>
                        {isPointActive && (
                          <a
                            href={qrUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-nexoraBrand dark:text-luxuryGold hover:opacity-80 transition-opacity shrink-0 cursor-pointer p-0.5"
                            title={t('dashboard.touchpoints.open_link')}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
     
                    {/* Middle Section: Active / Inactive Toggle */}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => onToggleStatus && onToggleStatus(point.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-wait ${
                          isToggling ? 'opacity-70' : 'cursor-pointer'
                        } ${isPointActive ? 'bg-nexoraBrand' : 'bg-nexoraBorder'}`}
                      >
                        {isToggling ? (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-3 w-3 animate-spin text-white" />
                          </span>
                        ) : (
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isPointActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        )}
                      </button>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isPointActive ? 'text-nexoraSuccess' : 'text-nexoraSubtle'}`}>
                        {isPointActive ? t('dashboard.touchpoint_stats.active') : t('dashboard.touchpoint_stats.inactive')}
                      </span>
                    </div>

                    {/* Linked Hardware Display & Link Device Action */}
                    <div className="mt-2 pt-2 border-t border-nexoraRule dark:border-white/5 space-y-1">
                      {linkingPointId === point.id ? (
                        <div className="flex items-center gap-1.5 flex-grow">
                          <div className="relative flex-grow" ref={suggestionRef}>
                            <input
                              type="text"
                              value={linkInputVal}
                              onChange={(e) => {
                                setLinkInputVal(e.target.value)
                                setShowSuggestions(true)
                              }}
                              onFocus={() => setShowSuggestions(true)}
                              placeholder={t('components.TouchpointsView.phDeviceId')}
                              className="h-9 w-full rounded-flox-inputs border border-nexoraBorder dark:border-luxuryGold/18 bg-white dark:bg-luxuryCoal px-2 text-base text-nexoraText outline-none focus:border-nexoraBrand"
                              autoFocus
                            />
                            {showSuggestions && (
                              <div className="absolute left-0 right-0 mt-1 z-50 bg-white dark:bg-luxuryCoal border border-nexoraBorder dark:border-luxuryGold/18 rounded-lg shadow-premium max-h-48 overflow-y-auto py-1 text-xs">
                                {devices.filter(d => 
                                  !linkInputVal ||
                                  d.deviceId.toLowerCase().includes(linkInputVal.toLowerCase()) ||
                                  d.location.toLowerCase().includes(linkInputVal.toLowerCase())
                                ).map((device) => (
                                  <button
                                    key={device.id}
                                    type="button"
                                    onClick={() => {
                                      setLinkInputVal(device.deviceId)
                                      setShowSuggestions(false)
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-nexoraSurfaceMuted dark:hover:bg-luxuryBlack transition-colors flex flex-col gap-0.5 cursor-pointer"
                                  >
                                    <span className="font-extrabold text-nexoraText dark:text-white font-mono">{device.deviceId}</span>
                                    <span className="text-[10px] text-nexoraSubtle">{device.location} ({device.type})</span>
                                  </button>
                                ))}
                                {devices.filter(d => 
                                  !linkInputVal ||
                                  d.deviceId.toLowerCase().includes(linkInputVal.toLowerCase()) ||
                                  d.location.toLowerCase().includes(linkInputVal.toLowerCase())
                                ).length === 0 && (
                                  <div className="px-3 py-2 text-nexoraSubtle italic text-center">
                                    No matching devices
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              handleSaveLink(point.id)
                              setShowSuggestions(false)
                            }}
                            className="h-9 w-9 flex items-center justify-center rounded-flox-buttons bg-nexoraSuccess text-white hover:bg-nexoraSuccess/90 active:scale-95 shrink-0"
                            title="Confirm"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setLinkingPointId(null)
                              setShowSuggestions(false)
                            }}
                            className="h-9 w-9 flex items-center justify-center rounded-flox-buttons bg-nexoraRule dark:bg-white/10 text-nexoraMuted dark:text-nexoraSubtle hover:bg-nexoraBorder dark:hover:bg-white/20 active:scale-95 shrink-0"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1 min-h-[44px]">
                          <div className="text-[10px] font-bold text-nexoraMuted truncate flex items-center gap-1 min-w-0 flex-grow">
                            {point.deviceId ? (
                              <button
                                type="button"
                                className="flex items-center gap-1.5 bg-gradient-to-r from-nexoraBrand/10 to-brandCyan/10 text-nexoraBrand dark:text-luxuryGold px-2 py-1 rounded-full border border-nexoraBrand/20 text-[9.5px] font-black uppercase tracking-wider truncate cursor-default select-none"
                                title={point.deviceId}
                              >
                                <Smartphone className="h-3.5 w-3.5 text-nexoraBrand dark:text-luxuryGold" />
                                <span>{point.deviceId}</span>
                              </button>
                            ) : (
                              <span className="text-nexoraSubtle italic text-[9.5px]">
                                Only Paper QR / Chỉ dùng QR in giấy
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleStartLink(point)}
                            className="h-11 px-2.5 text-[10px] font-black uppercase tracking-wider text-nexoraBrand dark:text-luxuryGold hover:underline focus:outline-none flex items-center justify-center shrink-0 ml-auto"
                          >
                            {point.deviceId ? 'Edit Link' : 'Link Device'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Section: Compact Metrics */}
                    <div className="mt-2 pt-2 border-t border-nexoraRule dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-nexoraMuted">
                      <div>
                        {t('dashboard.touchpoint_stats.scans')}: <span className="font-black text-nexoraText">{scans}</span>
                      </div>
                      <div>
                        {t('dashboard.touchpoint_stats.revenue')}: <span className="font-black text-nexoraSuccess">{formatCurrency(revenue)}</span>
                      </div>
                    </div>
                  </div>
                </Panel>
              )
            })}
          </div>

          {!isLoading && totalPages > 1 && (
            <Pagination
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalPages={totalPages}
              totalCount={totalCount ?? touchpoints.length}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              onPageChange={setPage}
              isLoading={isFetching}
              className="pt-2"
            />
          )}

          {/* Custom Delete Confirmation Modal */}
          {deleteConfirmId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scaleUp">
                <h3 className="text-base font-extrabold text-nexoraText">
                  {t('dashboard.touchpoint_stats.delete_confirm_title')}
                </h3>
                <p className="mt-2.5 text-xs text-nexoraMuted leading-normal">
                  {t('dashboard.touchpoint_stats.delete_confirm')}
                </p>
                <div className="mt-5 flex justify-end gap-2 border-t border-nexoraRule pt-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted transition min-h-[44px]"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={() => {
                      if (onDelete) {
                        onDelete(deleteConfirmId)
                      }
                      setDeleteConfirmId(null)
                    }}
                    className="rounded-lg bg-nexoraDanger px-4 py-2 text-xs font-bold text-white hover:bg-nexoraDanger/90 transition min-h-[44px]"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeSubTab === 'devices' && (
        <DevicesView
          devices={devices}
          onAddDevice={onAddDevice}
          onDeleteDevice={onDeleteDevice}
          onToggleDeviceStatus={onToggleDeviceStatus}
          highlightedDeviceId={highlightedDeviceId}
        />
      )}
    </div>
  )
}
