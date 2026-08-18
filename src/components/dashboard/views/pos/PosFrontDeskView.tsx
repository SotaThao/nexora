// PosFrontDeskView — POS Merchant Ops: Check-in / Order List / Turn Board / Completed
// Orders / Bookings (US-12/US-13/US-14, refactored to Order in US-026, full-page Order
// Workspace in US-17). POS iPad redesign (Tickets 1-5): Waiting List folded into Order
// List as a status filter, Check-in opens the Order Workspace directly (no separate
// step-1 form), unified on the dashboard's shared nexora* color tokens (nexoraBrand etc.).
// Shared between the Owner dashboard (POS > Front Desk) and the Staff dashboard
// (My Salons > a business the Staff has the Operations permission for) — same
// component, no per-shell duplication. `canManageOperations` (from usePosAccess)
// decides whether the actionable UI renders at all; the caller (Owner vs Staff
// route wrapper) is responsible for only linking here when access is expected.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, LayoutGrid, List as ListIcon } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { storage } from '../../../../utils/storage'
import { getApiErrorCode } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { qk } from '../../../../data/queryKeys'
import { usePosAccess } from '../../../../data/hooks/usePosAccess'
import { formatPosTime } from './posDateTime'
import { useCancelOrder, useOrderList, useStartOrderService } from '../../../../data/hooks/usePosOrders'
import { useTurnBoard } from '../../../../data/hooks/usePosTurnBoard'
import { PosOrderStatus } from '../../../../constants/posOrderStatus'
import {
  DEFAULT_POS_FRONT_DESK_TAB,
  ORDER_LIST_FILTERS,
  ORDER_LIST_VIEW_MODE_STORAGE_KEY,
  OrderListFilter,
  OrderListViewMode,
  POS_FRONT_DESK_TAB_PARAM,
  POS_FRONT_DESK_TABS,
  PosFrontDeskTab,
} from '../../../../constants/posFrontDesk'
import type { OrderListItemApiDto, TurnBoardStationApiDto } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import { getInitials, joinOrEmpty } from './posDisplay'
import PosOrderWorkspace from './PosOrderWorkspace'
import PosCheckInTab from './PosCheckInTab'
import PosCompletedOrdersPanel from './PosCompletedOrdersPanel'
import NewBookingForm from './booking/NewBookingForm'
import BookingTab from './booking/BookingTab'
import CustomerTab from './customer/CustomerTab'
import TimeClockTab from './timeclock/TimeClockTab'

// Every string this screen passes to t() lives under one namespace — building them through tk()
// keeps the prefix in a single place instead of repeating it two dozen times inline.
const I18N_PREFIX = 'components.dashboard.views.pos.PosFrontDeskView'
const tk = (suffix: string) => `${I18N_PREFIX}.${suffix}`

// Bounded height + internal scroll so a long queue/roster scrolls in place — the filter chips and
// view toggle above stay put instead of the whole page scrolling.
const SCROLL_PANEL_MAX_HEIGHT = 'max-h-[560px]'

// An order the front desk has to finish by hand. Kept as one predicate because both the sort and
// the row highlight must agree on what "needs attention" means.
const needsFrontDeskAttention = (order: OrderListItemApiDto) =>
  order.hasUnassignedService || order.hasNoServiceLine

// Flagged orders first, everything else untouched. The server already returns the list ordered by
// check-in time and Array.prototype.sort is stable, so within each group that order survives.
const sortByAttentionFirst = (orders: OrderListItemApiDto[]) =>
  [...orders].sort(
    (a, b) => Number(needsFrontDeskAttention(b)) - Number(needsFrontDeskAttention(a)),
  )

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

// Sub-pixel rounding makes scrollLeft land a fraction short of its true maximum, so an exact
// comparison would leave the "scroll right" arrow enabled forever at the end of the strip.
const TAB_SCROLL_EDGE_TOLERANCE_PX = 2
// One arrow tap moves just under a full strip width, keeping the last visible tab on screen
// as a visual anchor for where the user just came from.
const TAB_SCROLL_STEP_RATIO = 0.8

// The 7 Front Desk tabs are wider than a phone viewport, so the strip scrolls horizontally
// (see index.css `.nexora-no-scrollbar` — the app's styled scrollbar would otherwise sit on
// top of the active-tab underline). A silent scroll area reads as a cut-off list, so each
// edge gets an arrow. The arrow slots only exist while the strip actually overflows; within
// that, an arrow at its edge goes `invisible` rather than unmounting, so scrolling never
// shifts the tabs sideways.
function ScrollableTabStrip({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const stripRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const syncArrows = useCallback(() => {
    const strip = stripRef.current
    if (!strip) return
    const maxScrollLeft = strip.scrollWidth - strip.clientWidth
    setCanScrollLeft(strip.scrollLeft > TAB_SCROLL_EDGE_TOLERANCE_PX)
    setCanScrollRight(strip.scrollLeft < maxScrollLeft - TAB_SCROLL_EDGE_TOLERANCE_PX)
  }, [])

  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    syncArrows()
    // Observing the tabs themselves as well as the strip: a tab's own width changes when its
    // count badge does (e.g. "Order List (0)" → "Order List (12)"), which changes whether the
    // strip overflows without the strip itself ever being resized.
    const resizeObserver = new ResizeObserver(syncArrows)
    resizeObserver.observe(strip)
    for (const tab of Array.from(strip.children)) resizeObserver.observe(tab)
    return () => resizeObserver.disconnect()
  }, [syncArrows, children])

  const scrollByStep = (direction: -1 | 1) => {
    const strip = stripRef.current
    if (!strip) return
    strip.scrollBy({ left: direction * strip.clientWidth * TAB_SCROLL_STEP_RATIO, behavior: 'smooth' })
  }

  const isOverflowing = canScrollLeft || canScrollRight
  const arrowClass =
    'flex h-8 w-6 shrink-0 items-center justify-center self-stretch text-nexoraMuted hover:text-nexoraText'

  return (
    <div className="flex items-center border-b border-nexoraBorder">
      {isOverflowing && (
        <button
          type="button"
          aria-label={t(tk('scrollTabsLeft'))}
          onClick={() => scrollByStep(-1)}
          className={`${arrowClass} ${canScrollLeft ? '' : 'invisible'}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      <div ref={stripRef} onScroll={syncArrows} className="nexora-no-scrollbar flex flex-1 gap-1 overflow-x-auto">
        {children}
      </div>
      {isOverflowing && (
        <button
          type="button"
          aria-label={t(tk('scrollTabsRight'))}
          onClick={() => scrollByStep(1)}
          className={`${arrowClass} ${canScrollRight ? '' : 'invisible'}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
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
  const { t, currentLanguage } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const queryClient = useQueryClient()
  const { data: access, isLoading: isAccessLoading } = usePosAccess(businessId)
  const { data: orderList = [], isLoading: isOrderListLoading } = useOrderList(businessId)
  const { data: turnBoard = [], isLoading: isTurnBoardLoading } = useTurnBoard(businessId)
  const cancelOrder = useCancelOrder(businessId)
  const startOrderService = useStartOrderService(businessId)

  // Deep-link support for the Owner Dashboard's "Total Bookings" KPI card (Ticket 10),
  // which navigates here with ?tab=booking to land straight on the Bookings tab. Also
  // kept in sync on every tab switch (see setActiveTab below) so a reload restores
  // whichever tab was active instead of always falling back to Order List.
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get(POS_FRONT_DESK_TAB_PARAM) as PosFrontDeskTab | null
  const initialTab: PosFrontDeskTab =
    tabFromUrl && POS_FRONT_DESK_TABS.includes(tabFromUrl) ? tabFromUrl : DEFAULT_POS_FRONT_DESK_TAB
  const [activeTab, setActiveTabState] = useState<PosFrontDeskTab>(initialTab)
  const setActiveTab = (tab: PosFrontDeskTab) => {
    setActiveTabState(tab)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set(POS_FRONT_DESK_TAB_PARAM, tab)
        return next
      },
      { replace: true },
    )
  }
  const [orderListFilter, setOrderListFilter] = useState<OrderListFilter>(OrderListFilter.All)
  const [viewMode, setViewMode] = useState<OrderListViewMode>(() =>
    storage.getItem(ORDER_LIST_VIEW_MODE_STORAGE_KEY) === OrderListViewMode.Card
      ? OrderListViewMode.Card
      : OrderListViewMode.List,
  )
  const handleChangeViewMode = (mode: OrderListViewMode) => {
    setViewMode(mode)
    storage.setItem(ORDER_LIST_VIEW_MODE_STORAGE_KEY, mode)
  }
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
        {t(tk('noAccess'))}
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
    const confirmed = await showConfirm(t(tk('confirmCancelBody'), { name }), t(tk('confirmCancelTitle')))
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
      showToast(t(tk('startServiceSuccess')))
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  // Tab id doubles as its own i18n suffix (tabs.<id>) and as the ?tab= value, so the bar is
  // derived from POS_FRONT_DESK_TABS rather than re-listing all seven by hand.
  const tabBadges: Partial<Record<PosFrontDeskTab, number>> = {
    [PosFrontDeskTab.OrderList]: orderList.length,
  }

  const renderStationCard = (station: TurnBoardStationApiDto) => {
    return (
      <div
        key={station.posStaffProfileId}
        className="space-y-3 rounded-xl border border-nexoraBorder bg-nexoraSurface p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexoraLavender/20 text-[11px] font-bold text-nexoraBrandDark">
            {station.photoUrl ? (
              <img src={station.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              getInitials(station.displayName)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-nexoraText">{station.displayName}</p>
            <p className="text-[11px] font-extrabold uppercase text-nexoraMuted">
              {t(tk(`stationStatus.${station.currentStatus}`))}
            </p>
          </div>
        </div>

        {station.currentStatus === PosOrderStatus.InService && (
          <div className="space-y-2 rounded-lg bg-nexoraCanvas p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-bold text-nexoraText">{station.currentCustomerName}</p>
              {station.currentOrderNumber ? (
                <span className="shrink-0 font-mono text-[11px] font-bold text-nexoraMuted">
                  #{station.currentOrderNumber}
                </span>
              ) : null}
            </div>
            {station.currentServiceNames.length > 0 ? (
              <p className="truncate text-[11px] text-nexoraMuted">{station.currentServiceNames.join(', ')}</p>
            ) : null}
            {station.assignedAt ? (
              <p className="text-[11px] text-nexoraMuted">
                {t(tk('servingSince'), { time: formatPosTime(station.assignedAt, currentLanguage) })}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => station.currentOrderId && setUpdateWorkspace({ orderId: station.currentOrderId })}
              className="h-9 w-full rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
            >
              {t(tk('checkoutButton'))}
            </button>
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
      {!updateWorkspace && activeTab !== PosFrontDeskTab.CheckIn ? (
        <section className="flex items-start justify-between gap-3 px-0.5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold leading-tight text-nexoraText">
              {t('dashboard.menu.pos_board')}
            </h1>
            <p className="text-sm font-medium text-nexoraMuted">{t(tk('description'))}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="h-9 shrink-0 rounded-lg bg-nexoraBrand px-3 text-xs font-bold text-white hover:bg-nexoraBrandDark"
          >
            {t('components.dashboard.views.pos.NewBookingForm.newBookingButton')}
          </button>
        </section>
      ) : null}

      {/* Tab bar uses the shared nexora* color tokens — see tailwind.config.js. */}
      <ScrollableTabStrip>
        {POS_FRONT_DESK_TABS.map((tab) => (
          <button
            key={tab}
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
              setActiveTab(tab)
            }}
            className={`shrink-0 whitespace-nowrap px-3 py-2 text-xs font-bold ${
              !updateWorkspace && activeTab === tab
                ? 'border-b-2 border-nexoraBrand text-nexoraBrandDark'
                : 'text-nexoraMuted hover:text-nexoraText'
            }`}
          >
            {t(tk(`tabs.${tab}`))}
            {typeof tabBadges[tab] === 'number' ? ` (${tabBadges[tab]})` : ''}
          </button>
        ))}
      </ScrollableTabStrip>

      {updateWorkspace ? (
        <PosOrderWorkspace
          businessId={businessId}
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
          services draft survives switching to another tab and back — the check-in session
          resets itself only after a successful check-in, or via its own Cancel button.
          See top-of-file note. */}
      <div className={activeTab === PosFrontDeskTab.CheckIn ? '' : 'hidden'}>
        <PosCheckInTab
          businessId={businessId}
          businessName={businessName}
          onCheckedIn={refreshFrontDeskLists}
          onFinished={() => {
            // The old standalone Waitlist tab is gone (folded into Order List as a filter) — land
            // on Order List pre-filtered to Waiting so the just-created ticket is visible. Fires on
            // Done rather than on check-in itself: the operator reads the number off the thank-you
            // screen, so the screen stays until they are finished with it.
            setActiveTab(PosFrontDeskTab.OrderList)
            setOrderListFilter(OrderListFilter.Waiting)
            refreshFrontDeskLists()
          }}
        />
      </div>

      {activeTab === PosFrontDeskTab.OrderList && (
        isOrderListLoading ? (
          <div className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-6">
            <SkeletonList count={3} lines={1} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {ORDER_LIST_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setOrderListFilter(filter)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                      orderListFilter === filter
                        ? 'bg-nexoraBrand text-white'
                        : 'border border-nexoraBorder text-nexoraMuted hover:text-nexoraText'
                    }`}
                  >
                    {t(tk(`orderListFilter.${filter}`))}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 rounded-lg border border-nexoraBorder p-0.5">
                <button
                  type="button"
                  onClick={() => handleChangeViewMode(OrderListViewMode.List)}
                  aria-label={t(tk('viewModeList'))}
                  className={`rounded-md p-1.5 ${
                    viewMode === OrderListViewMode.List
                      ? 'bg-nexoraBrand text-white'
                      : 'text-nexoraMuted hover:text-white'
                  }`}
                >
                  <ListIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeViewMode(OrderListViewMode.Card)}
                  aria-label={t(tk('viewModeCard'))}
                  className={`rounded-md p-1.5 ${
                    viewMode === OrderListViewMode.Card
                      ? 'bg-nexoraBrand text-white'
                      : 'text-nexoraMuted hover:text-white'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            {(() => {
              const filteredOrderList = sortByAttentionFirst(
                orderList.filter((order) => {
                  if (orderListFilter === OrderListFilter.Waiting) return order.status === PosOrderStatus.Waiting
                  if (orderListFilter === OrderListFilter.InService) return order.status === PosOrderStatus.InService
                  return true
                }),
              )

              // Counted over the filtered list, not the whole queue: a badge saying "3 awaiting
              // technician" while the active filter hides all three would send staff looking for
              // rows that aren't on screen.
              const awaitingTechnicianCount = filteredOrderList.filter((o) => o.hasUnassignedService).length
              const noServiceCount = filteredOrderList.filter((o) => o.hasNoServiceLine).length

              const attentionBadges =
                awaitingTechnicianCount + noServiceCount > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {awaitingTechnicianCount > 0 ? (
                      <span className="rounded-full bg-nexoraWarning/15 px-3 py-1 text-[11px] font-bold text-nexoraWarning">
                        {t(tk('orderListAwaitingTechnicianBadge'), { count: awaitingTechnicianCount })}
                      </span>
                    ) : null}
                    {noServiceCount > 0 ? (
                      <span className="rounded-full bg-nexoraLavender/25 px-3 py-1 text-[11px] font-bold text-nexoraBrandDark">
                        {t(tk('orderListNoServiceBadge'), { count: noServiceCount })}
                      </span>
                    ) : null}
                  </div>
                ) : null

              // Same two labels the badges above count, repeated on the row itself — the count
              // tells staff how many, the row tells them which.
              const renderRowFlags = (order: OrderListItemApiDto) => (
                <>
                  {order.hasUnassignedService ? (
                    <span className="shrink-0 rounded-full bg-nexoraWarning/15 px-2 py-0.5 text-[10px] font-black uppercase text-nexoraWarning">
                      {t(tk('orderListAwaitingTechnicianFlag'))}
                    </span>
                  ) : null}
                  {order.hasNoServiceLine ? (
                    <span className="shrink-0 rounded-full bg-nexoraLavender/25 px-2 py-0.5 text-[10px] font-black uppercase text-nexoraBrandDark">
                      {t(tk('orderListNoServiceFlag'))}
                    </span>
                  ) : null}
                </>
              )

              if (filteredOrderList.length === 0) {
                return (
                  <div className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-6 text-center text-xs text-nexoraMuted">
                    {t(tk('orderListEmpty'))}
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
                    className="shrink-0 rounded-lg border border-nexoraBorder px-2.5 py-1 text-[10px] font-bold text-nexoraMuted hover:border-nexoraDanger hover:bg-red-50 hover:text-nexoraDanger disabled:opacity-60"
                  >
                    {t(tk('cancelButton'))}
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
                    className="shrink-0 rounded-lg border border-nexoraBrand bg-nexoraBrand px-2.5 py-1 text-[10px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                  >
                    {t(tk('startServiceButton'))}
                  </button>
                ) : null

              if (viewMode === OrderListViewMode.Card) {
                return (
                  <div className="space-y-3">
                  {attentionBadges}
                  <div
                    className={`grid ${SCROLL_PANEL_MAX_HEIGHT} grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3`}
                  >
                    {filteredOrderList.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => setUpdateWorkspace({ orderId: order.id })}
                        className={`cursor-pointer space-y-2 rounded-2xl border bg-nexoraSurface p-4 hover:border-nexoraBrand ${
                          needsFrontDeskAttention(order)
                            ? 'border-nexoraWarning bg-nexoraWarning/5'
                            : 'border-nexoraBorder'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold text-nexoraMuted">#{order.orderNumber}</span>
                          <span className="rounded-full bg-nexoraCanvas px-2 py-0.5 text-[10px] font-black uppercase text-nexoraBrandDark">
                            {order.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">{renderRowFlags(order)}</div>
                        <p className="truncate text-sm font-bold text-nexoraText">{order.customerName}</p>
                        <p className="truncate text-[11px] text-nexoraMuted">{joinOrEmpty(order.serviceNames)}</p>
                        <p className="truncate text-[11px] text-nexoraMuted">{joinOrEmpty(order.technicianNames)}</p>
                        <div className="flex items-center justify-between gap-2 border-t border-nexoraBorder pt-2">
                          <span className="text-[11px] text-nexoraMuted">
                            {t(tk('waitMinutes'), { minutes: order.elapsedMinutes })}
                          </span>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {renderStartServiceButton(order)}
                            {renderCancelButton(order)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                )
              }

              return (
                <div className="space-y-3">
                {attentionBadges}
                <div
                  className={`${SCROLL_PANEL_MAX_HEIGHT} overflow-y-auto rounded-xl border border-nexoraBorder bg-nexoraSurface p-4`}
                >
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                        <th className="text-xs font-black pb-2 pr-3">{t(tk('orderListColumnOrder'))}</th>
                        <th className="text-xs font-black pb-2 pr-3">{t(tk('orderListColumnGuest'))}</th>
                        <th className="text-xs font-black pb-2 pr-3">{t(tk('orderListColumnStatus'))}</th>
                        <th className="text-xs font-black pb-2 pr-3">{t(tk('orderListColumnTechnician'))}</th>
                        <th className="text-xs font-black pb-2 pr-3">{t(tk('orderListColumnServices'))}</th>
                        <th className="text-xs font-black pb-2 pr-3 text-right">{t(tk('orderListColumnElapsed'))}</th>
                        <th className="text-xs font-black pb-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrderList.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => setUpdateWorkspace({ orderId: order.id })}
                          className={`cursor-pointer border-t border-nexoraBorder hover:bg-nexoraCanvas ${
                            needsFrontDeskAttention(order) ? 'bg-nexoraWarning/5' : ''
                          }`}
                        >
                          <td className="py-2 pr-3 font-mono font-bold text-nexoraMuted">#{order.orderNumber}</td>
                          <td className="py-2 pr-3 font-bold text-nexoraText">{order.customerName}</td>
                          <td className="py-2 pr-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full bg-nexoraCanvas px-2 py-0.5 text-[10px] font-black uppercase text-nexoraBrandDark">
                                {order.status}
                              </span>
                              {renderRowFlags(order)}
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-nexoraMuted">{joinOrEmpty(order.technicianNames)}</td>
                          <td className="py-2 pr-3 text-nexoraMuted">{joinOrEmpty(order.serviceNames)}</td>
                          <td className="py-2 pr-3 text-right tabular-nums text-nexoraMuted">
                            {t(tk('waitMinutes'), { minutes: order.elapsedMinutes })}
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
                </div>
              )
            })()}
          </div>
        )
      )}

      {activeTab === PosFrontDeskTab.TurnBoard && (
        isTurnBoardLoading ? (
          <div className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-6">
            <SkeletonList count={3} lines={2} />
          </div>
        ) : turnBoard.length === 0 ? (
          <div className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-6 text-center text-xs text-nexoraMuted">
            {t(tk('turnBoardEmpty'))}
          </div>
        ) : (
          <div
            className={`grid ${SCROLL_PANEL_MAX_HEIGHT} grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3`}
          >
            {turnBoard.map(renderStationCard)}
          </div>
        )
      )}

      {activeTab === PosFrontDeskTab.Completed && <PosCompletedOrdersPanel businessId={businessId} />}

      {activeTab === PosFrontDeskTab.Booking && (
        <BookingTab businessId={businessId} businessSlug={businessSlug} turnBoardStaff={turnBoard} />
      )}

      {activeTab === PosFrontDeskTab.TimeClock && <TimeClockTab businessId={businessId} />}

      {activeTab === PosFrontDeskTab.Customer && <CustomerTab businessId={businessId} />}
        </>
      )}

      <NewBookingForm
        open={isBookingModalOpen}
        businessId={businessId}
        onClose={() => setIsBookingModalOpen(false)}
        onCreated={() => {
          setIsBookingModalOpen(false)
          refreshFrontDeskLists()
          // Land on the Bookings tab so the staff sees the booking they just created.
          setActiveTab(PosFrontDeskTab.Booking)
        }}
      />
    </div>
  )
}
