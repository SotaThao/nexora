import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Trash2,
  QrCode,
  ShieldAlert,
  HelpCircle,
  Check,
  Copy,
  X,
  Smartphone,
  Layers,
  Activity,
  AlertOctagon,
  Loader2,
  Eye,
  Coins,
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import { useNotification } from '../contexts/NotificationContext'
import CustomSelect from './CustomSelect'
import Pagination from './ui/Pagination'
import { useTouchpoints } from '../data/hooks/useMerchantTouchpoints'
import {
  usePhysicalCards,
  useLinkPhysicalCard,
  useUnlinkPhysicalCard,
} from '../data/hooks/useMerchantPhysicalCards'
import { usePagination } from '../hooks/usePagination'
import { DEFAULT_PAGE_SIZE, STAFF_FILTER_LIST_PAGE_SIZE } from '../constants/pagination'
import { buildQrImageUrl, slugify, toLocalCustomerTouchUrl } from '../utils/staffTipUrl'
import { QR_IMAGE_SIZES } from '../utils/qrUtils'
import { getWebUrlOrigin } from '../utils/webUrlBase'
import ToggleSwitch from './ui/ToggleSwitch'
import { formatCurrency, formatTransactionDateTime } from './dashboard/utils'
import {
  DASHBOARD_SETTINGS_QUERY_TAB,
  SHOW_HARDWARE_DEVICES,
  buildDashboardSettingsQueryPath,
} from './dashboard/constants'
import PhysicalCardDetailModal from './dashboard/modals/PhysicalCardDetailModal'
import MerchantPayoutMethodsPanel from './payout/MerchantPayoutMethodsPanel'
import StaffInviteQrPanel from './staff/StaffInviteQrPanel'
import AffiliateLinkPanel from './settings/AffiliateLinkPanel'
import SettingsTipQrPanel from './settings/SettingsTipQrPanel'
import TouchpointSectionTabs from './touchpoints/TouchpointSectionTabs'
import { normalizeTouchpointSection } from './touchpoints/touchpointSections'
import QrImage from './ui/QrImage'

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
  businessSlug: propBusinessSlug = '',
  inviteLinkSetting = null,
  isInviteLinkSettingLoading = false,
  devices = [],
  onAddDevice,
  onDeleteDevice,
  onToggleDeviceStatus,
  activeSubTab: propActiveSubTab,
  onTabChange,
  stationsSection = 'tip',
  onStationsSectionChange,
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()
  const [copiedId, setCopiedId] = useState(null)
  const [localActiveSubTab, setLocalActiveSubTab] = useState('stations')
  const activeSubTab = propActiveSubTab !== undefined ? propActiveSubTab : localActiveSubTab
  const setActiveSubTab = onTabChange !== undefined ? onTabChange : setLocalActiveSubTab
  const activeStationsSection = normalizeTouchpointSection(stationsSection)
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

  const businessSlug = useMemo(
    () => propBusinessSlug || slugify(businessName || ''),
    [businessName, propBusinessSlug],
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

  const handleCopy = useCallback(async (text, id) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      showToast(t('components.settings.tabs.ProfileTab.copied'), 'success')
      window.setTimeout(() => setCopiedId(null), 2000)
    } catch {
      showToast(t('components.dashboard.overview.Overview.copy_failed'), 'error')
    }
  }, [showToast, t])

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

  const touchpointTabs = useMemo(
    () => [
      { id: 'stations', label: t('dashboard.touchpoints.tabs.stations'), disabled: false },
      ...(SHOW_HARDWARE_DEVICES
        ? [{ id: 'devices', label: t('dashboard.touchpoints.tabs.devices'), disabled: false }]
        : []),
    ],
    [t],
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tab Header & Title */}
      <div className="border-b border-nexoraBorder pb-1 sm:pb-5">
        <h2 className="hidden text-lg font-extrabold text-nexoraText sm:block sm:text-xl">
          {t('dashboard.menu.touchpoints')}
        </h2>
        {/* Navigation Tabs */}
        {touchpointTabs.length > 1 ? (
        <div className="mt-3 flex w-full gap-1 rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted p-1 dark:border-luxuryGold/10 dark:bg-luxuryCoal sm:w-fit">
          {touchpointTabs.map(tab => (
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
        ) : null}
      </div>

      {activeSubTab === 'stations' && (
        <div className="space-y-4 sm:space-y-6">
          <TouchpointSectionTabs
            activeSection={activeStationsSection}
            onSectionChange={(section) => onStationsSectionChange?.(section)}
          />

          {activeStationsSection === 'tip' && (
          <section
            id="touchpoint-section-panel-tip"
            role="tabpanel"
            aria-labelledby="touchpoint-section-tab-tip"
            className="space-y-4 sm:space-y-6"
          >
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-nexoraMuted">
              {t('dashboard.touchpoints.stations_sections.tip_desc')}
            </p>
          </div>
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
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-flox-buttons bg-nexoraBrand px-5 text-sm font-bold text-white transition-all hover:bg-nexoraBrandDark dark:bg-luxuryGold dark:text-luxuryBlack dark:hover:bg-luxuryGoldLight"
          >
            <Plus className="h-4 w-4" />
            <span>{t('setup.add_tp_btn')}</span>
          </button>

          {/* Touchpoint Cards Grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {isLoading || isFetching ? (
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
            {!isLoading && !isFetching && touchpointsWithLinks.map((point) => {
              const isPointActive = point.isActive !== false
              const isToggling = togglingTouchpointId === point.id
              let qrUrl = ''
              if (point.url) {
                qrUrl = toLocalCustomerTouchUrl(String(point.url))
              }
              if (!qrUrl && point.slug && businessSlug) {
                qrUrl = `${getWebUrlOrigin()}/touch/${businessSlug}/${point.slug}`
              }

              const scans = point.scans ?? 0
              const revenue = point.revenue ?? 0
              const qrImageSrc = buildQrImageUrl(qrUrl, QR_IMAGE_SIZES.panel, point.qrImageUrl)

              return (
                <Panel key={point.id} className="relative min-h-0 overflow-visible border border-nexoraBorder p-3.5 transition-all duration-300 hover:shadow-premium">
                  {/* Subtle top decoration strip */}
                  <div className={`absolute top-0 left-0 right-0 h-1 transition-colors ${isPointActive ? 'bg-gradient-to-r from-nexoraBrand to-floxElectricViolet' : 'bg-nexoraBorder'}`} />
                  <div
                    role="group"
                    aria-label={`${point.name}: Station`}
                    className="flex flex-col gap-2.5"
                  >
                    <div className="flex items-start gap-3">
                      {/* Compact QR */}
                      <div
                        role="group"
                        aria-label={`${point.name}: QR`}
                        className="w-[92px] shrink-0 self-start"
                      >
                        <div
                          onClick={() => isPointActive && onQr && onQr(point)}
                          className="group/qr relative flex h-[92px] w-[92px] shrink-0 cursor-pointer select-none items-center justify-center overflow-hidden rounded-xl border border-nexoraBorder/60 bg-white p-1.5 shadow-sm transition-all hover:scale-[1.03] hover:border-nexoraBrand active:scale-95"
                          title={t('dashboard.modals.download_print_qr')}
                        >
                          <QrImage
                            src={qrImageSrc}
                            alt="Scan QR"
                            className={`h-full w-full transition-opacity duration-200 ${isPointActive ? 'opacity-100' : 'opacity-30 filter grayscale'}`}
                          />
                          {!isPointActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-luxuryBlack/60 p-1 text-center text-[8px] font-black uppercase tracking-wider text-white">
                              <ShieldAlert className="mb-0.5 h-4 w-4 animate-pulse text-luxuryAmber" />
                              <span>Disabled</span>
                            </div>
                          )}
                          {isPointActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-nexoraBrand/80 p-1 text-center text-[8px] font-black uppercase tracking-wider text-white opacity-0 transition-opacity group-hover/qr:opacity-100 select-none">
                              <QrCode className="h-4 w-4" />
                              <span>Preview</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Unified station information */}
                      <div
                        role="group"
                        aria-label={`${point.name}: Details`}
                        className="flex min-w-0 flex-1 flex-col"
                      >
                        <div className="space-y-0.5">
                          <h3 className="truncate text-sm font-extrabold leading-snug text-nexoraText" title={point.name}>
                            {point.name}
                          </h3>
                          <p className="truncate font-mono text-[9.5px] text-nexoraSubtle select-all">
                            {qrUrl.replace(/^https?:\/\//, '')}
                          </p>
                        </div>

                        <div className="mt-2 flex items-center justify-start gap-1.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                            isPointActive
                              ? 'bg-emerald-50 text-nexoraSuccess dark:bg-emerald-500/10'
                              : 'bg-nexoraSurfaceMuted text-nexoraSubtle dark:bg-white/5'
                          }`}>
                            {isPointActive ? t('dashboard.touchpoint_stats.active') : t('dashboard.touchpoint_stats.inactive')}
                          </span>
                          <ToggleSwitch
                            checked={isPointActive}
                            loading={isToggling}
                            onChange={() => onToggleStatus && onToggleStatus(point.id)}
                            activeColor="bg-nexoraBrand"
                            inactiveColor="bg-nexoraBorder"
                            ariaLabel={isPointActive ? t('dashboard.touchpoint_stats.active') : t('dashboard.touchpoint_stats.inactive')}
                          />
                        </div>

                        <div
                          role="group"
                          aria-label={`${point.name}: ${t('dashboard.touchpoint_stats.scans')} & ${t('dashboard.touchpoint_stats.revenue')}`}
                          className="mt-2 grid grid-cols-2 gap-x-3 text-[10px] font-bold text-nexoraMuted"
                        >
                          <div className="min-w-0 whitespace-nowrap">
                            {t('dashboard.touchpoint_stats.scans')}: <span className="text-xs font-black text-nexoraText">{scans}</span>
                          </div>
                          <div className="min-w-0 whitespace-nowrap">
                            {t('dashboard.touchpoint_stats.revenue')}: <span className="text-xs font-black text-nexoraSuccess">{formatCurrency(revenue)}</span>
                          </div>
                        </div>

                        <div
                          role="group"
                          aria-label={`${point.name}: Primary actions`}
                          className={`mt-2 grid gap-1.5 ${
                            point.type !== 'FrontDesk' && point.slug !== 'master-store'
                              ? 'grid-cols-3'
                              : 'grid-cols-2'
                          }`}
                        >
                          <button
                            type="button"
                            disabled={!isPointActive}
                            onClick={() => onQr?.(point)}
                            className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 text-[10px] font-bold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <QrCode className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {t('dashboard.touchpoints.station_actions.view')}
                            </span>
                          </button>
                          <button
                            type="button"
                            disabled={!qrUrl}
                            onClick={() => handleCopy(qrUrl, `station-link-${point.id}`)}
                            className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-nexoraBorder bg-white px-2 text-[10px] font-bold text-nexoraText transition hover:bg-nexoraSurfaceMuted disabled:cursor-not-allowed disabled:opacity-50 dark:bg-luxuryCoal"
                          >
                            {copiedId === `station-link-${point.id}` ? (
                              <Check className="h-3.5 w-3.5 shrink-0 text-nexoraSuccess" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="truncate">
                              {t('dashboard.touchpoints.station_actions.copy_link')}
                            </span>
                          </button>
                          {point.type !== 'FrontDesk' && point.slug !== 'master-store' ? (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(point.id)}
                              className="inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg border border-nexoraDanger/20 px-2 text-[10px] font-bold text-nexoraDanger transition hover:bg-nexoraDanger/5"
                            >
                              <Trash2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">
                                {t('dashboard.touchpoints.station_actions.remove')}
                              </span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* QR configuration */}
                    <div
                      role="group"
                      aria-label={`${point.name}: QR settings`}
                      className="space-y-2 overflow-visible border-t border-nexoraRule pt-2 dark:border-white/5"
                    >
                      {linkingPointId === point.id && !point.deviceId ? (
                        <div className="flex min-w-0 items-start gap-2">
                          <div className="min-w-0 flex-1 space-y-1">
                            <input
                              type="text"
                              value={linkInputVal}
                              onChange={(e) => {
                                setLinkInputVal(e.target.value)
                                if (linkInputError) setLinkInputError('')
                              }}
                              placeholder={t('components.TouchpointsView.phDeviceId')}
                              className={`h-9 w-full rounded-flox-inputs border bg-white px-3 text-xs text-nexoraText outline-none focus:border-nexoraBrand dark:bg-luxuryCoal ${
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
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-flox-buttons bg-nexoraSuccess text-white hover:bg-nexoraSuccess/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-flox-buttons bg-nexoraRule text-nexoraMuted hover:bg-nexoraBorder active:scale-95 dark:bg-white/10 dark:text-nexoraSubtle dark:hover:bg-white/20"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          {point.deviceId ? (
                            <div
                              className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-nexoraBrand/20 bg-gradient-to-r from-nexoraBrand/10 to-brandCyan/10 px-2.5 py-1.5 text-[9.5px] font-black uppercase tracking-wider text-nexoraBrand dark:text-luxuryGold"
                              title={point.deviceId}
                            >
                              <Smartphone className="h-3.5 w-3.5 shrink-0 text-nexoraBrand dark:text-luxuryGold" />
                              <span className="truncate">{point.deviceId}</span>
                            </div>
                          ) : (
                            <span className="text-[9.5px] italic leading-relaxed text-nexoraSubtle">
                              {t('dashboard.touchpoints.paper_qr_only')}
                            </span>
                          )}
                          {point.deviceId ? (
                            <div className="flex shrink-0 items-center gap-1.5">
                              {helpCodeByTouchPointId.get(point.id) ? (
                                <button
                                  type="button"
                                  onClick={() => setDetailHelpCode(helpCodeByTouchPointId.get(point.id) ?? null)}
                                  aria-label={t('dashboard.touchpoints.physical_card.view_detail')}
                                  title={t('dashboard.touchpoints.physical_card.view_detail')}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-flox-buttons border border-nexoraBorder text-nexoraBrand transition hover:bg-nexoraBrand/5 dark:border-luxuryGold/18 dark:text-luxuryGold dark:hover:bg-luxuryGold/10"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => setUnlinkConfirmPoint(point)}
                                disabled={unlinkPhysicalCardMutation.isPending}
                                className="flex h-8 items-center justify-center whitespace-nowrap rounded-flox-buttons border border-nexoraDanger/20 px-2.5 text-[10px] font-black capitalize tracking-wider text-nexoraDanger hover:bg-nexoraDanger/5 focus:outline-none disabled:opacity-50"
                              >
                                {unlinkPhysicalCardMutation.isPending &&
                                unlinkPhysicalCardMutation.variables === point.deviceId ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  t('dashboard.touchpoints.unlink_btn')
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartLink(point)}
                              className="flex h-8 items-center justify-center whitespace-nowrap rounded-flox-buttons border border-nexoraBrand/20 px-2.5 text-[10px] font-black capitalize tracking-wider text-nexoraBrand hover:bg-nexoraBrand/5 focus:outline-none dark:border-luxuryGold/20 dark:text-luxuryGold dark:hover:bg-luxuryGold/5"
                            >
                              {t('dashboard.touchpoints.link_device_btn')}
                            </button>
                          )}
                        </div>
                      )}
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 modal-overlay-safe backdrop-blur-sm">
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 modal-overlay-safe backdrop-blur-sm">
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
          </section>
          )}

          {activeStationsSection === 'payment' && (
            <section
              id="touchpoint-section-panel-payment"
              role="tabpanel"
              aria-labelledby="touchpoint-section-tab-payment"
              className="space-y-4"
            >
              <p className="text-xs leading-relaxed text-nexoraMuted">
                {t('dashboard.touchpoints.stations_sections.payment_desc')}
              </p>
              <Panel className="p-4 sm:p-6">
                <SettingsTipQrPanel
                  variant="compact"
                  businessName={businessName}
                  showToast={showToast}
                  handleCopy={handleCopy}
                  copiedId={copiedId}
                  t={t}
                  onConfigurePayoutMethods={() =>
                    navigate(
                      buildDashboardSettingsQueryPath(
                        DASHBOARD_SETTINGS_QUERY_TAB.payout,
                      ),
                    )
                  }
                />
              </Panel>
              <MerchantPayoutMethodsPanel />
            </section>
          )}

          {activeStationsSection === 'referral' && (
            <section
              id="touchpoint-section-panel-referral"
              role="tabpanel"
              aria-labelledby="touchpoint-section-tab-referral"
              className="space-y-4"
            >
              <p className="text-xs leading-relaxed text-nexoraMuted">
                {t('dashboard.touchpoints.stations_sections.referral_desc')}
              </p>
              <AffiliateLinkPanel />
            </section>
          )}

          {activeStationsSection === 'staff-invite' && (
            <section
              id="touchpoint-section-panel-staff-invite"
              role="tabpanel"
              aria-labelledby="touchpoint-section-tab-staff-invite"
              className="space-y-4"
            >
              <p className="text-xs leading-relaxed text-nexoraMuted">
                {t('dashboard.touchpoints.stations_sections.staff_invite_desc')}
              </p>
              <StaffInviteQrPanel
                businessName={businessName}
                businessSlug={businessSlug}
                inviteLinkSetting={inviteLinkSetting}
                isLoading={isInviteLinkSettingLoading}
              />
            </section>
          )}
        </div>
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
                          {card.linkedAt
                            ? formatTransactionDateTime(card.linkedAt, currentLanguage)
                            : t('dashboard.touchpoints.physical_card.not_linked_yet')}
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
