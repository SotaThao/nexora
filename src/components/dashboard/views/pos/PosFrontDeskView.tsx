// PosFrontDeskView — POS Merchant Ops: Check-in / Order List / Turn Board / Completed
// Orders / Bookings (US-12/US-13/US-14, refactored to Order in US-026, full-page Order
// Workspace in US-17). POS iPad redesign (Tickets 1-5): Waiting List folded into Order
// List as a status filter, Check-in opens the Order Workspace directly (no separate
// step-1 form), warm posFd* visual identity distinct from the dashboard's nexoraBrand.
// Shared between the Owner dashboard (POS > Front Desk) and the Staff dashboard
// (My Salons > a business the Staff has the Operations permission for) — same
// component, no per-shell duplication. `canManageOperations` (from usePosAccess)
// decides whether the actionable UI renders at all; the caller (Owner vs Staff
// route wrapper) is responsible for only linking here when access is expected.
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { LayoutGrid, List as ListIcon, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { storage } from '../../../../utils/storage'
import { getApiErrorCode } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { qk } from '../../../../data/queryKeys'
import { usePosAccess } from '../../../../data/hooks/usePosAccess'
import {
  useAssignStaffToServiceLine,
  useCancelOrder,
  useOrderList,
  useStartOrderService,
  useWaitlist,
} from '../../../../data/hooks/usePosOrders'
import { useTurnBoard } from '../../../../data/hooks/usePosTurnBoard'
import { useAddOrderServiceLine, useCheckoutServiceCatalog } from '../../../../data/hooks/usePosCheckout'
import { PosOrderStatus } from '../../../../constants/posOrderStatus'
import type { OrderListItemApiDto, TurnBoardStationApiDto } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import PosOrderWorkspace from './PosOrderWorkspace'
import PosCompletedOrdersPanel from './PosCompletedOrdersPanel'
import NewBookingForm from './booking/NewBookingForm'
import BookingTab from './booking/BookingTab'

type FrontDeskTab = 'checkin' | 'orderlist' | 'turnboard' | 'completed' | 'booking'

// Order List (US-17) folds the old standalone Waitlist tab in as a filter — Waiting +
// InService both come from the same useOrderList query, so this stays a client-side
// filter rather than a second query.
type OrderListFilter = 'all' | 'waiting' | 'inservice'

// POS iPad redesign, Ticket 3 — user-chosen List/Card view, remembered across visits
// (pure UI preference, not domain data — plain storage.* is fine here per CLAUDE.md).
type OrderListViewMode = 'list' | 'card'
const ORDER_LIST_VIEW_MODE_STORAGE_KEY = 'pos_order_list_view_mode'

// POS iPad redesign — Create mode no longer carries a pre-filled customerDraft;
// PosOrderWorkspace now collects it itself via its own 2-step Check-in
// (PhoneCheckInStep for phone, then CustomerHeaderBar for name/email/catalog).
//
// Only Update mode (editing an already-existing, server-backed order) is modeled as an
// ephemeral overlay here — closing it loses nothing since GetOrderDetailQuery re-fetches
// the same state next time. The Create-mode draft is NOT part of this state: it's a
// permanently-mounted PosOrderWorkspace instance rendered below (hidden via CSS, not
// unmounted, whenever the Check-in tab isn't active) specifically so a staff member's
// in-progress phone/name/services entry survives tapping over to another tab and back.
type UpdateWorkspaceState = { orderId: string }

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function PosFrontDeskView({
  businessId,
  businessName,
  businessSlug,
}: {
  businessId: string
  // Shown on Check-in Step 1's welcome message — optional since the Staff dashboard route
  // doesn't have it readily available; PhoneCheckInStep falls back to a generic greeting.
  businessName?: string
  businessSlug?: string
}) {
  const { t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const queryClient = useQueryClient()
  const { data: access, isLoading: isAccessLoading } = usePosAccess(businessId)
  // Still used by the Turn Board "assign an Empty station" dropdown below —
  // only the standalone Waitlist tab (now folded into Order List) was removed.
  const { data: waitlist = [] } = useWaitlist(businessId)
  const { data: orderList = [], isLoading: isOrderListLoading } = useOrderList(businessId)
  const { data: turnBoard = [], isLoading: isTurnBoardLoading } = useTurnBoard(businessId)
  const { data: serviceCatalog = [] } = useCheckoutServiceCatalog(businessId)
  const cancelOrder = useCancelOrder(businessId)
  const addOrderServiceLine = useAddOrderServiceLine(businessId)
  const assignStaffToServiceLine = useAssignStaffToServiceLine(businessId)
  const startOrderService = useStartOrderService(businessId)

  // Deep-link support for the Owner Dashboard's "Total Bookings" KPI card (Ticket 10),
  // which navigates here with ?tab=booking to land straight on the Bookings tab. Also
  // kept in sync on every tab switch (see setActiveTab below) so a reload restores
  // whichever tab was active instead of always falling back to Order List.
  const FRONT_DESK_TABS: FrontDeskTab[] = ['checkin', 'orderlist', 'turnboard', 'completed', 'booking']
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as FrontDeskTab | null
  const initialTab: FrontDeskTab =
    tabFromUrl && FRONT_DESK_TABS.includes(tabFromUrl) ? tabFromUrl : 'orderlist'
  const [activeTab, setActiveTabState] = useState<FrontDeskTab>(initialTab)
  const setActiveTab = (tab: FrontDeskTab) => {
    setActiveTabState(tab)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', tab)
        return next
      },
      { replace: true },
    )
  }
  const [orderListFilter, setOrderListFilter] = useState<OrderListFilter>('all')
  const [viewMode, setViewMode] = useState<OrderListViewMode>(() =>
    storage.getItem(ORDER_LIST_VIEW_MODE_STORAGE_KEY) === 'card' ? 'card' : 'list',
  )
  const handleChangeViewMode = (mode: OrderListViewMode) => {
    setViewMode(mode)
    storage.setItem(ORDER_LIST_VIEW_MODE_STORAGE_KEY, mode)
  }
  const [assignStaffSelection, setAssignStaffSelection] = useState<Record<string, string>>({})
  const [assignServiceSelection, setAssignServiceSelection] = useState<Record<string, string>>({})
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null)
  const [updateWorkspace, setUpdateWorkspace] = useState<UpdateWorkspaceState | null>(null)
  // Entry point for creating a booking (Ticket 3) — kept as the one global "+ New Booking"
  // action; Ticket 9 added the "Bookings" tab/management screen below for viewing, checking
  // in, cancelling, and rescheduling existing bookings.
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  if (isAccessLoading) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={1} />
      </div>
    )
  }

  if (access?.canManageOperations === false) {
    return (
      <div className="nexora-card p-6 text-xs text-nexoraMuted">
        {t('components.dashboard.views.pos.PosFrontDeskView.noAccess')}
      </div>
    )
  }

  // Leaving the Order Workspace (Close/Checked-in/Completed) always refreshes every
  // list this screen shows — most individual actions already invalidate the right cache
  // via their own mutation hooks, but this is a direct guarantee independent of exactly
  // which actions fired while the workspace was open.
  const refreshFrontDeskLists = () => {
    queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
    queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
    queryClient.invalidateQueries({ queryKey: qk.merchantPosCompletedOrders(businessId) })
  }

  const handleCancel = async (orderId: string, name: string) => {
    const confirmed = await showConfirm(
      t('components.dashboard.views.pos.PosFrontDeskView.confirmCancelBody', { name }),
      t('components.dashboard.views.pos.PosFrontDeskView.confirmCancelTitle'),
    )
    if (!confirmed) return
    try {
      await cancelOrder.mutateAsync(orderId)
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  // Order List (manual Waiting -> InService trigger) — backend rejects this when a service
  // line has no technician assigned yet (see StartOrderServiceCommand), surfaced as a toast.
  const handleStartService = async (orderId: string) => {
    try {
      await startOrderService.mutateAsync(orderId)
      showToast(t('components.dashboard.views.pos.PosFrontDeskView.startServiceSuccess'))
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  // Turn Board "Empty" station quick-assign — still 3 sequential calls (add a NEW service
  // line, assign it to this free staff, then start it). POS iPad redesign, Ticket 5:
  // kept as-is on purpose, re-scoped from the original brainstorm's "Assign Next" (auto-pick
  // the oldest unassigned waiting order) — every order already gets a concrete staff at
  // Check-in (see PosStaffAssignmentResolver), so there is no "unassigned order" left to
  // grab. What this really does now: an already-free technician picks up an *additional*
  // service for an existing customer's order (e.g. their pedicure after someone else did
  // their manicure) — a multi-service upsell action, not a queue hand-off.
  const handleAssignAndStart = async (orderId: string, posStaffProfileId?: string) => {
    const posServiceId = assignServiceSelection[orderId] ?? serviceCatalog[0]?.id
    const service = serviceCatalog.find((s) => s.id === posServiceId)
    if (!posServiceId || !service) {
      showToast(t('components.dashboard.views.pos.PosFrontDeskView.noServiceAvailable'), 'error')
      return
    }
    setAssigningOrderId(orderId)
    try {
      const serviceLineId = await addOrderServiceLine.mutateAsync({
        orderId,
        posServiceId,
        unitPrice: service.price,
        serviceName: service.name,
      })
      await assignStaffToServiceLine.mutateAsync({ orderId, serviceLineId, posStaffProfileId })
      await startOrderService.mutateAsync(orderId)
      showToast(t('components.dashboard.views.pos.PosFrontDeskView.assigned'))
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    } finally {
      setAssigningOrderId(null)
    }
  }

  const tabs: { id: FrontDeskTab; labelKey: string; badge?: number }[] = [
    { id: 'checkin', labelKey: 'components.dashboard.views.pos.PosFrontDeskView.tabs.checkin' },
    {
      id: 'orderlist',
      labelKey: 'components.dashboard.views.pos.PosFrontDeskView.tabs.orderlist',
      badge: orderList.length,
    },
    { id: 'turnboard', labelKey: 'components.dashboard.views.pos.PosFrontDeskView.tabs.turnboard' },
    { id: 'completed', labelKey: 'components.dashboard.views.pos.PosFrontDeskView.tabs.completed' },
    { id: 'booking', labelKey: 'components.dashboard.views.pos.PosFrontDeskView.tabs.booking' },
  ]

  const renderServiceSelect = (orderId: string) => (
    <select
      value={assignServiceSelection[orderId] ?? serviceCatalog[0]?.id ?? ''}
      onChange={(e) => setAssignServiceSelection((prev) => ({ ...prev, [orderId]: e.target.value }))}
      className="h-9 w-full rounded-lg border border-posFdBorder bg-white px-2.5 text-xs text-posFdText outline-none focus:border-posFdAccent"
    >
      {serviceCatalog.map((service) => (
        <option key={service.id} value={service.id}>
          {service.name} — ${service.price.toFixed(2)}
        </option>
      ))}
    </select>
  )

  const renderStationCard = (station: TurnBoardStationApiDto) => {
    const selectedOrderId = assignStaffSelection[station.posStaffProfileId] ?? waitlist[0]?.id ?? ''
    const isAssigningThisStation = assigningOrderId === selectedOrderId

    return (
      <div
        key={station.posStaffProfileId}
        className="space-y-3 rounded-xl border border-posFdBorder bg-posFdSurface p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-posFdLavender/20 text-[11px] font-bold text-posFdAccentDark">
            {station.photoUrl ? (
              <img src={station.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              getInitials(station.displayName)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-posFdText">{station.displayName}</p>
            <p className="text-[11px] font-extrabold uppercase text-posFdMuted">
              {t(`components.dashboard.views.pos.PosFrontDeskView.stationStatus.${station.currentStatus}`)}
            </p>
          </div>
        </div>

        {station.currentStatus === PosOrderStatus.InService && (
          <div className="space-y-2 rounded-lg bg-posFdCanvas p-3">
            <p className="truncate text-xs font-bold text-posFdText">{station.currentCustomerName}</p>
            {station.currentPrimaryServiceName ? (
              <p className="truncate text-[11px] text-posFdMuted">{station.currentPrimaryServiceName}</p>
            ) : null}
            {station.assignedAt ? (
              <p className="text-[11px] text-posFdMuted">
                {t('components.dashboard.views.pos.PosFrontDeskView.servingSince', {
                  time: formatTime(station.assignedAt),
                })}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => station.currentOrderId && setUpdateWorkspace({ orderId: station.currentOrderId })}
              className="h-9 w-full rounded-lg bg-posFdAccent text-xs font-bold text-white hover:bg-posFdAccentDark disabled:opacity-60"
            >
              {t('components.dashboard.views.pos.PosFrontDeskView.checkoutButton')}
            </button>
          </div>
        )}

        {station.currentStatus === 'Empty' && (
          <div className="space-y-2">
            {waitlist.length > 0 ? (
              <>
                <select
                  value={selectedOrderId}
                  onChange={(e) =>
                    setAssignStaffSelection((prev) => ({ ...prev, [station.posStaffProfileId]: e.target.value }))
                  }
                  className="h-9 w-full rounded-lg border border-posFdBorder bg-white px-2.5 text-xs text-posFdText outline-none focus:border-posFdAccent"
                >
                  {waitlist.map((order) => (
                    <option key={order.id} value={order.id}>
                      #{order.orderNumber} — {order.customerName}
                    </option>
                  ))}
                </select>
                {renderServiceSelect(selectedOrderId)}
                <button
                  type="button"
                  onClick={() => handleAssignAndStart(selectedOrderId, station.posStaffProfileId)}
                  disabled={isAssigningThisStation || serviceCatalog.length === 0}
                  className="h-9 w-full rounded-lg bg-posFdAccent text-xs font-bold text-white hover:bg-posFdAccentDark disabled:opacity-60"
                >
                  {isAssigningThisStation ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    t('components.dashboard.views.pos.PosFrontDeskView.assignGuestButton')
                  )}
                </button>
              </>
            ) : (
              <p className="text-[11px] text-posFdMuted">
                {t('components.dashboard.views.pos.PosFrontDeskView.waitlistEmpty')}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hidden while an Order Workspace is open (Check-in draft or editing an existing
          order) — iPad space optimization: this title/description/+New Booking block is
          "where am I" chrome that's redundant once the staff is heads-down on one
          customer's ticket, and the tab bar right below already stays visible/tappable
          for switching away. */}
      {!updateWorkspace && activeTab !== 'checkin' ? (
        <section className="flex items-start justify-between gap-3 px-0.5">
          <div className="space-y-1">
            <h1 className="text-base font-semibold leading-tight text-nexoraText">
              {t('dashboard.menu.pos_board')}
            </h1>
            <p className="text-xs text-nexoraMuted">
              {t('components.dashboard.views.pos.PosFrontDeskView.description')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="h-9 shrink-0 rounded-lg bg-posFdAccent px-3 text-xs font-bold text-white hover:bg-posFdAccentDark"
          >
            {t('components.dashboard.views.pos.NewBookingForm.newBookingButton')}
          </button>
        </section>
      ) : null}

      {/* POS Front Desk visual identity: warm accent (posFd*), distinct from the
          main dashboard's nexoraBrand — see tailwind.config.js. */}
      <div className="flex gap-1 border-b border-posFdBorder">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              // Switching tabs while editing an existing order (Update mode) closes that
              // overlay — its edits are already live server-side (GetOrderDetailQuery
              // re-fetches the same state next time), so nothing is lost. The Check-in
              // draft is unaffected by this: it's a separately-mounted instance further
              // down that only gets hidden, never unmounted, by this tab switch.
              if (updateWorkspace) {
                setUpdateWorkspace(null)
                refreshFrontDeskLists()
              }
              setActiveTab(tab.id)
            }}
            className={`px-3 py-2 text-xs font-bold ${
              !updateWorkspace && activeTab === tab.id
                ? 'border-b-2 border-posFdAccent text-posFdAccentDark'
                : 'text-nexoraMuted hover:text-nexoraText'
            }`}
          >
            {t(tab.labelKey)}
            {typeof tab.badge === 'number' ? ` (${tab.badge})` : ''}
          </button>
        ))}
      </div>

      {updateWorkspace ? (
        <PosOrderWorkspace
          businessId={businessId}
          businessName={businessName}
          orderId={updateWorkspace.orderId}
          onClose={() => {
            setUpdateWorkspace(null)
            refreshFrontDeskLists()
          }}
          onCompleted={() => {
            setUpdateWorkspace(null)
            refreshFrontDeskLists()
          }}
        />
      ) : (
        <>
      {/* Always mounted (hidden via CSS, not unmounted) so the in-progress phone/name/
          services draft survives switching to another tab and back — PosOrderWorkspace
          resets its own local state back to Step 1 only after a successful Check-In/
          Checkout, or via its own Cancel button. See top-of-file note. */}
      <div className={activeTab === 'checkin' ? '' : 'hidden'}>
        <PosOrderWorkspace
          businessId={businessId}
          businessName={businessName}
          orderId={null}
          onCheckedIn={() => {
            // 'waitlist' tab is gone (folded into Order List as a filter) — land on
            // Order List pre-filtered to Waiting so the just-created ticket is visible.
            setActiveTab('orderlist')
            setOrderListFilter('waiting')
            refreshFrontDeskLists()
          }}
          onCompleted={refreshFrontDeskLists}
        />
      </div>

      {activeTab === 'orderlist' && (
        isOrderListLoading ? (
          <div className="rounded-xl border border-posFdBorder bg-posFdSurface p-6">
            <SkeletonList count={3} lines={1} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {(['all', 'waiting', 'inservice'] as OrderListFilter[]).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setOrderListFilter(filter)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                      orderListFilter === filter
                        ? 'bg-posFdAccent text-white'
                        : 'border border-posFdBorder text-posFdMuted hover:text-posFdText'
                    }`}
                  >
                    {t(`components.dashboard.views.pos.PosFrontDeskView.orderListFilter.${filter}`)}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 rounded-lg border border-posFdBorder p-0.5">
                <button
                  type="button"
                  onClick={() => handleChangeViewMode('list')}
                  aria-label={t('components.dashboard.views.pos.PosFrontDeskView.viewModeList')}
                  className={`rounded-md p-1.5 ${
                    viewMode === 'list' ? 'bg-posFdAccent text-white' : 'text-posFdMuted hover:text-posFdText'
                  }`}
                >
                  <ListIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeViewMode('card')}
                  aria-label={t('components.dashboard.views.pos.PosFrontDeskView.viewModeCard')}
                  className={`rounded-md p-1.5 ${
                    viewMode === 'card' ? 'bg-posFdAccent text-white' : 'text-posFdMuted hover:text-posFdText'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            {(() => {
              const filteredOrderList = orderList.filter((order) => {
                if (orderListFilter === 'waiting') return order.status === PosOrderStatus.Waiting
                if (orderListFilter === 'inservice') return order.status === PosOrderStatus.InService
                return true
              })

              if (filteredOrderList.length === 0) {
                return (
                  <div className="rounded-xl border border-posFdBorder bg-posFdSurface p-6 text-center text-xs text-posFdMuted">
                    {t('components.dashboard.views.pos.PosFrontDeskView.orderListEmpty')}
                  </div>
                )
              }

              const renderCancelButton = (order: OrderListItemApiDto) =>
                order.status === PosOrderStatus.Waiting ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCancel(order.id, order.customerName)
                    }}
                    disabled={cancelOrder.isPending}
                    className="shrink-0 rounded-lg border border-posFdBorder px-2.5 py-1 text-[10px] font-bold text-posFdMuted hover:border-posFdDanger hover:bg-posFdDangerBg hover:text-posFdDanger disabled:opacity-60"
                  >
                    {t('components.dashboard.views.pos.PosFrontDeskView.cancelButton')}
                  </button>
                ) : null

              const renderStartServiceButton = (order: OrderListItemApiDto) =>
                order.status === PosOrderStatus.Waiting ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartService(order.id)
                    }}
                    disabled={startOrderService.isPending}
                    className="shrink-0 rounded-lg border border-posFdAccent bg-posFdAccent px-2.5 py-1 text-[10px] font-bold text-white hover:bg-posFdAccentDark disabled:opacity-60"
                  >
                    {t('components.dashboard.views.pos.PosFrontDeskView.startServiceButton')}
                  </button>
                ) : null

              // Bounded height + internal scroll so a long queue scrolls in place — the
              // filter chips/view toggle above stay put instead of the whole page scrolling.
              if (viewMode === 'card') {
                return (
                  <div className="grid max-h-[560px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredOrderList.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => setUpdateWorkspace({ orderId: order.id })}
                        className="cursor-pointer space-y-2 rounded-2xl border border-posFdBorder bg-posFdSurface p-4 hover:border-posFdAccent"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold text-posFdMuted">#{order.orderNumber}</span>
                          <span className="rounded-full bg-posFdCanvas px-2 py-0.5 text-[10px] font-black uppercase text-posFdAccentDark">
                            {order.status}
                          </span>
                        </div>
                        <p className="truncate text-sm font-bold text-posFdText">{order.customerName}</p>
                        <p className="truncate text-[11px] text-posFdMuted">
                          {order.serviceNames.length > 0 ? order.serviceNames.join(', ') : '—'}
                        </p>
                        <p className="truncate text-[11px] text-posFdMuted">
                          {order.technicianNames.length > 0 ? order.technicianNames.join(', ') : '—'}
                        </p>
                        <div className="flex items-center justify-between gap-2 border-t border-posFdBorder pt-2">
                          <span className="text-[11px] text-posFdMuted">
                            {t('components.dashboard.views.pos.PosFrontDeskView.waitMinutes', { minutes: order.elapsedMinutes })}
                          </span>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {renderStartServiceButton(order)}
                            {renderCancelButton(order)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }

              return (
                <div className="max-h-[560px] overflow-y-auto rounded-xl border border-posFdBorder bg-posFdSurface p-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-wide text-posFdMuted">
                        <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosFrontDeskView.orderListColumnOrder')}</th>
                        <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosFrontDeskView.orderListColumnGuest')}</th>
                        <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosFrontDeskView.orderListColumnStatus')}</th>
                        <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosFrontDeskView.orderListColumnTechnician')}</th>
                        <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosFrontDeskView.orderListColumnServices')}</th>
                        <th className="pb-2 pr-3 text-right">{t('components.dashboard.views.pos.PosFrontDeskView.orderListColumnElapsed')}</th>
                        <th className="pb-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrderList.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => setUpdateWorkspace({ orderId: order.id })}
                          className="cursor-pointer border-t border-posFdBorder hover:bg-posFdCanvas"
                        >
                          <td className="py-2 pr-3 font-mono font-bold text-posFdMuted">#{order.orderNumber}</td>
                          <td className="py-2 pr-3 font-bold text-posFdText">{order.customerName}</td>
                          <td className="py-2 pr-3">
                            <span className="rounded-full bg-posFdCanvas px-2 py-0.5 text-[10px] font-black uppercase text-posFdAccentDark">
                              {order.status}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-posFdMuted">
                            {order.technicianNames.length > 0 ? order.technicianNames.join(', ') : '—'}
                          </td>
                          <td className="py-2 pr-3 text-posFdMuted">
                            {order.serviceNames.length > 0 ? order.serviceNames.join(', ') : '—'}
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums text-posFdMuted">
                            {t('components.dashboard.views.pos.PosFrontDeskView.waitMinutes', { minutes: order.elapsedMinutes })}
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex justify-end gap-1.5">
                              {renderStartServiceButton(order)}
                              {renderCancelButton(order)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })()}
          </div>
        )
      )}

      {activeTab === 'turnboard' && (
        isTurnBoardLoading ? (
          <div className="rounded-xl border border-posFdBorder bg-posFdSurface p-6">
            <SkeletonList count={3} lines={2} />
          </div>
        ) : turnBoard.length === 0 ? (
          <div className="rounded-xl border border-posFdBorder bg-posFdSurface p-6 text-center text-xs text-posFdMuted">
            {t('components.dashboard.views.pos.PosFrontDeskView.turnBoardEmpty')}
          </div>
        ) : (
          // Bounded height + internal scroll, same principle as Order List — a long
          // roster of stations scrolls in place instead of the whole page.
          <div className="grid max-h-[560px] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {turnBoard.map(renderStationCard)}
          </div>
        )
      )}

      {activeTab === 'completed' && <PosCompletedOrdersPanel businessId={businessId} />}

      {activeTab === 'booking' && (
        <BookingTab businessId={businessId} businessSlug={businessSlug} turnBoardStaff={turnBoard} />
      )}
        </>
      )}

      <NewBookingForm
        open={isBookingModalOpen}
        businessId={businessId}
        onClose={() => setIsBookingModalOpen(false)}
        onCreated={() => {
          setIsBookingModalOpen(false)
          refreshFrontDeskLists()
        }}
      />
    </div>
  )
}
