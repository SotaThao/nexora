import React, { useState, useMemo } from 'react'
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
  Loader2,
  Eye,
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import Pagination from './ui/Pagination'
import { useTouchpoints } from '../data/hooks/useMerchantTouchpoints'
import {
  usePhysicalCards,
  useLinkPhysicalCard,
  useUnlinkPhysicalCard,
} from '../data/hooks/useMerchantPhysicalCards'
import { usePagination } from '../hooks/usePagination'
import { DEFAULT_PAGE_SIZE, STAFF_FILTER_LIST_PAGE_SIZE } from '../constants/pagination'
import { buildQrImageUrl, toLocalCustomerTouchUrl } from '../utils/staffTipUrl'
import { getWebUrlOrigin } from '../utils/webUrlBase'
import ToggleSwitch from './ui/ToggleSwitch'
import { formatCurrency, formatTransactionDateTime } from './dashboard/utils'
import PhysicalCardDetailModal from './dashboard/modals/PhysicalCardDetailModal'

function isLinkedTouchPointId(value: unknown): boolean {
  if (value == null || value === '') return false
  const id = String(value).trim()
  if (!id || id === '00000000-0000-0000-0000-000000000000') return false
  return true
}

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

function TouchpointStatCard({ label, value, icon: Icon, borderAccent, iconBg, iconColor }) {
  return (
    <Panel className={`p-3 sm:p-4 border-l-[3px] sm:border-l-4 ${borderAccent} overflow-hidden`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-nexoraSubtle leading-snug line-clamp-2">
            {label}
          </p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-nexoraText font-mono tracking-tight tabular-nums">
            {value}
          </p>
        </div>
        <div className={`shrink-0 rounded-xl p-2 sm:rounded-flox-buttons sm:p-2.5 ${iconBg} ${iconColor}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </Panel>
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
  const { t, currentLanguage } = useTranslation()
  const [localActiveSubTab, setLocalActiveSubTab] = useState('stations')
  const activeSubTab = propActiveSubTab !== undefined ? propActiveSubTab : localActiveSubTab
  const setActiveSubTab = onTabChange !== undefined ? onTabChange : setLocalActiveSubTab
  const [deleteConfirmId, setDeleteConfirmId] = useState<any | null>(null)
  const [unlinkConfirmPoint, setUnlinkConfirmPoint] = useState<any | null>(null)
  const [detailHelpCode, setDetailHelpCode] = useState<string | null>(null)

  const { pageNumber, pageSize, setPage } = usePagination({ pageSize: DEFAULT_PAGE_SIZE })

  const listQuery = useMemo(() => ({
    PageNumber: pageNumber,
    PageSize: pageSize,
  }), [pageNumber, pageSize])

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
  const [linkInputError, setLinkInputError] = useState('')

  const linkPhysicalCardMutation = useLinkPhysicalCard()
  const unlinkPhysicalCardMutation = useUnlinkPhysicalCard()

  const physicalCardsQuery = useMemo(
    () => ({ PageNumber: 1, PageSize: STAFF_FILTER_LIST_PAGE_SIZE }),
    [],
  )
  const {
    data: physicalCardsPage,
    isLoading: isPhysicalCardsLoading,
  } = usePhysicalCards(physicalCardsQuery)

  const physicalCards = physicalCardsPage?.items ?? []

  const cardCodeByTouchPointId = useMemo(() => {
    const map = new Map<string, string>()
    for (const card of physicalCards) {
      if (card.linkedTouchPointId && card.cardCode) {
        map.set(card.linkedTouchPointId, card.cardCode)
      }
    }
    return map
  }, [physicalCards])

  const helpCodeByTouchPointId = useMemo(() => {
    const map = new Map<string, string>()
    for (const card of physicalCards) {
      if (card.linkedTouchPointId && card.helpCode) {
        map.set(card.linkedTouchPointId, card.helpCode)
      }
    }
    return map
  }, [physicalCards])

  const touchpointsWithLinks = useMemo(
    () => touchpoints.map((point) => ({
      ...point,
      deviceId: cardCodeByTouchPointId.get(point.id) ?? point.deviceId ?? null,
    })),
    [touchpoints, cardCodeByTouchPointId],
  )

  const statsTouchpointsWithLinks = useMemo(
    () => (statsTouchpoints ?? touchpoints).map((point) => ({
      ...point,
      deviceId: cardCodeByTouchPointId.get(point.id) ?? point.deviceId ?? null,
    })),
    [statsTouchpoints, touchpoints, cardCodeByTouchPointId],
  )

  // Highlighting selected device
  const [highlightedDeviceId, setHighlightedDeviceId] = useState<any | null>(null)

  const handleAdd = () => {
    onOpenAddModal?.()
  }

  const handleStartLink = (point) => {
    setLinkingPointId(point.id)
    setLinkInputVal('')
    setLinkInputError('')
  }

  const handleSaveLink = async (pointId) => {
    const cardCode = linkInputVal.trim()
    if (!cardCode) {
      setLinkInputError(t('dashboard.touchpoints.link_device_required'))
      return
    }

    setLinkInputError('')
    try {
      await linkPhysicalCardMutation.mutateAsync({ cardCode, touchPointId: pointId })
      if (onLinkDevice) {
        onLinkDevice(pointId, cardCode)
      }
      setLinkingPointId(null)
      setLinkInputVal('')
      setLinkInputError('')
    } catch {
      // Toast handled in mutation hook
    }
  }

  const handleUnlink = async (point) => {
    const cardCode = point.deviceId?.trim()
    if (!cardCode || unlinkPhysicalCardMutation.isPending) return

    try {
      await unlinkPhysicalCardMutation.mutateAsync(cardCode)
      setUnlinkConfirmPoint(null)
      if (linkingPointId === point.id) {
        setLinkingPointId(null)
        setLinkInputVal('')
      }
    } catch {
      // Toast handled in mutation hook
    }
  }

  // Calculate dynamic Hardware KPIs
  const kpiTouchpoints = statsTouchpointsWithLinks
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
    <div className="space-y-4 sm:space-y-6">
      {/* Tab Header & Title */}
      <div className="flex flex-col gap-3 border-b border-nexoraBorder pb-4 sm:gap-4 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-nexoraText sm:text-xl">
            {t('dashboard.menu.touchpoints')}
          </h2>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-nexoraMuted sm:mt-1 sm:text-xs">
            {t('setup.qr_touchpoints_desc')}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex w-full gap-1 rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted p-1 dark:border-luxuryGold/10 dark:bg-luxuryCoal sm:w-auto">
          {[
            { id: 'stations', label: t('dashboard.touchpoints.tabs.stations'), disabled: false },
            { id: 'devices', label: t('dashboard.touchpoints.tabs.devices'), disabled: false }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => !tab.disabled && setActiveSubTab(tab.id)}
              className={`h-8 min-w-0 flex-1 rounded-lg px-2 text-[11px] font-bold transition-all sm:h-9 sm:flex-none sm:px-4 sm:text-xs ${
                tab.disabled
                  ? 'cursor-not-allowed opacity-45 text-nexoraMuted'
                  : activeSubTab === tab.id
                    ? 'bg-white font-black text-luxuryGold shadow-sm dark:bg-luxuryBlack'
                    : 'text-nexoraMuted hover:text-nexoraText dark:text-slate-400 dark:hover:text-white'
              }`}
              title={tab.disabled ? t('common.coming_soon') : undefined}
            >
              <span className="block truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'stations' && (
        <>
          {/* Hardware KPIs */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            <TouchpointStatCard
              label={t('dashboard.touchpoint_stats.total_touchpoints')}
              value={totalTouchpoints}
              icon={Layers}
              borderAccent="border-l-nexoraBrand"
              iconBg="bg-nexoraBrandSoft dark:bg-nexoraBrand/10"
              iconColor="text-nexoraBrand"
            />
            <TouchpointStatCard
              label={t('dashboard.touchpoint_stats.active_nfc')}
              value={activeNfcStands}
              icon={Smartphone}
              borderAccent="border-l-luxuryGold"
              iconBg="bg-amber-50 dark:bg-luxuryGold/10"
              iconColor="text-luxuryGold"
            />
            <TouchpointStatCard
              label={t('dashboard.touchpoint_stats.total_scans')}
              value={totalScans}
              icon={Activity}
              borderAccent="border-l-emerald-500"
              iconBg="bg-emerald-50 dark:bg-emerald-500/10"
              iconColor="text-emerald-500"
            />
            <TouchpointStatCard
              label={t('dashboard.touchpoint_stats.device_issues')}
              value={deviceIssues}
              icon={AlertOctagon}
              borderAccent="border-l-red-500"
              iconBg="bg-rose-50 dark:bg-rose-500/10"
              iconColor="text-red-500"
            />
          </div>

          {/* Add Touchpoint */}
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-flox-buttons bg-nexoraBrand px-5 text-sm font-bold text-white transition-all hover:bg-nexoraBrandDark dark:bg-luxuryGold dark:text-luxuryBlack dark:hover:bg-luxuryGoldLight"
          >
            <Plus className="h-4 w-4" />
            <span>{t('setup.add_tp_btn')}</span>
          </button>

          {/* Touchpoint Cards Grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {isLoading ? (
              <Panel className="md:col-span-2 xl:col-span-3 flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-nexoraBrand" />
              </Panel>
            ) : touchpointsWithLinks.length === 0 ? (
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
            {!isLoading && touchpointsWithLinks.map((point) => {
              const isPointActive = point.isActive !== false
              const isToggling = togglingTouchpointId === point.id
              let qrUrl = ''
              if (point.url) {
                qrUrl = toLocalCustomerTouchUrl(String(point.url))
              }
              if (!qrUrl && point.slug) {
                qrUrl = `${getWebUrlOrigin()}/touch/${point.slug}`
              }

              const scans = point.scans ?? 0
              const revenue = point.revenue ?? 0
              const qrImageSrc = buildQrImageUrl(qrUrl, 150, point.qrImageUrl)

              return (
                <Panel key={point.id} className="p-3.5 flex flex-col sm:flex-row gap-3 sm:gap-4 hover:shadow-premium transition-all duration-300 group border border-nexoraBorder relative overflow-visible min-h-0 sm:min-h-[160px]">
                  {/* Subtle top decoration strip */}
                  <div className={`absolute top-0 left-0 right-0 h-1 transition-colors ${isPointActive ? 'bg-gradient-to-r from-nexoraBrand to-floxElectricViolet' : 'bg-nexoraBorder'}`} />
                  
                  {/* Left Column: QR Code Box */}
                  <div 
                    onClick={() => isPointActive && onQr && onQr(point)}
                    className="relative w-[115px] h-[115px] rounded-xl bg-white border border-nexoraBorder/60 p-2 flex items-center justify-center shadow-sm cursor-pointer hover:border-nexoraBrand transition-all hover:scale-[1.03] active:scale-95 group/qr select-none overflow-hidden shrink-0 self-center mx-auto sm:mx-0"
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
                  <div className="flex-grow flex flex-col justify-between min-w-0 py-0.5 overflow-visible">
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
                      <ToggleSwitch
                        checked={isPointActive}
                        loading={isToggling}
                        onChange={() => onToggleStatus && onToggleStatus(point.id)}
                        activeColor="bg-nexoraBrand"
                        inactiveColor="bg-nexoraBorder"
                      />
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isPointActive ? 'text-nexoraSuccess' : 'text-nexoraSubtle'}`}>
                        {isPointActive ? t('dashboard.touchpoint_stats.active') : t('dashboard.touchpoint_stats.inactive')}
                      </span>
                    </div>

                    {/* Linked Hardware Display & Link Device Action */}
                    <div className="mt-2 pt-2 border-t border-nexoraRule dark:border-white/5 space-y-2 overflow-visible">
                      {linkingPointId === point.id && !point.deviceId ? (
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="flex-1 min-w-0 space-y-1">
                            <input
                              type="text"
                              value={linkInputVal}
                              onChange={(e) => {
                                setLinkInputVal(e.target.value)
                                if (linkInputError) setLinkInputError('')
                              }}
                              placeholder={t('components.TouchpointsView.phDeviceId')}
                              className={`h-11 w-full rounded-flox-inputs border bg-white dark:bg-luxuryCoal px-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand ${
                                linkInputError
                                  ? 'border-nexoraDanger'
                                  : 'border-nexoraBorder dark:border-luxuryGold/18'
                              }`}
                              autoFocus
                            />
                            {linkInputError ? (
                              <p className="text-[11px] font-semibold text-nexoraDanger">{linkInputError}</p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveLink(point.id)}
                            disabled={linkPhysicalCardMutation.isPending}
                            aria-label={t('common.confirm')}
                            title={t('common.confirm')}
                            className="h-11 w-11 flex items-center justify-center rounded-flox-buttons bg-nexoraSuccess text-white hover:bg-nexoraSuccess/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          >
                            {linkPhysicalCardMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLinkingPointId(null)
                              setLinkInputVal('')
                              setLinkInputError('')
                            }}
                            aria-label={t('common.cancel')}
                            title={t('common.cancel')}
                            className="h-11 w-11 flex items-center justify-center rounded-flox-buttons bg-nexoraRule dark:bg-white/10 text-nexoraMuted dark:text-nexoraSubtle hover:bg-nexoraBorder dark:hover:bg-white/20 active:scale-95 shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            {point.deviceId ? (
                              <div
                                className="inline-flex max-w-full min-w-0 items-center gap-1.5 bg-gradient-to-r from-nexoraBrand/10 to-brandCyan/10 text-nexoraBrand dark:text-luxuryGold px-2.5 py-1.5 rounded-full border border-nexoraBrand/20 text-[9.5px] font-black uppercase tracking-wider"
                                title={point.deviceId}
                              >
                                <Smartphone className="h-3.5 w-3.5 shrink-0 text-nexoraBrand dark:text-luxuryGold" />
                                <span className="truncate">{point.deviceId}</span>
                              </div>
                            ) : (
                              <span className="text-nexoraSubtle italic text-[9.5px] leading-relaxed">
                                {t('dashboard.touchpoints.paper_qr_only')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {point.deviceId && helpCodeByTouchPointId.get(point.id) ? (
                              <button
                                type="button"
                                onClick={() => setDetailHelpCode(helpCodeByTouchPointId.get(point.id) ?? null)}
                                aria-label={t('dashboard.touchpoints.physical_card.view_detail')}
                                title={t('dashboard.touchpoints.physical_card.view_detail')}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-flox-buttons border border-nexoraBorder dark:border-luxuryGold/18 text-nexoraBrand dark:text-luxuryGold hover:bg-nexoraBrand/5 dark:hover:bg-luxuryGold/10 transition"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            ) : null}
                            {point.deviceId ? (
                              <button
                                type="button"
                                onClick={() => setUnlinkConfirmPoint(point)}
                                disabled={unlinkPhysicalCardMutation.isPending}
                                className="h-11 px-3 text-[10px] font-black uppercase tracking-wider text-nexoraDanger border border-nexoraDanger/20 rounded-flox-buttons hover:bg-nexoraDanger/5 focus:outline-none flex items-center justify-center disabled:opacity-50 whitespace-nowrap"
                              >
                                {unlinkPhysicalCardMutation.isPending &&
                                unlinkPhysicalCardMutation.variables === point.deviceId ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  t('dashboard.touchpoints.unlink_btn')
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartLink(point)}
                                className="h-11 px-3 text-[10px] font-black uppercase tracking-wider text-nexoraBrand dark:text-luxuryGold border border-nexoraBrand/20 dark:border-luxuryGold/20 rounded-flox-buttons hover:bg-nexoraBrand/5 dark:hover:bg-luxuryGold/5 focus:outline-none flex items-center justify-center whitespace-nowrap"
                              >
                                {t('dashboard.touchpoints.link_device_btn')}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Section: Compact Metrics */}
                    <div className="mt-2 pt-2 border-t border-nexoraRule dark:border-white/5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-nexoraMuted">
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
              totalCount={totalCount ?? touchpointsWithLinks.length}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              onPageChange={setPage}
              isLoading={isFetching}
              className="pt-2"
            />
          )}

          {unlinkConfirmPoint ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-luxuryCoal border border-nexoraBorder dark:border-luxuryGold/18 p-7 sm:p-8 shadow-2xl animate-scaleUp">
                <h3 className="text-lg sm:text-xl font-extrabold text-nexoraText">
                  {t('dashboard.touchpoints.unlink_confirm_title')}
                </h3>
                <p className="mt-4 text-sm sm:text-base text-nexoraMuted leading-relaxed">
                  {t('dashboard.touchpoints.unlink_confirm_desc', {
                    device: unlinkConfirmPoint.deviceId || '',
                    name: unlinkConfirmPoint.name || '',
                  })}
                </p>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t border-nexoraRule dark:border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={() => setUnlinkConfirmPoint(null)}
                    disabled={unlinkPhysicalCardMutation.isPending}
                    className="rounded-lg border border-nexoraBorder px-5 py-2.5 text-sm font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted dark:hover:bg-white/10 transition min-h-[44px] disabled:opacity-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnlink(unlinkConfirmPoint)}
                    disabled={unlinkPhysicalCardMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-nexoraDanger px-5 py-2.5 text-sm font-bold text-white hover:bg-nexoraDanger/90 transition min-h-[44px] disabled:opacity-50"
                  >
                    {unlinkPhysicalCardMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {t('dashboard.touchpoints.unlink_btn')}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

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
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <TouchpointStatCard
              label={t('dashboard.devices.kpi.qr_devices')}
              value={physicalCards.length}
              icon={Smartphone}
              borderAccent="border-l-nexoraBrand"
              iconBg="bg-nexoraBrandSoft dark:bg-nexoraBrand/10"
              iconColor="text-nexoraBrand"
            />
            <TouchpointStatCard
              label={t('dashboard.touchpoints.hardware.linked_devices')}
              value={physicalCards.filter((card) => isLinkedTouchPointId(card.linkedTouchPointId)).length}
              icon={Check}
              borderAccent="border-l-nexoraSuccess"
              iconBg="bg-nexoraSuccess/10"
              iconColor="text-nexoraSuccess"
            />
            <TouchpointStatCard
              label={t('dashboard.touchpoints.hardware.unlinked_devices')}
              value={physicalCards.filter((card) => !isLinkedTouchPointId(card.linkedTouchPointId)).length}
              icon={AlertOctagon}
              borderAccent="border-l-amber-500"
              iconBg="bg-amber-500/10"
              iconColor="text-amber-600"
            />
          </div>

          {isPhysicalCardsLoading ? (
            <Panel className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-nexoraBrand" />
            </Panel>
          ) : physicalCards.length === 0 ? (
            <Panel className="border-dashed border-nexoraBorder/80">
              <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-12 text-center sm:gap-5 sm:py-14">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-nexoraBrandSoft to-brandCyan/20 text-nexoraBrand shadow-sm ring-1 ring-nexoraBrand/10">
                  <Smartphone className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-extrabold text-nexoraText">
                  {t('dashboard.devices.empty_title')}
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-nexoraMuted">
                  {t('dashboard.devices.empty_desc')}
                </p>
              </div>
            </Panel>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
              {physicalCards.map((card) => {
                const isLinked = isLinkedTouchPointId(card.linkedTouchPointId)
                const linkedAtLabel = card.linkedAt
                  ? formatTransactionDateTime(card.linkedAt, currentLanguage)
                  : t('dashboard.touchpoints.physical_card.not_linked_yet')

                return (
                  <Panel key={card.id || card.cardCode || card.helpCode} className="p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                          {t('dashboard.touchpoints.physical_card.card_code')}
                        </p>
                        <p className="font-mono text-sm font-extrabold text-nexoraText break-all">
                          {card.cardCode || '—'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                          isLinked
                            ? 'bg-nexoraSuccess/10 text-nexoraSuccess'
                            : 'bg-nexoraSurfaceMuted text-nexoraSubtle'
                        }`}
                      >
                        {isLinked
                          ? t('dashboard.touchpoint_stats.active')
                          : t('dashboard.touchpoints.physical_card.not_linked_yet')}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                          {t('dashboard.touchpoints.physical_card.help_code')}
                        </p>
                        <p className="mt-1 font-mono font-bold text-nexoraText break-all">{card.helpCode || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                          {t('dashboard.touchpoints.physical_card.touchpoint')}
                        </p>
                        <p className={`mt-1 font-bold break-all ${card.touchPointName ? 'text-nexoraText' : 'text-nexoraSubtle italic font-normal'}`}>
                          {card.touchPointName || t('dashboard.touchpoints.physical_card.not_linked_yet')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                          {t('dashboard.touchpoints.physical_card.linked_at')}
                        </p>
                        <p className={`mt-1 text-sm ${card.linkedAt ? 'font-bold text-nexoraText' : 'text-nexoraSubtle italic font-normal'}`}>
                          {linkedAtLabel}
                        </p>
                      </div>
                    </div>

                    {card.helpCode ? (
                      <button
                        type="button"
                        onClick={() => setDetailHelpCode(card.helpCode ?? null)}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-flox-buttons border border-nexoraBorder dark:border-luxuryGold/18 px-3 text-xs font-bold uppercase tracking-wide text-nexoraBrand dark:text-luxuryGold hover:bg-nexoraBrandSoft/40 transition"
                      >
                        <Eye className="h-4 w-4" />
                        {t('dashboard.touchpoints.physical_card.view_detail')}
                      </button>
                    ) : null}
                  </Panel>
                )
              })}
            </div>
          )}
        </div>
      )}

      {detailHelpCode ? (
        <PhysicalCardDetailModal
          helpCode={detailHelpCode}
          onClose={() => setDetailHelpCode(null)}
        />
      ) : null}
    </div>
  )
}
