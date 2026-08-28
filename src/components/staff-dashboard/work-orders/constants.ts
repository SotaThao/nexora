import { STAFF_WORK_ORDERS_SCREEN } from '../constants'

export const WORK_ORDERS_I18N = {
  breadcrumbWorkspace: 'staff_dashboard.work_orders.breadcrumb_workspace',
  breadcrumbSalon: 'staff_dashboard.work_orders.breadcrumb_salon',
  chooseTitle: 'staff_dashboard.work_orders.choose_title',
  chooseSubtitle: 'staff_dashboard.work_orders.choose_subtitle',
  pageTitle: 'staff_dashboard.titles.work-orders',
  today: 'staff_dashboard.work_orders.today',
  prevDay: 'staff_dashboard.work_orders.prev_day',
  nextDay: 'staff_dashboard.work_orders.next_day',
  pickDate: 'staff_dashboard.work_orders.pick_date',
  prevMonth: 'staff_dashboard.work_orders.prev_month',
  nextMonth: 'staff_dashboard.work_orders.next_month',
  ticketCount: 'staff_dashboard.work_orders.ticket_count',
  station: 'staff_dashboard.work_orders.station',
  beeper: 'staff_dashboard.work_orders.beeper',
  empty: 'staff_dashboard.work_orders.empty',
  filterAll: 'staff_dashboard.work_orders.filter_all',
  statusAssigned: 'staff_dashboard.work_orders.status_assigned',
  statusInService: 'staff_dashboard.work_orders.status_in_service',
  statusCompleted: 'staff_dashboard.work_orders.status_completed',
  detailTitle: 'staff_dashboard.work_orders.detail_title',
  back: 'staff_dashboard.work_orders.back',
  customer: 'staff_dashboard.work_orders.customer',
  services: 'staff_dashboard.work_orders.services',
  addService: 'staff_dashboard.work_orders.add_service',
  addOn: 'staff_dashboard.work_orders.add_on',
  colService: 'staff_dashboard.work_orders.col_service',
  colPrice: 'staff_dashboard.work_orders.col_price',
  colTime: 'staff_dashboard.work_orders.col_time',
  durationMin: 'staff_dashboard.work_orders.duration_min',
  serviceTotal: 'staff_dashboard.work_orders.service_total',
  startService: 'staff_dashboard.work_orders.start_service',
  completeService: 'staff_dashboard.work_orders.complete_service',
  notesLabel: 'staff_dashboard.work_orders.notes_label',
  notesTitle: 'staff_dashboard.work_orders.notes_title',
} as const

export enum WorkOrderTicketStatus {
  Assigned = 'Assigned',
  InService = 'InService',
  Completed = 'Completed',
}

export const WORK_ORDER_TICKET_FILTER = {
  All: 'All',
  Assigned: WorkOrderTicketStatus.Assigned,
  InService: WorkOrderTicketStatus.InService,
  Completed: WorkOrderTicketStatus.Completed,
} as const

export type WorkOrderTicketFilter =
  (typeof WORK_ORDER_TICKET_FILTER)[keyof typeof WORK_ORDER_TICKET_FILTER]

export const WORK_ORDER_STATUS_I18N: Record<WorkOrderTicketStatus, string> = {
  [WorkOrderTicketStatus.Assigned]: WORK_ORDERS_I18N.statusAssigned,
  [WorkOrderTicketStatus.InService]: WORK_ORDERS_I18N.statusInService,
  [WorkOrderTicketStatus.Completed]: WORK_ORDERS_I18N.statusCompleted,
}

export const WORK_ORDER_FILTER_I18N: Record<WorkOrderTicketFilter, string> = {
  [WORK_ORDER_TICKET_FILTER.All]: WORK_ORDERS_I18N.filterAll,
  [WORK_ORDER_TICKET_FILTER.Assigned]: WORK_ORDERS_I18N.statusAssigned,
  [WORK_ORDER_TICKET_FILTER.InService]: WORK_ORDERS_I18N.statusInService,
  [WORK_ORDER_TICKET_FILTER.Completed]: WORK_ORDERS_I18N.statusCompleted,
}

export const WORK_ORDER_FILTER_TABS: WorkOrderTicketFilter[] = [
  WORK_ORDER_TICKET_FILTER.All,
  WORK_ORDER_TICKET_FILTER.Assigned,
  WORK_ORDER_TICKET_FILTER.InService,
  WORK_ORDER_TICKET_FILTER.Completed,
]

export enum WorkOrderActionIcon {
  Play = 'play',
  Check = 'check',
}

export type WorkOrderStatusAction = {
  labelKey: string
  nextStatus: WorkOrderTicketStatus
  icon: WorkOrderActionIcon
}

export const WORK_ORDER_STATUS_ACTION: Record<WorkOrderTicketStatus, WorkOrderStatusAction | null> = {
  [WorkOrderTicketStatus.Assigned]: {
    labelKey: WORK_ORDERS_I18N.startService,
    nextStatus: WorkOrderTicketStatus.InService,
    icon: WorkOrderActionIcon.Play,
  },
  [WorkOrderTicketStatus.InService]: {
    labelKey: WORK_ORDERS_I18N.completeService,
    nextStatus: WorkOrderTicketStatus.Completed,
    icon: WorkOrderActionIcon.Check,
  },
  [WorkOrderTicketStatus.Completed]: null,
}

export const WORK_ORDER_STATUS_BADGE_CLASS: Record<WorkOrderTicketStatus, string> = {
  [WorkOrderTicketStatus.Assigned]: 'bg-nexoraBrandSoft text-nexoraBrand',
  [WorkOrderTicketStatus.InService]: 'bg-cyan-50 text-cyan-700',
  [WorkOrderTicketStatus.Completed]: 'bg-emerald-50 text-nexoraSuccess',
}

/** Mobile-first type/spacing; `lg` matches staff desktop shell (1024px). */
export const WORK_ORDERS_LAYOUT_CLASS = {
  breadcrumb: 'text-[11px] font-medium text-nexoraSubtle lg:text-xs',
  title: 'mt-2 text-xl font-extrabold tracking-tight text-nexoraText lg:mt-3 lg:text-3xl',
  subtitle: 'mt-1.5 text-xs leading-relaxed text-nexoraMuted lg:mt-2 lg:text-sm',
  list: 'mt-5 space-y-2.5 lg:mt-8 lg:space-y-3',
  card: 'flex w-full items-center gap-3 rounded-2xl border border-nexoraBorder bg-white px-3.5 py-3 text-left shadow-sm transition hover:border-nexoraBrand/20 hover:shadow-md lg:gap-3.5 lg:px-4 lg:py-3.5',
  iconWrap: 'grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-nexoraBrandSoft text-nexoraBrand lg:h-11 lg:w-11',
  storeIcon: 'h-4 w-4 lg:h-5 lg:w-5',
  salonName: 'block truncate text-sm font-extrabold text-nexoraText lg:text-base',
  addressRow: 'mt-0.5 flex items-center gap-1 text-xs text-nexoraMuted lg:text-sm',
  pinIcon: 'h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5',
  chevronIcon: 'h-4 w-4 shrink-0 text-nexoraSubtle lg:h-5 lg:w-5',
  ticketsTitleRow: 'mt-2 flex items-start justify-between gap-3 lg:mt-3',
  ticketsTitle: 'text-2xl font-extrabold tracking-tight text-nexoraText lg:text-3xl',
  ticketsSalon: 'mt-1 text-sm font-extrabold text-nexoraBrand lg:text-base',
  countBadge: 'grid h-8 w-8 shrink-0 place-items-center rounded-full bg-nexoraBrandSoft text-sm font-extrabold text-nexoraBrand lg:h-9 lg:w-9',
  dateNav: 'relative mt-5 lg:mt-6',
  dateNavRow: 'flex items-center justify-between rounded-2xl border border-nexoraBorder bg-white px-2 py-2.5 shadow-sm lg:px-3',
  dateNavButton: 'grid h-9 w-9 place-items-center rounded-xl text-nexoraMuted transition hover:bg-nexoraCanvas hover:text-nexoraText',
  dateNavLabel: 'inline-flex min-w-0 items-center gap-2 rounded-xl px-2 py-1 text-sm font-extrabold text-nexoraText transition hover:bg-nexoraCanvas lg:text-base',
  dateNavIcon: 'h-4 w-4 text-nexoraBrand lg:h-5 lg:w-5',
  calendarPopover: 'absolute left-1/2 z-30 mt-2 w-[min(18rem,calc(100%-0.5rem))] -translate-x-1/2 rounded-2xl border border-nexoraBorder bg-white p-3 shadow-lg',
  calendarNav: 'mb-2 flex items-center justify-between gap-2',
  calendarMonth: 'text-sm font-extrabold text-nexoraText',
  calendarWeekdays: 'grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wide text-nexoraSubtle',
  calendarGrid: 'mt-1 grid grid-cols-7 gap-0.5',
  calendarDay: 'grid h-9 w-full place-items-center rounded-full text-xs font-bold transition',
  calendarDayIdle: 'text-nexoraText hover:bg-nexoraCanvas',
  calendarDayToday: 'text-nexoraBrand ring-1 ring-nexoraBrand/40 hover:bg-nexoraBrandSoft',
  calendarDaySelected: 'bg-nexoraBrand text-white',
  calendarDaySpacer: 'h-9',
  filterBar: 'mt-3 flex gap-1 overflow-x-auto rounded-full border border-nexoraBorder bg-white p-1 shadow-sm nexora-no-scrollbar lg:mt-4',
  filterTab: 'min-w-0 flex-1 whitespace-nowrap rounded-full px-2 py-2 text-center text-[11px] font-bold transition lg:px-3 lg:text-sm',
  filterTabActive: 'bg-nexoraBrand text-white shadow-sm',
  filterTabInactive: 'bg-transparent text-nexoraSubtle hover:text-nexoraText',
  listMeta: 'mt-4 flex items-center justify-between text-[11px] font-medium text-nexoraSubtle lg:mt-5 lg:text-xs',
  ticketList: 'mt-2.5 space-y-2.5 lg:mt-3 lg:space-y-3',
  ticketCard: 'flex w-full items-start gap-2.5 rounded-2xl border border-nexoraBorder bg-white px-3.5 py-3 text-left shadow-sm transition hover:border-nexoraBrand/20 hover:shadow-md lg:gap-3 lg:px-4 lg:py-3.5',
  ticketTime: 'shrink-0 whitespace-nowrap font-extrabold tabular-nums leading-5 text-nexoraBrand text-sm lg:text-base lg:leading-6',
  ticketChevron: 'h-4 w-4 shrink-0 self-center text-nexoraSubtle lg:h-5 lg:w-5',
  ticketHeadRow: 'flex items-start justify-between gap-2',
  ticketCustomer: 'block truncate text-sm font-extrabold leading-5 text-nexoraText lg:text-base lg:leading-6',
  ticketService: 'mt-0.5 block truncate text-xs text-nexoraMuted lg:text-sm',
  ticketMeta: 'mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-nexoraMuted lg:text-xs',
  ticketMetaIcon: 'h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5',
  ticketBadge: 'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold lg:text-[11px]',
  detailPage: 'space-y-3 lg:space-y-4',
  detailHeader: 'flex items-center gap-2 rounded-2xl border border-nexoraBorder bg-white px-3 py-3 shadow-sm lg:px-4 lg:py-3.5',
  detailBack: 'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-nexoraText transition hover:bg-nexoraCanvas',
  detailTitleWrap: 'min-w-0 flex-1',
  detailTitle: 'text-left text-base font-extrabold text-nexoraText lg:text-lg',
  detailCode: 'mt-0.5 text-left text-[11px] font-medium text-nexoraSubtle lg:text-xs',
  detailBadge: 'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold lg:text-xs',
  customerCard: 'rounded-2xl border border-nexoraBorder bg-white px-4 py-4 shadow-sm lg:px-5 lg:py-5',
  customerRow: 'flex items-center gap-3 lg:gap-4',
  avatar: 'grid h-14 w-14 shrink-0 place-items-center rounded-full bg-nexoraBrandSoft text-sm font-extrabold text-nexoraBrand lg:h-16 lg:w-16 lg:text-base',
  customerLabel: 'text-[11px] font-bold text-nexoraBrand lg:text-xs',
  customerName: 'text-lg font-extrabold tracking-tight text-nexoraText lg:text-xl',
  customerMeta: 'mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-nexoraMuted lg:text-sm',
  servicesCard: 'rounded-2xl border border-nexoraBorder bg-white px-4 py-4 shadow-sm lg:px-5 lg:py-5',
  servicesHead: 'flex items-center justify-between gap-3',
  servicesTitle: 'text-base font-extrabold text-nexoraText lg:text-lg',
  textLink: 'text-xs font-bold text-nexoraBrand lg:text-sm',
  serviceCols: 'mt-3 grid grid-cols-[minmax(0,1fr)_4.25rem_3.25rem_4.5rem] gap-2 border-b border-nexoraRule pb-2 text-[10px] font-bold uppercase tracking-wide text-nexoraSubtle lg:text-[11px]',
  serviceList: 'divide-y divide-nexoraRule',
  serviceRow: 'grid grid-cols-[minmax(0,1fr)_4.25rem_3.25rem_4.5rem] items-start gap-2 py-3',
  grow: 'min-w-0 flex-1',
  truncate: 'min-w-0 truncate',
  metaChip: 'inline-flex items-center gap-1',
  metaChipWide: 'inline-flex items-center gap-1.5',
  iconSm: 'h-4 w-4',
  iconMd: 'h-5 w-5',
  iconMdFill: 'h-5 w-5 fill-current',
  alignEnd: 'text-right',
  textLinkEnd: 'text-right text-xs font-bold text-nexoraBrand lg:text-sm',
  ticketEmpty: 'mt-2.5 rounded-2xl border border-dashed border-nexoraBorder bg-white px-4 py-10 text-center text-sm text-nexoraMuted',
  serviceName: 'truncate text-sm font-extrabold text-nexoraText lg:text-base',
  addOnName: 'flex items-center gap-1.5 pl-3 text-sm font-medium text-nexoraText lg:pl-4 lg:text-base',
  addOnIcon: 'h-3.5 w-3.5 shrink-0 text-nexoraBrand',
  servicePrice: 'text-right text-sm font-extrabold tabular-nums text-nexoraText lg:text-base',
  serviceTime: 'text-right text-xs text-nexoraMuted lg:text-sm',
  serviceTotalRow: 'mt-1 flex items-center justify-between gap-3 border-t border-nexoraRule pt-3',
  serviceTotalLabel: 'text-sm text-nexoraMuted lg:text-base',
  serviceTotalValue: 'text-lg font-extrabold tabular-nums text-nexoraText lg:text-xl',
  actionButton: 'flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-nexoraBrand to-nexoraElectricMid text-sm font-extrabold text-white shadow-lg shadow-nexoraBrand/30 transition hover:opacity-95 lg:h-14 lg:text-base',
  notesCard: 'rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 lg:px-5 lg:py-4',
  notesKicker: 'text-xs font-extrabold text-nexoraWarning lg:text-sm',
  notesHeading: 'mt-1 text-sm font-extrabold text-nexoraText lg:text-base',
  notesBody: 'mt-1 text-sm leading-relaxed text-nexoraText lg:text-[15px]',
} as const

export const WORK_ORDERS_BREADCRUMB_SEPARATOR = ' · '
export const WORK_ORDER_WEEKDAY_COUNT = 7
export const WORK_ORDER_MAX_INITIALS = 2
export const WORK_ORDER_KEYBOARD = { escape: 'Escape' } as const

export enum StaffWorkOrdersViewKind {
  Picker = 'picker',
  Redirect = 'redirect',
  Tickets = 'tickets',
  Detail = 'detail',
}

export const WORK_ORDER_CALENDAR_DAY_STATE = {
  selected: 'calendarDaySelected',
  today: 'calendarDayToday',
  idle: 'calendarDayIdle',
} as const

export const WORK_ORDER_FILTER_TAB_STATE_CLASS = {
  active: WORK_ORDERS_LAYOUT_CLASS.filterTabActive,
  inactive: WORK_ORDERS_LAYOUT_CLASS.filterTabInactive,
} as const

export function workOrderFilterTabClass(isActive: boolean) {
  const state = isActive ? 'active' : 'inactive'
  return `${WORK_ORDERS_LAYOUT_CLASS.filterTab} ${WORK_ORDER_FILTER_TAB_STATE_CLASS[state]}`
}

export const WORK_ORDER_COLUMN_ALIGN = {
  start: 'start',
  end: 'end',
} as const

export const WORK_ORDER_COLUMN_ALIGN_CLASS = {
  [WORK_ORDER_COLUMN_ALIGN.start]: '',
  [WORK_ORDER_COLUMN_ALIGN.end]: WORK_ORDERS_LAYOUT_CLASS.alignEnd,
} as const

export const WORK_ORDER_SERVICE_COLUMNS = [
  { id: 'name', labelKey: WORK_ORDERS_I18N.colService, align: WORK_ORDER_COLUMN_ALIGN.start },
  { id: 'price', labelKey: WORK_ORDERS_I18N.colPrice, align: WORK_ORDER_COLUMN_ALIGN.end },
  { id: 'time', labelKey: WORK_ORDERS_I18N.colTime, align: WORK_ORDER_COLUMN_ALIGN.end },
  { id: 'action', labelKey: null, align: WORK_ORDER_COLUMN_ALIGN.end },
] as const

export type WorkOrderSalonMock = {
  id: string
  name: string
  address: string
}

export type WorkOrderServiceLineMock = {
  id: string
  name: string
  price: number
  durationMin: number
  isAddOn: boolean
}

export type WorkOrderTicketMock = {
  id: string
  code: string
  salonId: string
  time: string
  customerName: string
  serviceName: string
  status: WorkOrderTicketStatus
  station: string
  beeper: string
  services: WorkOrderServiceLineMock[]
  notes: string | null
}

export function staffWorkOrdersPath(salonId?: string, ticketId?: string) {
  return ['/staff', STAFF_WORK_ORDERS_SCREEN, salonId, ticketId]
    .filter((segment): segment is string => Boolean(segment))
    .join('/')
}
