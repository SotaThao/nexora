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
  TurnBoard = 'turnboard',
  Completed = 'completed',
  Booking = 'booking',
  TimeClock = 'timeclock',
  Customer = 'customer',
}

/** Render order of the tab bar. */
export const POS_FRONT_DESK_TABS: PosFrontDeskTab[] = [
  PosFrontDeskTab.CheckIn,
  PosFrontDeskTab.OrderList,
  PosFrontDeskTab.TurnBoard,
  PosFrontDeskTab.Completed,
  PosFrontDeskTab.Booking,
  PosFrontDeskTab.TimeClock,
  PosFrontDeskTab.Customer,
]

export const DEFAULT_POS_FRONT_DESK_TAB = PosFrontDeskTab.OrderList

/** Deep-link param, e.g. the Owner dashboard's "Total Bookings" KPI links to `?tab=booking`. */
export const POS_FRONT_DESK_TAB_PARAM = 'tab'

/**
 * Order List (US-17) folded the old standalone Waitlist tab in as a filter — Waiting + InService
 * both come from the same useOrderList query, so this stays a client-side filter, not a query.
 */
export enum OrderListFilter {
  All = 'all',
  Waiting = 'waiting',
  InService = 'inservice',
}

export const ORDER_LIST_FILTERS: OrderListFilter[] = [
  OrderListFilter.All,
  OrderListFilter.Waiting,
  OrderListFilter.InService,
]

/** User-chosen List/Card view, remembered across visits (pure UI preference, not domain data). */
export enum OrderListViewMode {
  List = 'list',
  Card = 'card',
}

export const ORDER_LIST_VIEW_MODE_STORAGE_KEY = 'pos_order_list_view_mode'
