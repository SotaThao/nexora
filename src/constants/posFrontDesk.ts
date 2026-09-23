/**
 * POS Front Desk — tab ids, list filters and view modes.
 *
 * These are UI-local values (they never travel to the API), but they are referenced from three
 * places at once — the tab list, the `?tab=` deep link, and every `activeTab ===` branch — so a
 * typo in any one of them fails silently as "tab renders nothing". Keeping them here makes the
 * set closed and greppable, same reasoning as `posOrderStatus.ts` for backend-mirrored values.
 */
export enum PosFrontDeskTab {
  CheckIn = 'checkin',
  OrderList = 'orderlist',
  CheckoutCustomer = 'checkoutcustomer',
  TurnBoard = 'turnboard',
  Completed = 'completed',
  Booking = 'booking',
  Estimate = 'estimate',
  TimeClock = 'timeclock',
  Customer = 'customer',
  Report = 'report',
}

/** Render order of the tab bar. */
export const POS_FRONT_DESK_TABS: PosFrontDeskTab[] = [
  PosFrontDeskTab.CheckIn,
  PosFrontDeskTab.OrderList,
  PosFrontDeskTab.TurnBoard,
  PosFrontDeskTab.CheckoutCustomer,
  PosFrontDeskTab.Completed,
  PosFrontDeskTab.Booking,
  PosFrontDeskTab.Estimate,
  PosFrontDeskTab.TimeClock,
  PosFrontDeskTab.Customer,
]

export const DEFAULT_POS_FRONT_DESK_TAB = PosFrontDeskTab.OrderList

/** Deep-link param, e.g. the Owner dashboard's "Total Bookings" KPI links to `?tab=booking`. */
export const POS_FRONT_DESK_TAB_PARAM = 'tab'

/**
 * Report period deep-link params, e.g. `?tab=report&mode=Daily&dates=2026-08-21`.
 * The plural query-key names are kept for backwards-compatible links, but the picker now keeps
 * exactly one day, one ISO week, or one month.
 */
export const REPORT_MODE_PARAM = 'mode'
export const REPORT_DATES_PARAM = 'dates'
export const REPORT_WEEKS_PARAM = 'weeks'
export const REPORT_MONTH_PARAM = 'month'

/**
 * Order List (US-17) folded the old standalone Waitlist tab in as a filter — Waiting + InService
 * both come from the same useOrderList query, so this stays a client-side filter, not a query.
 */
export enum OrderListFilter {
  All = 'all',
  NotArrived = 'notarrived',
  Waiting = 'waiting',
  InService = 'inservice',
}

/**
 * Guest-journey order: not arrived -> waiting -> in service.
 *
 * NotArrived is the odd one out — it is not a ticket status. A booking only becomes a ticket at
 * check-in, so that chip reads today's booking list while the other three filter the order list.
 * All (= the whole day's guests) counts and lists them too, after its tickets, in a row shape of
 * their own — a booking has no ticket number, status or elapsed time to put in those columns.
 */
export const ORDER_LIST_FILTERS: OrderListFilter[] = [
  OrderListFilter.All,
  OrderListFilter.NotArrived,
  OrderListFilter.Waiting,
  OrderListFilter.InService,
]

/**
 * Turn Board status filter. Derived from the board rows, not sent to the API — but referenced from
 * the chip list and every `statusFilter ===` branch, so it lives here for the same reason the tab
 * ids do.
 *
 * There is no "Paused" option: the salon has no such technician state. A technician is either
 * clocked in (and then free or with a customer) or clocked out.
 */
export enum TurnBoardStatusFilter {
  All = 'all',
  Available = 'available',
  Busy = 'busy',
  ClockedOut = 'clockedout',
}

export const TURN_BOARD_STATUS_FILTERS: TurnBoardStatusFilter[] = [
  TurnBoardStatusFilter.All,
  TurnBoardStatusFilter.Available,
  TurnBoardStatusFilter.Busy,
  TurnBoardStatusFilter.ClockedOut,
]

/** Dense table, station cards, or the turn-by-turn grid. Remembered across visits (pure UI preference). */
export enum TurnBoardViewMode {
  Compact = 'compact',
  Stations = 'stations',
  Grid = 'grid',
}

export const TURN_BOARD_VIEW_MODE_STORAGE_KEY = 'pos_turn_board_view_mode'

/** User-chosen List/Card view, remembered across visits (pure UI preference, not domain data). */
export enum OrderListViewMode {
  List = 'list',
  Card = 'card',
}

export const ORDER_LIST_VIEW_MODE_STORAGE_KEY = 'pos_order_list_view_mode'
