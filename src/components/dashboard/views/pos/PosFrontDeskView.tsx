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
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  DollarSign,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  PencilLine,
  Play,
  X,
} from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { storage } from '../../../../utils/storage'
import { getApiErrorCode } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { qk } from '../../../../data/queryKeys'
import { usePosAccess } from '../../../../data/hooks/usePosAccess'
import { useStaffBusinesses } from '../../../../data/hooks/useStaffSelf'
import { useWeeklyPayroll } from '../../../../data/hooks/useWeeklyPayroll'
import { formatPosTime } from './posDateTime'
import { useCancelOrder, useCompletedOrders, useOrderList, useStartOrderService } from '../../../../data/hooks/usePosOrders'
import { useInServiceOrders, useOrderDetails } from '../../../../data/hooks/usePosCheckout'
import { useBookingList, useCheckInBookingFromList } from '../../../../data/hooks/usePosBooking'
import { useTurnBoard } from '../../../../data/hooks/usePosTurnBoard'
import { useBeepStaff, useTimeClockRoster } from '../../../../data/hooks/usePosTimeClock'
import { formatDatePart, formatLocalDateIso } from '../../../../utils/localDate'
import { PosOrderStatus } from '../../../../constants/posOrderStatus'
import {
  DEFAULT_POS_FRONT_DESK_TAB,
  ORDER_LIST_FILTERS,
  ORDER_LIST_VIEW_MODE_STORAGE_KEY,
  OrderListFilter,
  OrderListViewMode,
  POS_FRONT_DESK_TAB_PARAM,
  REPORT_DATES_PARAM,
  REPORT_MODE_PARAM,
  REPORT_MONTH_PARAM,
  REPORT_WEEKS_PARAM,
  POS_FRONT_DESK_TABS,
  PosFrontDeskTab,
} from '../../../../constants/posFrontDesk'
import type { BookingListItemApiDto, OrderListItemApiDto, TurnBoardStationApiDto } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import { getInitials, joinOrEmpty } from './posDisplay'
import PosOrderWorkspace from './PosOrderWorkspace'
import {
  readPosWorkspaceFromParams,
  writePosWorkspaceToParams,
  type PosWorkspaceUrlState,
} from './posWorkspaceUrl'
import { PosReportMode } from '../../../../constants/posReportMode'
import PosReportPanel from './report/PosReportPanel'
import {
  defaultSelectionFor as defaultReportSelection,
  isSelectionComplete as isReportSelectionComplete,
  parseIsoWeekKey,
  parseMonthKey,
  type PosReportSelection,
} from './report/posReportPeriod'
import PosCheckInTab from './PosCheckInTab'
import PosCompletedOrdersPanel from './PosCompletedOrdersPanel'
import NewBookingForm from './booking/NewBookingForm'
import BookingTab from './booking/BookingTab'
import { formatBookingWallClockTime, resolveBookingWallClockParts } from './booking/bookingFormatters'
import CustomerTab from './customer/CustomerTab'
import { formatCustomerPhone } from './customer/customerFormatters'
import TimeClockTab from './timeclock/TimeClockTab'
import BeepMessageModal from './timeclock/BeepMessageModal'
import { getLocalDayWindow } from './timeclock/timeClockDay'
import { formatCurrency } from '../../utils'
import {
  POS_TABLE_HEADER_CELL_CLASS,
  POS_TABLE_HEADER_ROW_CLASS,
  POS_TABLE_STICKY_ACTION_CELL_CLASS,
  POS_TABLE_STICKY_ACTION_HEADER_CLASS,
} from './posTableStyles'

// Every string this screen passes to t() lives under one namespace — building them through tk()
// keeps the prefix in a single place instead of repeating it two dozen times inline.
const I18N_PREFIX = 'components.dashboard.views.pos.PosFrontDeskView'
const tk = (suffix: string) => `${I18N_PREFIX}.${suffix}`

// Keep long queues inside the currently available viewport, rather than using a fixed pixel cap.
// The reserved space accounts for the dashboard header, Front Desk title/tabs, and list controls.
const SCROLL_PANEL_MAX_HEIGHT = 'max-h-[calc(100dvh-18rem)]'
const ORDER_LIST_FILL_MAIN_HEIGHT = 'min-h-0 flex-1'

// One salon's appointments for one day never approach this; it exists so the chip's count is the
// real total rather than a first page.
const TODAY_BOOKING_PAGE_SIZE = 200

const renderServiceChips = (serviceNames: string[]) =>
  serviceNames.length > 0 ? (
    <div className="flex flex-wrap gap-1.5">
      {serviceNames.map((service, index) => (
        <span
          key={`${service}-${index}`}
          className="inline-flex max-w-full items-center rounded-full border border-nexoraBrand/15 bg-white px-2 py-1 text-[11px] font-bold text-nexoraText"
        >
          <span className="truncate">{service}</span>
        </span>
      ))}
    </div>
  ) : (
    <span className="text-[11px] text-nexoraMuted">—</span>
  )

const renderTechnicianChip = (technicianNames: string[]) => (
  <span className="inline-flex max-w-full rounded-full bg-cyan-100/70 px-2.5 py-1 text-[11px] font-extrabold text-cyan-800">
    <span className="truncate">{joinOrEmpty(technicianNames)}</span>
  </span>
)

function formatReportDate(isoDate: string, language: string) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return isoDate
  return formatDatePart(date, language.toLowerCase().startsWith('vi'), { timeZone: 'UTC' })
}

// scheduledAt means different things depending on which flow created the booking, so the sort
// runs on the resolved wall clock rather than the raw ISO string. Minutes-of-day is enough: the
// list only ever holds one day.
const bookingMinuteOfDay = (booking: BookingListItemApiDto) => {
  const { hours, minutes } = resolveBookingWallClockParts(booking.scheduledAt, booking.source)
  return hours * 60 + minutes
}

// A booking that has not become a ticket yet. Cancelled/Completed and anything already checked in
// are excluded by status, which is what makes this list "still expected today".
const isAwaitingArrival = (booking: BookingListItemApiDto) =>
  booking.status === PosOrderStatus.Pending || booking.status === PosOrderStatus.Confirmed

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
  
// Mirror the subtle status-tinted rows in AI Hub's Appointments Overview: enough color to scan
// the queue quickly without competing with the order content or action buttons.
function orderListStatusSurfaceClass(status: string) {
  if (status === PosOrderStatus.Waiting) return 'bg-amber-50/40 hover:bg-amber-50/70'
  if (status === PosOrderStatus.InService) return 'bg-cyan-50/40 hover:bg-cyan-50/70'
  return 'bg-nexoraSurface hover:bg-violet-50/35'
}

function orderListStatusBadgeClass(status: string) {
  if (status === PosOrderStatus.Waiting) return 'border-amber-200 bg-amber-100 text-amber-700'
  if (status === PosOrderStatus.InService) return 'border-cyan-200 bg-cyan-100 text-cyan-700'
  return 'border-nexoraBorder bg-nexoraCanvas text-nexoraBrandDark'
}

// Not-arrived guests are bookings, not tickets, so their badge in a mixed list uses the neutral
// fallback of the helper above rather than a Waiting/InService tint — nothing has started yet.
const NOT_ARRIVED_BADGE_CLASS = 'border-sky-200 bg-sky-50 text-sky-700'

const ORDER_LIST_FILTER_STYLES: Record<OrderListFilter, { active: string; inactive: string }> = {
  [OrderListFilter.All]: {
    active: 'border-nexoraBrand bg-nexoraBrand text-white shadow-sm',
    inactive: 'border-violet-200 bg-violet-50/60 text-violet-700 hover:bg-violet-100/70',
  },
  [OrderListFilter.NotArrived]: {
    active: 'border-sky-600 bg-sky-600 text-white shadow-sm',
    inactive: 'border-sky-200 bg-sky-50/60 text-sky-700 hover:bg-sky-100/70',
  },
  [OrderListFilter.Waiting]: {
    active: 'border-amber-600 bg-amber-600 text-white shadow-sm',
    inactive: 'border-amber-200 bg-amber-50/60 text-amber-700 hover:bg-amber-100/70',
  },
  [OrderListFilter.InService]: {
    active: 'border-cyan-600 bg-cyan-600 text-white shadow-sm',
    inactive: 'border-cyan-200 bg-cyan-50/60 text-cyan-700 hover:bg-cyan-100/70',
  },
}

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
type UpdateWorkspaceState = PosWorkspaceUrlState

// Sub-pixel rounding makes scrollLeft land a fraction short of its true maximum, so an exact
// comparison would leave the "scroll right" arrow enabled forever at the end of the strip.
const TAB_SCROLL_EDGE_TOLERANCE_PX = 2
// One arrow tap moves just under a full strip width, keeping the last visible tab on screen
// as a visual anchor for where the user just came from.
const TAB_SCROLL_STEP_RATIO = 0.8

// A hand-edited or stale link must never crash the tab: anything unparseable falls back to that
// mode's default period (today / this week / this month).
function readReportSelectionFromParams(params: URLSearchParams): PosReportSelection {
  const rawMode = params.get(REPORT_MODE_PARAM)
  const mode = Object.values(PosReportMode).includes(rawMode as PosReportMode)
    ? (rawMode as PosReportMode)
    : PosReportMode.Daily
  const fallback = defaultReportSelection(mode)

  if (mode === PosReportMode.Daily) {
    const dates = (params.get(REPORT_DATES_PARAM) ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    return dates.length > 0 ? { ...fallback, dates } : fallback
  }

  if (mode === PosReportMode.Weekly) {
    const weeks = (params.get(REPORT_WEEKS_PARAM) ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => parseIsoWeekKey(value) !== null)
    return weeks.length > 0 ? { ...fallback, weeks } : fallback
  }

  const month = (params.get(REPORT_MONTH_PARAM) ?? '').trim()
  return parseMonthKey(month) ? { ...fallback, month } : fallback
}

// The Front Desk tabs are wider than a phone viewport, so the strip scrolls horizontally
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

  const arrowClass =
    'flex h-9 w-8 shrink-0 items-center justify-center self-stretch rounded-lg text-nexoraMuted transition-colors hover:bg-nexoraCanvas hover:text-nexoraText disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-nexoraMuted'

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={t(tk('scrollTabsLeft'))}
        onClick={() => scrollByStep(-1)}
        disabled={!canScrollLeft}
        className={arrowClass}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div ref={stripRef} onScroll={syncArrows} className="nexora-no-scrollbar flex flex-1 gap-1 overflow-x-auto py-2">
        {children}
      </div>
      <button
        type="button"
        aria-label={t(tk('scrollTabsRight'))}
        onClick={() => scrollByStep(1)}
        disabled={!canScrollRight}
        className={arrowClass}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function PosFrontDeskView({
  businessId,
  businessName,
  businessAddress,
  businessPhone,
  businessSlug,
}: {
  businessId: string
  // Shown on Check-in Step 1's welcome message — optional since the Staff dashboard route
  // doesn't have it readily available; PhoneCheckInStep falls back to a generic greeting.
  businessName?: string
  businessAddress?: string
  businessPhone?: string
  businessSlug?: string
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const queryClient = useQueryClient()
  const { data: access, isLoading: isAccessLoading } = usePosAccess(businessId)
  const { data: staffBusinesses = [] } = useStaffBusinesses()
  const cancelOrder = useCancelOrder(businessId)
  const startOrderService = useStartOrderService(businessId)
  const beepStaff = useBeepStaff(businessId)
  const linkedStaffBusiness = staffBusinesses.find((business) => business.businessId === businessId)
  const receiptBusinessName = businessName || linkedStaffBusiness?.businessName || undefined
  const receiptBusinessAddress =
    businessAddress ||
    [linkedStaffBusiness?.address, linkedStaffBusiness?.city, linkedStaffBusiness?.state]
      .filter(Boolean)
      .join(', ') ||
    undefined

  // Deep-link support for the Owner Dashboard's "Total Bookings" KPI card (Ticket 10),
  // which navigates here with ?tab=booking to land straight on the Bookings tab. Also
  // kept in sync on every tab switch (see setActiveTab below) so a reload restores
  // whichever tab was active instead of always falling back to Order List.
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get(POS_FRONT_DESK_TAB_PARAM) as PosFrontDeskTab | null
  const initialTab: PosFrontDeskTab =
    tabFromUrl && POS_FRONT_DESK_TABS.includes(tabFromUrl) ? tabFromUrl : DEFAULT_POS_FRONT_DESK_TAB
  const [activeTab, setActiveTabState] = useState<PosFrontDeskTab>(initialTab)
  const previousActiveTabRef = useRef<PosFrontDeskTab | null>(null)
  // Each Front Desk data set is loaded only while its tab is open. Leaving a tab disables its
  // observer; returning to it or reloading triggers a fresh request instead of background polls.
  // The ticket queue is the exception: its count is on the always-visible tab badge and the
  // Checkout Customer cards read phone numbers out of it, so gating it on the Tickets tab made a
  // reload on any other tab render "Tickets (0)". It loads on every tab; the effect below still
  // refetches it on each visit to the Tickets tab, so there are no background polls either.
  const orderListQuery = useOrderList(businessId, { refetchInterval: false })
  const orderList = orderListQuery.data ?? []
  const isOrderListLoading = orderListQuery.isLoading
  // Today's appointments, for the Not Arrived chip and for the ticket counts, which include
  // guests who have not arrived yet. Loaded on every tab for the same reason as the queue above.
  // The filters here are deliberately narrower than any the Bookings tab can produce, so its own
  // copy of this query keeps a separate cache entry instead of fighting over this one.
  const todayIso = useMemo(() => formatLocalDateIso(new Date()), [])
  const todayBookingsQuery = useBookingList(businessId, {
    dateFrom: todayIso,
    dateTo: todayIso,
    pageSize: TODAY_BOOKING_PAGE_SIZE,
  })
  const todayBookings = todayBookingsQuery.data
  const isTodayBookingsPending = todayBookingsQuery.isPending
  const notArrivedBookings = useMemo(
    () =>
      (todayBookings?.items ?? [])
        .filter(isAwaitingArrival)
        .sort((a, b) => bookingMinuteOfDay(a) - bookingMinuteOfDay(b)),
    [todayBookings],
  )
  const { data: inServiceOrders = [], isLoading: isInServiceOrdersLoading } = useInServiceOrders(businessId, {
    enabled: activeTab === PosFrontDeskTab.CheckoutCustomer,
    refetchInterval: false,
  })
  const turnBoardQuery = useTurnBoard(businessId, {
    enabled: activeTab === PosFrontDeskTab.TurnBoard || activeTab === PosFrontDeskTab.Booking,
    refetchInterval: 15000,
  })
  const turnBoard = turnBoardQuery.data ?? []
  const isTurnBoardLoading = turnBoardQuery.isLoading
  // The Turn Board's summary uses the same local-day roster as Staffs Clock, but fetches once
  // per tab visit rather than maintaining a second 15s polling stream.
  const todayTurnWindow = getLocalDayWindow()
  const todayRosterQuery = useTimeClockRoster(businessId, todayTurnWindow, {
    enabled:
      activeTab === PosFrontDeskTab.TurnBoard
      || activeTab === PosFrontDeskTab.Booking,
    refetchInterval: false,
  })
  // Today’s Turns needs the services completed during the same local calendar day. The
  // completed-orders endpoint supplies the ticket IDs; each detail response supplies the
  // technician assigned to each individual service line.
  const todayCompletedOrdersQuery = useCompletedOrders(
    businessId,
    {
      dateFrom: todayTurnWindow.dayKey,
      dateTo: todayTurnWindow.dayKey,
      pageNumber: 1,
      pageSize: 200,
    },
    {
      enabled: activeTab === PosFrontDeskTab.TurnBoard,
      refetchInterval: false,
    },
  )
  const todayCompletedOrderItems = todayCompletedOrdersQuery.data?.items ?? []
  // A ticket with one technician is already unambiguous from the list response. Only fetch
  // details for multi-technician tickets, where the list's aggregated arrays cannot identify
  // which service line belongs to which technician.
  const todayMultiTechnicianOrderIds = useMemo(
    () =>
      todayCompletedOrderItems
        .filter(
          (order) =>
            new Set(
              order.technicianNames.map((name) => name.trim().toLocaleLowerCase()).filter(Boolean),
            ).size > 1,
        )
        .map((order) => order.id),
    [todayCompletedOrderItems],
  )
  const todayCompletedOrderDetails = useOrderDetails(businessId, todayMultiTechnicianOrderIds, {
    enabled: activeTab === PosFrontDeskTab.TurnBoard,
  })
  // The tab stays mounted while the user moves around Front Desk, so explicitly refresh all
  // Turn Board sources on each visit. Query observers may remain enabled (e.g. Booking also uses
  // the station board), therefore relying on enable/disable alone would serve stale data.
  useEffect(() => {
    if (isAccessLoading || !access) return
    const previousTab = previousActiveTabRef.current
    previousActiveTabRef.current = activeTab
    if (activeTab === previousTab) return

    if (activeTab === PosFrontDeskTab.OrderList) {
      // First activation is each query's own mount fetch — only a return visit needs a refetch.
      if (previousTab === null) return
      if (!orderListQuery.isFetching) void orderListQuery.refetch()
      if (!todayBookingsQuery.isFetching) void todayBookingsQuery.refetch()
      return
    }
    if (activeTab !== PosFrontDeskTab.TurnBoard) return

    if (!turnBoardQuery.isFetching) void turnBoardQuery.refetch()
    if (!todayRosterQuery.isFetching) void todayRosterQuery.refetch()
    if (!todayCompletedOrdersQuery.isFetching) void todayCompletedOrdersQuery.refetch()
  }, [
    activeTab,
    access,
    isAccessLoading,
    orderListQuery,
    todayBookingsQuery,
    todayCompletedOrdersQuery,
    todayRosterQuery,
    turnBoardQuery,
  ])
  // Report period lives in the URL so a manager can deep-link "these three days" and survive F5,
  // same convention as the ?tab= param above.
  const [reportSelection, setReportSelectionState] = useState<PosReportSelection>(
    () => readReportSelectionFromParams(searchParams),
  )
  const setReportSelection = (next: PosReportSelection) => {
    setReportSelectionState(next)
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        params.set(POS_FRONT_DESK_TAB_PARAM, PosFrontDeskTab.Report)
        params.set(REPORT_MODE_PARAM, next.mode)
        params.delete(REPORT_DATES_PARAM)
        params.delete(REPORT_WEEKS_PARAM)
        params.delete(REPORT_MONTH_PARAM)
        if (next.mode === PosReportMode.Daily && next.dates.length > 0) {
          params.set(REPORT_DATES_PARAM, [...next.dates].sort().join(','))
        }
        if (next.mode === PosReportMode.Weekly && next.weeks.length > 0) {
          params.set(REPORT_WEEKS_PARAM, [...next.weeks].sort().join(','))
        }
        if (next.mode === PosReportMode.Monthly && next.month) {
          params.set(REPORT_MONTH_PARAM, next.month)
        }
        return params
      },
      { replace: true },
    )
  }
  const setActiveTab = (tab: PosFrontDeskTab) => {
    setActiveTabState(tab)
    setSearchParams(
      (prev) => {
        const next = writePosWorkspaceToParams(prev, null)
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
  const [updateWorkspace, setUpdateWorkspaceState] = useState<UpdateWorkspaceState | null>(
    () => readPosWorkspaceFromParams(searchParams),
  )
  const setUpdateWorkspace = useCallback((workspace: UpdateWorkspaceState | null, nextTab?: PosFrontDeskTab) => {
    setUpdateWorkspaceState(workspace)
    if (nextTab) setActiveTabState(nextTab)
    setSearchParams(
      (previous) => writePosWorkspaceToParams(previous, workspace, nextTab),
      { replace: true },
    )
  }, [setSearchParams])

  useEffect(() => {
    const workspaceFromUrl = readPosWorkspaceFromParams(searchParams)
    setUpdateWorkspaceState((current) => {
      if (current?.orderId === workspaceFromUrl?.orderId && current?.mode === workspaceFromUrl?.mode) {
        return current
      }
      return workspaceFromUrl
    })
  }, [searchParams])
  // Beep goes through the same message modal as the Time Clock roster — front desk picks or types
  // what the tech should see before anything is sent, instead of firing a message-less beep on tap.
  const [beepStation, setBeepStation] = useState<TurnBoardStationApiDto | null>(null)
  const [beepMessage, setBeepMessage] = useState('')
  // Entry point for creating a booking (Ticket 3) — kept as the one global "+ New Booking"
  // action; Ticket 9 added the "Bookings" tab/management screen below for viewing, checking
  // in, cancelling, and rescheduling existing bookings.
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [bookingSlot, setBookingSlot] = useState<{
    date: string
    time: string
    staffName?: string | null
    posStaffProfileId?: string | null
  } | null>(null)

  const checkInBooking = useCheckInBookingFromList(businessId)

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
    queryClient.invalidateQueries({ queryKey: qk.merchantPosTimeClockRoster(businessId) })
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

  // One tap converts the appointment into a ticket with the lines it was booked with, the same
  // call the Bookings tab makes. An operator who needs to change those lines checks the guest in
  // from the Check-in tab instead, which finds the same appointment by phone.
  const handleCheckInBooking = async (bookingId: string) => {
    try {
      await checkInBooking.mutateAsync(bookingId)
      showToast(t(tk('notArrivedCheckInSuccess')))
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  // Tab id doubles as its own i18n suffix (tabs.<id>) and as the ?tab= value, so the bar is
  // derived from POS_FRONT_DESK_TABS rather than re-listing all seven by hand.
  // All counts every guest on the books today, tickets plus the appointments that have not
  // arrived yet, so the number reads as the floor's whole workload — and its list shows them all
  // too (see notArrivedRows below).
  const orderListFilterCounts: Record<OrderListFilter, number> = {
    [OrderListFilter.All]: orderList.length + notArrivedBookings.length,
    [OrderListFilter.NotArrived]: notArrivedBookings.length,
    [OrderListFilter.Waiting]: orderList.filter((o) => o.status === PosOrderStatus.Waiting).length,
    [OrderListFilter.InService]: orderList.filter((o) => o.status === PosOrderStatus.InService).length,
  }

  // Report exposes every technician's earnings and is gated on its own permission, so a front-desk
  // account without it never sees the tab. access is undefined while loading — keep the tab hidden
  // until the answer arrives rather than flashing it and then removing it.
  const visibleTabs = POS_FRONT_DESK_TABS.filter(
    (tab) => tab !== PosFrontDeskTab.Report || access?.canViewReport === true,
  )

  const tabBadges: Partial<Record<PosFrontDeskTab, number>> = {
    [PosFrontDeskTab.OrderList]: orderListFilterCounts[OrderListFilter.All],
  }

  // Shared by the Not Arrived chip and by All, which lists these guests after its tickets. They
  // are not tickets: there is no number to read out, nothing has started, and the row is not
  // tappable — there is nothing to open until Check In is pressed.
  const renderNotArrivedCheckInButton = (booking: BookingListItemApiDto) => (
    <button
      type="button"
      onClick={() => handleCheckInBooking(booking.bookingId)}
      disabled={checkInBooking.isPending}
      className="h-9 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-extrabold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60"
    >
      {t(tk('notArrivedCheckInAction'))}
    </button>
  )

  const notArrivedLabel = t(tk(`orderListFilter.${OrderListFilter.NotArrived}`))

  // The badge only earns its place where ticket cards sit next to these — under the Not Arrived
  // chip every card would repeat the chip's own label.
  const renderNotArrivedCard = (booking: BookingListItemApiDto, withStatusBadge = false) => (
    <div
      key={booking.bookingId}
      className="space-y-2 rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-nexoraBrand/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tabular-nums text-nexoraText">
          {formatBookingWallClockTime(booking.scheduledAt, booking.source)}
        </span>
        {withStatusBadge ? (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${NOT_ARRIVED_BADGE_CLASS}`}>
            {notArrivedLabel}
          </span>
        ) : null}
      </div>
      <p className="truncate text-sm font-bold text-nexoraText">{booking.customerName}</p>
      {renderServiceChips(booking.serviceNames)}
      <div>{renderTechnicianChip(booking.technicianNames)}</div>
      <div className="flex justify-end border-t border-nexoraBorder pt-2">
        {renderNotArrivedCheckInButton(booking)}
      </div>
    </div>
  )

  // The ticket table's eight columns, filled in for a booking: no ticket number, no elapsed time,
  // and the "checked in at" slot carries the time the guest is due instead.
  const renderNotArrivedOrderRow = (booking: BookingListItemApiDto) => (
    <tr key={booking.bookingId} className="border-t border-nexoraBorder/70 bg-sky-50/20 transition-colors hover:bg-sky-50/45">
      <td className="px-4 py-3 font-mono font-bold text-nexoraMuted">—</td>
      <td className="px-4 py-3 font-bold text-nexoraText">{booking.customerName}</td>
      <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-nexoraText">
        {formatBookingWallClockTime(booking.scheduledAt, booking.source)}
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${NOT_ARRIVED_BADGE_CLASS}`}>
          {notArrivedLabel}
        </span>
      </td>
      <td className="px-4 py-3">{renderTechnicianChip(booking.technicianNames)}</td>
      <td className="px-4 py-3">{renderServiceChips(booking.serviceNames)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-nexoraMuted">—</td>
      <td className={`${POS_TABLE_STICKY_ACTION_CELL_CLASS} px-4 py-3 text-right`}>
        <div className="inline-flex w-max justify-end">{renderNotArrivedCheckInButton(booking)}</div>
      </td>
    </tr>
  )

  // The Not Arrived chip's own list, where every row is a booking: fewer columns, since a ticket
  // number, a status and an elapsed time would all be blank.
  const renderNotArrivedList = () => {
    if (isTodayBookingsPending) {
      return (
        <div className="py-6">
          <SkeletonList count={3} lines={1} />
        </div>
      )
    }

    if (notArrivedBookings.length === 0) {
      return (
        <div className="py-8 text-center text-xs text-nexoraMuted">
          {t(tk('notArrivedEmpty'))}
        </div>
      )
    }

    if (viewMode === OrderListViewMode.Card) {
      return (
        <div
          className={`grid ${ORDER_LIST_FILL_MAIN_HEIGHT} content-start grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3`}
        >
          {notArrivedBookings.map((booking) => renderNotArrivedCard(booking))}
        </div>
      )
    }

    return (
      <div
        className={`${ORDER_LIST_FILL_MAIN_HEIGHT} overflow-auto rounded-xl border border-nexoraBorder bg-white`}
      >
        <table className="w-full min-w-[720px] table-auto text-left text-xs">
          <thead className="sticky top-0 z-[1] bg-nexoraCanvas/90">
            <tr className={POS_TABLE_HEADER_ROW_CLASS}>
              <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(tk('orderListColumnTime'))}</th>
              <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(tk('orderListColumnCustomer'))}</th>
              <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(tk('orderListColumnTechnician'))}</th>
              <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(tk('orderListColumnServices'))}</th>
              <th className={`${POS_TABLE_HEADER_CELL_CLASS} ${POS_TABLE_STICKY_ACTION_HEADER_CLASS} text-right`}></th>
            </tr>
          </thead>
          <tbody>
            {notArrivedBookings.map((booking) => (
              <tr key={booking.bookingId} className="border-t border-nexoraBorder/70 bg-sky-50/20 transition-colors hover:bg-sky-50/45">
                <td className="px-4 py-3 font-semibold tabular-nums text-nexoraText">
                  {formatBookingWallClockTime(booking.scheduledAt, booking.source)}
                </td>
                <td className="px-4 py-3 font-bold text-nexoraText">{booking.customerName}</td>
                <td className="px-4 py-3">{renderTechnicianChip(booking.technicianNames)}</td>
                <td className="px-4 py-3">{renderServiceChips(booking.serviceNames)}</td>
                <td className={`${POS_TABLE_STICKY_ACTION_CELL_CLASS} px-4 py-3 text-right`}>
                  <div className="inline-flex w-max justify-end">{renderNotArrivedCheckInButton(booking)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const openBeepModal = (station: TurnBoardStationApiDto) => {
    setBeepStation(station)
    setBeepMessage('')
  }

  const closeBeepModal = () => {
    setBeepStation(null)
    setBeepMessage('')
  }

  const handleSendBeep = async () => {
    if (!beepStation || beepStaff.isPending) return
    const station = beepStation
    try {
      const result = await beepStaff.mutateAsync({
        posStaffProfileId: station.posStaffProfileId,
        message: beepMessage.trim() || undefined,
      })
      closeBeepModal()
      showToast(
        result.delivered
          ? t(tk('beepSent'), { name: station.displayName })
          : t(tk('beepNotDelivered'), { name: station.displayName }),
        result.delivered ? 'success' : 'error',
      )
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  const renderStationCard = (station: TurnBoardStationApiDto) => {
    const isBeeping = beepStaff.isPending && beepStation?.posStaffProfileId === station.posStaffProfileId
    return (
      <div
        key={station.posStaffProfileId}
        data-testid={`turn-board-station-${station.posStaffProfileId}`}
        className="space-y-3 rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-nexoraBrand/40 hover:shadow-md"
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
            <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${
              station.currentStatus === PosOrderStatus.InService
                ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
              {t(tk(`stationStatus.${station.currentStatus}`))}
            </span>
          </div>
          <button
            type="button"
            onClick={() => openBeepModal(station)}
            disabled={beepStaff.isPending}
            aria-label={t(tk('beepAria'), { name: station.displayName })}
            className="flex h-9 shrink-0 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-extrabold text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
          >
            {isBeeping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
            {isBeeping ? t(tk('beepPending')) : t(tk('beep'))}
          </button>
        </div>

        {station.currentStatus === PosOrderStatus.InService && (
          <div className="space-y-2 rounded-xl bg-nexoraCanvas/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-bold text-nexoraText">{station.currentCustomerName}</p>
              {station.currentOrderNumber ? (
                <span className="shrink-0 font-mono text-[11px] font-bold text-nexoraMuted">
                  #{station.currentOrderNumber}
                </span>
              ) : null}
            </div>
            {station.currentServiceNames.length > 0 ? (
              <p className="truncate text-[11px] font-semibold text-nexoraText">{station.currentServiceNames.join(', ')}</p>
            ) : null}
            {station.currentCustomerPhone ? (
              <p className="truncate text-[11px] tabular-nums text-nexoraMuted">{station.currentCustomerPhone}</p>
            ) : null}
            {station.assignedAt ? (
              <p className="text-[11px] font-semibold text-nexoraText">
                {t(tk('servingSince'), { time: formatPosTime(station.assignedAt, currentLanguage) })}
              </p>
            ) : null}
          </div>
        )}
      </div>
    )
  }

  const renderCheckoutCustomerPanel = () => {
    if (isInServiceOrdersLoading) {
      return (
        <div className="py-6">
          <SkeletonList count={3} lines={2} />
        </div>
      )
    }

    if (inServiceOrders.length === 0) {
      return (
        <div className="py-10 text-center">
          <p className="text-sm font-bold text-nexoraText">{t(tk('checkoutCustomerEmpty'))}</p>
          <p className="mt-1 text-xs text-nexoraMuted">{t(tk('checkoutCustomerEmptyHint'))}</p>
        </div>
      )
    }

    return (
      <section className="space-y-3" aria-label={t(tk('checkoutCustomerTitle'))}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-nexoraText">{t(tk('checkoutCustomerTitle'))}</h2>
            <p className="mt-0.5 text-xs text-nexoraMuted">{t(tk('checkoutCustomerHint'))}</p>
          </div>
          <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-700">
            {t(tk('checkoutCustomerCount'), { count: inServiceOrders.length })}
          </span>
        </div>

        <div className={`grid ${SCROLL_PANEL_MAX_HEIGHT} grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3`}>
          {inServiceOrders.map((order) => {
            const orderSummary = orderList.find((item) => item.id === order.id)
            const customerPhone = orderSummary?.customerPhone || orderSummary?.customerPhoneE164
              ? formatCustomerPhone(orderSummary.customerPhone, orderSummary.customerPhoneE164)
              : null

            return (
              <article
                key={order.id}
                data-testid={`checkout-customer-${order.id}`}
                className="flex flex-col gap-3 rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-nexoraText">{order.customerName}</p>
                    {customerPhone ? <p className="mt-0.5 text-xs tabular-nums text-nexoraMuted">{customerPhone}</p> : null}
                    <p className="mt-1 font-mono text-[11px] font-bold text-nexoraMuted">#{order.orderNumber}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-cyan-100 px-2 py-1 text-[10px] font-black uppercase text-cyan-700">
                    {t(tk('checkoutCustomerStatus'))}
                  </span>
                </div>

                <div className="space-y-2 rounded-xl bg-nexoraCanvas/70 p-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                      {t(tk('checkoutCustomerColumnServices'))}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-nexoraText">{joinOrEmpty(order.serviceNames)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                      {t(tk('checkoutCustomerColumnTechnician'))}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-nexoraText">{joinOrEmpty(order.technicianNames)}</p>
                  </div>
                  {order.firstAssignedAt ? (
                    <p className="text-[11px] font-semibold tabular-nums text-nexoraText">
                      {t(tk('servingSince'), { time: formatPosTime(order.firstAssignedAt, currentLanguage) })}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setUpdateWorkspace({ orderId: order.id, mode: 'checkout' })}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50/40 px-3 text-[11px] font-bold text-violet-700 hover:bg-violet-50"
                >
                  <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />
                  {t(tk('checkoutButton'))}
                </button>
              </article>
            )
          })}
        </div>
      </section>
    )
  }

  const renderReportPanel = () => {
    const payroll = weeklyPayrollQuery.data
    const rows = payroll?.staff ?? []

    if (weeklyPayrollQuery.isPending && weeklyPayrollQuery.fetchStatus !== 'idle') {
      return (
        <div className="py-6">
          <SkeletonList count={3} lines={2} />
        </div>
      )
    }

    if (weeklyPayrollQuery.isError) {
      return (
        <div className="py-10 text-center text-xs text-nexoraMuted">
          {t(tk('reportError'))}
        </div>
      )
    }

    return (
      <section className="space-y-3" aria-label={t(tk('reportTitle'))} data-testid="report-panel">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-nexoraText">{t(tk('reportTitle'))}</h2>
            <p className="mt-0.5 text-xs text-nexoraMuted">{t(tk('reportThisWeek'))}</p>
          </div>
          {payroll ? (
            <span className="rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-bold tabular-nums text-violet-700">
              {formatReportDate(payroll.weekStart, currentLanguage)} — {formatReportDate(payroll.weekEnd, currentLanguage)}
            </span>
          ) : null}
        </div>

        {rows.length === 0 ? (
          <div className="py-10 text-center text-xs text-nexoraMuted">
            {t(tk('reportEmpty'))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
            <table className="w-full min-w-[720px] table-fixed text-left text-xs">
              <thead>
                <tr className={POS_TABLE_HEADER_ROW_CLASS}>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(tk('reportColumnTechnician'))}</th>
                  <th className={`${POS_TABLE_HEADER_CELL_CLASS} text-right`}>{t(tk('reportColumnHours'))}</th>
                  <th className={`${POS_TABLE_HEADER_CELL_CLASS} text-right`}>{t(tk('reportColumnService'))}</th>
                  <th className={`${POS_TABLE_HEADER_CELL_CLASS} text-right`}>{t(tk('reportColumnCommission'))}</th>
                  <th className={`${POS_TABLE_HEADER_CELL_CLASS} text-right`}>{t(tk('reportColumnTip'))}</th>
                  <th className={`${POS_TABLE_HEADER_CELL_CLASS} text-right`}>{t(tk('reportColumnTechTakes'))}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.businessStaffLinkId} className="border-t border-nexoraBorder/70 transition-colors even:bg-violet-50/15 hover:bg-violet-50/40">
                    <td className="px-4 py-3 font-bold text-nexoraText">
                      <span className="inline-flex max-w-full rounded-full bg-cyan-100/70 px-2.5 py-1 text-cyan-800">
                        <span className="truncate">{row.displayName}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-nexoraText">
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 font-semibold text-sky-700">{row.hours.toFixed(1)}h</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-nexoraText">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">{formatCurrency(row.sales)}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-nexoraText">
                      <span className="rounded-full bg-violet-50 px-2.5 py-1 font-semibold text-violet-700">{formatCurrency(row.commission)}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-nexoraText">
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">{formatCurrency(row.tips)}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-nexoraText">
                      <span className="rounded-full bg-nexoraBrandSoft px-2.5 py-1 text-nexoraBrandDark">{formatCurrency(row.takeHome)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    )
  }

  const renderTodayTurnsPanel = () => {
    const rosterRows = todayRosterQuery.data?.rows ?? []
    const rows = [...rosterRows].sort((a, b) => {
      const turnsDifference = (a.turnsToday ?? 0) - (b.turnsToday ?? 0)
      if (turnsDifference !== 0) return turnsDifference
      if (a.turnRank == null && b.turnRank == null) return a.displayName.localeCompare(b.displayName)
      if (a.turnRank == null) return 1
      if (b.turnRank == null) return -1
      return a.turnRank - b.turnRank
    })
    const totalTurnsToday = rows.reduce((total, row) => total + Math.max(0, row.turnsToday ?? 0), 0)
    // Rows are sorted by today's turn count above, so the first available technician has the
    // fairest next turn. Do not require turnRank here: older roster responses can omit
    // that field even though the technician is clocked in. If every clocked-in technician is
    // currently serving, keep showing the first one in turn order instead of a misleading
    // "No upcoming turn" state.
    const nextTechnician =
      rows.find((row) => row.isClockedIn && !row.currentOrderId) ??
      rows.find((row) => row.isClockedIn && row.turnRank != null) ??
      rows.find((row) => row.isClockedIn)
    // The completed-order list has ticket-level technician/service aggregates. They cannot
    // tell us which technician performed which service when a ticket has multiple techs, so
    // build the table from each order detail's serviceLines instead. Keep both identifiers as
    // lookup keys because older responses may omit one of the display fields.
    type TicketServices = Map<string, { orderNumber: string; services: Set<string> }>
    const servicesByTechnicianId = new Map<string, TicketServices>()
    const servicesByTechnicianName = new Map<string, TicketServices>()
    const addService = (
      target: Map<string, TicketServices>,
      technicianKey: string | null | undefined,
      orderId: string,
      orderNumber: string,
      serviceName: string,
    ) => {
      const key = technicianKey?.trim()
      if (!key) return
      const ticketServices = target.get(key) ?? new Map<string, { orderNumber: string; services: Set<string> }>()
      const ticket = ticketServices.get(orderId) ?? { orderNumber, services: new Set<string>() }
      ticket.services.add(serviceName)
      ticketServices.set(orderId, ticket)
      target.set(key, ticketServices)
    }

    // For a single-technician ticket the list response is sufficient and avoids a detail call.
    for (const order of todayCompletedOrderItems) {
      const technicianNames = Array.from(
        new Set(order.technicianNames.map((name) => name.trim()).filter(Boolean)),
      )
      if (technicianNames.length !== 1) continue
      const serviceNames = order.serviceNames.map((service) => service.trim()).filter(Boolean)
      for (const serviceName of serviceNames) {
        addService(
          servicesByTechnicianName,
          technicianNames[0].toLocaleLowerCase(),
          order.id,
          order.orderNumber,
          serviceName,
        )
      }
    }

    // Multi-technician tickets use the detail response so each line remains attributed to the
    // correct technician instead of repeating every service under every name on the ticket.
    for (const orderQuery of todayCompletedOrderDetails) {
      const order = orderQuery.data
      if (!order) continue
      for (const line of order.serviceLines ?? []) {
        const serviceName = line.serviceName?.trim()
        if (!serviceName) continue
        addService(
          servicesByTechnicianId,
          line.assignedPosStaffProfileId,
          order.id,
          order.orderNumber,
          serviceName,
        )
        addService(
          servicesByTechnicianName,
          line.technicianName?.trim().toLocaleLowerCase(),
          order.id,
          order.orderNumber,
          serviceName,
        )
      }
    }

    const getServicesForTechnician = (row: (typeof rows)[number]) => {
      const summaries = new Map<string, string>()
      const technicianNameKey = row.displayName.trim().toLocaleLowerCase()
      const ticketGroups = [
        ...(row.posStaffProfileId ? [servicesByTechnicianId.get(row.posStaffProfileId)] : []),
        servicesByTechnicianName.get(technicianNameKey),
      ]
      for (const ticketServices of ticketGroups) {
        if (!ticketServices) continue
        for (const [orderId, ticket] of ticketServices) {
          summaries.set(orderId, `#${ticket.orderNumber}: ${Array.from(ticket.services).join(', ')}`)
        }
      }
      return Array.from(summaries.values())
    }

    return (
      <section
        className="space-y-3"
        aria-label={t(tk('todayTurnsTitle'))}
        data-testid="today-turns-panel"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-nexoraText">{t(tk('todayTurnsTitle'))}</h2>
            <p className="mt-0.5 text-xs text-nexoraMuted">{t(tk('todayTurnsHint'))}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-lg bg-nexoraCanvas px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
                {t(tk('todayTurnsTotal'))}
              </p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-nexoraText" data-testid="today-turns-total">
                {totalTurnsToday}
              </p>
            </div>
            <div className="rounded-lg bg-nexoraCanvas px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
                {t(tk('todayTurnsNext'))}
              </p>
              <p className="mt-0.5 max-w-[150px] truncate text-sm font-bold text-nexoraText" data-testid="today-turns-next">
                {nextTechnician?.displayName ?? t(tk('todayTurnsNoNext'))}
              </p>
            </div>
          </div>
        </div>

        {todayRosterQuery.isPending && !todayRosterQuery.data ? (
          <SkeletonList count={3} lines={1} />
        ) : todayRosterQuery.isError ? (
          <p className="rounded-lg bg-nexoraCanvas p-5 text-center text-xs text-nexoraMuted">
            {t(tk('todayTurnsError'))}
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-lg bg-nexoraCanvas p-5 text-center text-xs text-nexoraMuted">
            {t(tk('todayTurnsEmpty'))}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
            <table className="w-full min-w-[600px] table-fixed text-left text-xs">
              <colgroup>
                <col className="w-[35%]" />
                <col className="w-[15%]" />
                <col className="w-[50%]" />
              </colgroup>
              <thead>
                <tr className={POS_TABLE_HEADER_ROW_CLASS}>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(tk('todayTurnsColumnTechnician'))}</th>
                  <th className={`${POS_TABLE_HEADER_CELL_CLASS} text-right`}>{t(tk('todayTurnsColumnTurns'))}</th>
                  <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(tk('todayTurnsColumnServices'))}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isNext = row.posStaffProfileId === nextTechnician?.posStaffProfileId
                  const services = getServicesForTechnician(row)
                  return (
                    <tr
                      key={row.posStaffProfileId}
                      data-testid={`today-turn-row-${row.posStaffProfileId}`}
                      className={`border-t border-nexoraBorder/70 transition-colors ${isNext ? 'bg-emerald-50/40 hover:bg-emerald-50/65' : 'hover:bg-violet-50/35'}`}
                    >
                      <td className="px-3 py-2.5 font-semibold text-nexoraText">
                        <span className="inline-flex max-w-full rounded-full bg-cyan-100/70 px-2.5 py-1 text-cyan-800">
                          <span className="truncate">{row.displayName}</span>
                        </span>
                        {row.turnRank != null ? (
                          <span className="ml-2 text-[10px] font-bold text-nexoraMuted">#{row.turnRank}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold tabular-nums text-nexoraText">
                        {row.turnsToday}
                      </td>
                      <td className="max-w-[320px] px-3 py-2.5 font-semibold text-nexoraText">
                        {renderServiceChips(services)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="pos-front-desk-action-surface flex h-full min-h-0 flex-col gap-4">
      {/* Hidden while an Order Workspace is open (Check-in draft or editing an existing
          order) — iPad space optimization: this title/description block is
          "where am I" chrome that's redundant once the staff is heads-down on one
          customer's ticket, and the tab bar right below already stays visible/tappable
          for switching away. */}
      {!updateWorkspace && activeTab !== PosFrontDeskTab.CheckIn ? (
        <section className="px-0.5">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold leading-tight tracking-tight text-nexoraText">
              {t('dashboard.menu.pos_board')}
            </h1>
            <p className="text-xs font-medium text-nexoraMuted">{t(tk('description'))}</p>
          </div>
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
            className={`flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition-all ${
              !updateWorkspace && activeTab === tab
                ? 'bg-nexoraBrand text-white shadow-sm'
                : 'bg-nexoraSurface text-nexoraMuted shadow-sm ring-1 ring-inset ring-nexoraBorder/80 hover:bg-nexoraCanvas hover:text-nexoraText hover:ring-nexoraBrand/30'
            }`}
          >
            {t(tk(`tabs.${tab}`))}
            {typeof tabBadges[tab] === 'number' ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                  !updateWorkspace && activeTab === tab
                    ? 'bg-white/20 text-white'
                    : 'bg-nexoraCanvas text-nexoraMuted'
                }`}
              >
                {tabBadges[tab]}
              </span>
            ) : null}
          </button>
        ))}
      </ScrollableTabStrip>

      {updateWorkspace ? (
        <PosOrderWorkspace
          businessId={businessId}
          orderId={updateWorkspace.orderId}
          mode={updateWorkspace.mode}
          businessName={receiptBusinessName}
          businessAddress={receiptBusinessAddress}
          businessPhone={businessPhone}
          onClose={() => {
            setUpdateWorkspace(null)
            refreshFrontDeskLists()
          }}
          onCompleted={() => {
            setUpdateWorkspace(null, PosFrontDeskTab.CheckoutCustomer)
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
            // Land on the Tickets tab with the All filter: the just-created ticket is visible there
            // together with everything else in the queue, so the operator keeps the whole floor in
            // view instead of only the waiting guests. Fires on Done rather than on check-in itself:
            // the operator reads the number off the thank-you screen, so the screen stays until they
            // are finished with it.
            setActiveTab(PosFrontDeskTab.OrderList)
            setOrderListFilter(OrderListFilter.All)
            refreshFrontDeskLists()
          }}
        />
      </div>

      {activeTab === PosFrontDeskTab.OrderList && (
        isOrderListLoading ? (
          <div className="py-6">
            <SkeletonList count={3} lines={1} />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5 rounded-xl bg-nexoraCanvas/70 p-1.5">
                {ORDER_LIST_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setOrderListFilter(filter)}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-all ${
                      orderListFilter === filter
                        ? ORDER_LIST_FILTER_STYLES[filter].active
                        : ORDER_LIST_FILTER_STYLES[filter].inactive
                    }`}
                  >
                    {/* Counted over the whole queue, not the active filter — the point of the
                        number is deciding which chip to tap next. */}
                    {t(tk(`orderListFilter.${filter}`))} ({orderListFilterCounts[filter]})
                  </button>
                ))}
              </div>
              <div className="flex gap-1 rounded-xl border border-nexoraBorder bg-nexoraCanvas/70 p-1">
                <button
                  type="button"
                  onClick={() => handleChangeViewMode(OrderListViewMode.List)}
                  aria-label={t(tk('viewModeList'))}
                  className={`rounded-lg p-1.5 transition-all ${
                    viewMode === OrderListViewMode.List
                      ? 'bg-white text-nexoraBrandDark shadow-sm ring-1 ring-inset ring-nexoraBorder/70'
                      : 'text-nexoraMuted hover:bg-white/80 hover:text-nexoraText'
                  }`}
                >
                  <ListIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeViewMode(OrderListViewMode.Card)}
                  aria-label={t(tk('viewModeCard'))}
                  className={`rounded-lg p-1.5 transition-all ${
                    viewMode === OrderListViewMode.Card
                      ? 'bg-white text-nexoraBrandDark shadow-sm ring-1 ring-inset ring-nexoraBorder/70'
                      : 'text-nexoraMuted hover:bg-white/80 hover:text-nexoraText'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

            {orderListFilter === OrderListFilter.NotArrived ? renderNotArrivedList() : (() => {
              const filteredOrderList = sortByAttentionFirst(
                orderList.filter((order) => {
                  if (orderListFilter === OrderListFilter.Waiting) return order.status === PosOrderStatus.Waiting
                  if (orderListFilter === OrderListFilter.InService) return order.status === PosOrderStatus.InService
                  return true
                }),
              )

              // All is the whole day's guests, so the appointments that have not arrived yet are
              // listed as well as counted. They come after the tickets: nothing has started on
              // them, and the Not Arrived chip still exists for looking at them on their own.
              const notArrivedRows =
                orderListFilter === OrderListFilter.All ? notArrivedBookings : []

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

              if (filteredOrderList.length === 0 && notArrivedRows.length === 0) {
                return (
                  <div className="py-10 text-center text-xs text-nexoraMuted">
                    {t(tk('orderListEmpty'))}
                  </div>
                )
              }

              // The row is already tappable, but a tap target with no label is a rule staff have to
              // be told. This states it, and is the only action every row has regardless of status.
              const renderEditButton = (order: OrderListItemApiDto) => (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setUpdateWorkspace({ orderId: order.id, mode: 'edit' })
                  }}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-nexoraLavender bg-violet-50 px-2.5 text-[10px] font-extrabold text-violet-700 transition-colors hover:bg-violet-100"
                >
                  <PencilLine className="h-3 w-3" aria-hidden="true" />
                  {t(tk('editButton'))}
                </button>
              )

              const renderCancelButton = (order: OrderListItemApiDto) =>
                order.status === PosOrderStatus.Waiting ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCancel(order.id, order.customerName)
                    }}
                    disabled={cancelOrder.isPending}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[10px] font-extrabold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                    {t(tk('cancelButton'))}
                  </button>
                ) : null

              // The two things StartOrderService refuses, spelled out on the button instead of
              // waiting for a red toast: a line with no technician ("First available" leaves it
              // that way on purpose until someone assigns) and an order with nothing to serve.
              // Disabled rather than hidden — the row's own warning flag says which one it is.
              const startServiceBlockedReason = (order: OrderListItemApiDto) => {
                if (order.hasNoServiceLine) return t(tk('addServiceFirst'))
                if (order.hasUnassignedService) return t(tk('assignTechnicianFirst'))
                return undefined
              }

              const renderStartServiceButton = (order: OrderListItemApiDto) => {
                if (order.status !== PosOrderStatus.Waiting) return null
                const blockedReason = startServiceBlockedReason(order)
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartService(order.id)
                    }}
                    disabled={startOrderService.isPending || blockedReason !== undefined}
                    title={blockedReason}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-extrabold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Play className="h-3 w-3" aria-hidden="true" />
                    {t(tk('startServiceButton'))}
                  </button>
                )
              }

              // Checkout is the explicit payment entry. A row tap or Edit stays in operational
              // edit mode even when the ticket is already InService.
              const renderCheckoutButton = (order: OrderListItemApiDto) =>
                order.status === PosOrderStatus.InService ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setUpdateWorkspace({ orderId: order.id, mode: 'checkout' })
                    }}
                    aria-label={t(tk('checkoutButton'))}
                    title={t(tk('checkoutButton'))}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 text-[10px] font-extrabold text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-100"
                  >
                    <DollarSign className="h-3 w-3" aria-hidden="true" />
                    {t(tk('checkoutButton'))}
                  </button>
                ) : null

              if (viewMode === OrderListViewMode.Card) {
                return (
                  <div className="flex min-h-0 flex-1 flex-col gap-3">
                  {attentionBadges}
                  <div
                    className={`grid ${ORDER_LIST_FILL_MAIN_HEIGHT} content-start grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3`}
                  >
                    {filteredOrderList.map((order) => (
                      <div
                        key={order.id}
                        data-order-status={order.status}
                        onClick={() => setUpdateWorkspace({ orderId: order.id, mode: 'edit' })}
                        className={`cursor-pointer space-y-2 rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-nexoraBrand hover:shadow-md ${orderListStatusSurfaceClass(order.status)} ${
                          needsFrontDeskAttention(order)
                            ? 'border-nexoraWarning'
                            : 'border-nexoraBorder'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold text-nexoraMuted">#{order.orderNumber}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${orderListStatusBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">{renderRowFlags(order)}</div>
                        <p className="truncate text-sm font-bold text-nexoraText">{order.customerName}</p>
                        {renderServiceChips(order.serviceNames)}
                        <div>{renderTechnicianChip(order.technicianNames)}</div>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-nexoraBorder pt-2">
                          <span className="text-[11px] text-nexoraMuted">
                            {t(tk('waitMinutes'), { minutes: order.elapsedMinutes })}
                          </span>
                          <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
                            {renderEditButton(order)}
                            {renderStartServiceButton(order)}
                            {renderCheckoutButton(order)}
                            {renderCancelButton(order)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {notArrivedRows.map((booking) => renderNotArrivedCard(booking, true))}
                  </div>
                  </div>
                )
              }

              return (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                {attentionBadges}
                <div
                  className={`${ORDER_LIST_FILL_MAIN_HEIGHT} overflow-auto rounded-xl border border-nexoraBorder bg-white`}
                >
                  <table className="w-full min-w-[1100px] table-auto text-left text-xs">
                    <thead className="sticky top-0 z-[1] bg-nexoraCanvas/90">
                      <tr className={POS_TABLE_HEADER_ROW_CLASS}>
                        <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(tk('orderListColumnNumber'))}</th>
                        <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(tk('orderListColumnCustomer'))}</th>
                        <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(tk('orderListColumnCheckInAt'))}</th>
                        <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(tk('orderListColumnStatus'))}</th>
                        <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(tk('orderListColumnTechnician'))}</th>
                        <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(tk('orderListColumnServices'))}</th>
                        <th className={`${POS_TABLE_HEADER_CELL_CLASS} text-right`}>{t(tk('orderListColumnWaitTime'))}</th>
                        <th className={`${POS_TABLE_HEADER_CELL_CLASS} ${POS_TABLE_STICKY_ACTION_HEADER_CLASS} text-right`}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrderList.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => setUpdateWorkspace({ orderId: order.id, mode: 'edit' })}
                          className={`cursor-pointer border-t border-nexoraBorder/70 transition-colors ${orderListStatusSurfaceClass(order.status)} ${
                            needsFrontDeskAttention(order) ? 'border-l-2 border-l-nexoraWarning' : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-nexoraMuted">#{order.orderNumber}</td>
                          <td className="px-4 py-3 font-bold text-nexoraText">{order.customerName}</td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-nexoraText">
                            {formatPosTime(order.checkedInAt, currentLanguage) || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${orderListStatusBadgeClass(order.status)}`}>
                                {order.status}
                              </span>
                              {renderRowFlags(order)}
                            </div>
                          </td>
                          <td className="px-4 py-3">{renderTechnicianChip(order.technicianNames)}</td>
                          <td className="px-4 py-3">{renderServiceChips(order.serviceNames)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-nexoraMuted">
                            {t(tk('waitMinutes'), { minutes: order.elapsedMinutes })}
                          </td>
                          <td className={`${POS_TABLE_STICKY_ACTION_CELL_CLASS} px-4 py-3 text-right`}>
                            <div className="inline-flex w-max justify-end gap-1.5">
                              {renderEditButton(order)}
                              {renderStartServiceButton(order)}
                              {renderCheckoutButton(order)}
                              {renderCancelButton(order)}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {notArrivedRows.map(renderNotArrivedOrderRow)}
                    </tbody>
                  </table>
                </div>
                </div>
              )
            })()}
          </div>
        )
      )}

      {activeTab === PosFrontDeskTab.CheckoutCustomer && renderCheckoutCustomerPanel()}

      {activeTab === PosFrontDeskTab.TurnBoard && (
        <div className="space-y-4">
          {isTurnBoardLoading ? (
            <div className="py-6">
              <SkeletonList count={3} lines={2} />
            </div>
          ) : turnBoard.length === 0 ? (
            <div className="py-8 text-center text-xs text-nexoraMuted">
              {t(tk('turnBoardEmpty'))}
            </div>
          ) : (
            <div
              className={`grid ${SCROLL_PANEL_MAX_HEIGHT} grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3`}
            >
              {turnBoard.map(renderStationCard)}
            </div>
          )}
          {renderTodayTurnsPanel()}
        </div>
      )}

      {activeTab === PosFrontDeskTab.Completed && <PosCompletedOrdersPanel businessId={businessId} />}

      {activeTab === PosFrontDeskTab.Booking && (
        <BookingTab
          businessId={businessId}
          businessSlug={businessSlug}
          rosterRows={todayRosterQuery.data?.rows ?? []}
          rosterLoading={todayRosterQuery.isLoading}
          rosterError={todayRosterQuery.isError}
          onRosterRetry={() => { void todayRosterQuery.refetch() }}
          onNewBooking={(slot) => {
            setBookingSlot(slot ? {
              date: slot.date,
              time: slot.time,
              staffName: slot.staffName,
              posStaffProfileId: slot.posStaffProfileId,
            } : null)
            setIsBookingModalOpen(true)
          }}
        />
      )}

      {activeTab === PosFrontDeskTab.TimeClock && <TimeClockTab businessId={businessId} />}

      {activeTab === PosFrontDeskTab.Customer && <CustomerTab businessId={businessId} />}

      {activeTab === PosFrontDeskTab.Report && (
        <PosReportPanel
          businessId={businessId}
          isActive={activeTab === PosFrontDeskTab.Report}
          selection={reportSelection}
          onSelectionChange={setReportSelection}
        />
      )}
        </>
      )}

      <BeepMessageModal
        open={beepStation !== null}
        staffName={beepStation?.displayName ?? ''}
        message={beepMessage}
        isPending={beepStaff.isPending}
        onChangeMessage={setBeepMessage}
        onSend={handleSendBeep}
        onClose={closeBeepModal}
      />

      <NewBookingForm
        open={isBookingModalOpen}
        initialSlot={bookingSlot}
        businessId={businessId}
        onClose={() => { setIsBookingModalOpen(false); setBookingSlot(null) }}
        onCreated={() => {
          setIsBookingModalOpen(false)
          setBookingSlot(null)
          refreshFrontDeskLists()
          // Land on the Bookings tab so the staff sees the booking they just created.
          setActiveTab(PosFrontDeskTab.Booking)
        }}
      />
    </div>
  )
}
