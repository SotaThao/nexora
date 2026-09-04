import { PosOrderStatus } from '../../../constants/posOrderStatus'
import type {
  StaffWorkOrderDetail,
  StaffWorkOrderItem,
  StaffWorkOrderListItem,
} from '../../../data/repositories/staffWorkOrders'
import { STAFF_WORK_ORDERS_SCREEN } from '../constants'

export type WorkOrderSalon = {
  id: string
  name: string
  address: string
  timeZone?: string | null
}
export type WorkOrderListItem = StaffWorkOrderListItem
export type WorkOrderDetail = StaffWorkOrderDetail
export type WorkOrderItem = StaffWorkOrderItem

export const WORK_ORDERS_I18N = {
  breadcrumbWorkspace: 'staff_dashboard.work_orders.breadcrumb_workspace',
  breadcrumbSalon: 'staff_dashboard.work_orders.breadcrumb_salon',
  chooseTitle: 'staff_dashboard.work_orders.choose_title',
  chooseSubtitle: 'staff_dashboard.work_orders.choose_subtitle',
  pageTitle: 'staff_dashboard.titles.work-orders',
  prevDay: 'staff_dashboard.work_orders.prev_day',
  nextDay: 'staff_dashboard.work_orders.next_day',
  pickDate: 'staff_dashboard.work_orders.pick_date',
  prevMonth: 'staff_dashboard.work_orders.prev_month',
  nextMonth: 'staff_dashboard.work_orders.next_month',
  ticketCount: 'staff_dashboard.work_orders.ticket_count',
  changeSalon: 'staff_dashboard.work_orders.change_salon',
  upNext: 'staff_dashboard.work_orders.up_next',
  newAssignment: 'staff_dashboard.work_orders.new_assignment',
  viewTicket: 'staff_dashboard.work_orders.view_ticket',
  featuredTicket: 'staff_dashboard.work_orders.featured_ticket',
  empty: 'staff_dashboard.work_orders.empty',
  emptyTitle: 'staff_dashboard.work_orders.empty_title',
  emptyHint: 'staff_dashboard.work_orders.empty_hint',
  emptyMoreTitle: 'staff_dashboard.work_orders.empty_more_title',
  emptyMoreHint: 'staff_dashboard.work_orders.empty_more_hint',
  selectTicket: 'staff_dashboard.work_orders.select_ticket',
  selectTicketHint: 'staff_dashboard.work_orders.select_ticket_hint',
  removeService: 'staff_dashboard.work_orders.remove_service',
  durationStation: 'staff_dashboard.work_orders.duration_station',
  emptySalons: 'staff_dashboard.work_orders.empty_salons',
  emptySalonsBody: 'staff_dashboard.work_orders.empty_salons_body',
  loading: 'staff_dashboard.work_orders.loading',
  loadError: 'staff_dashboard.work_orders.load_error',
  detailUnavailable: 'staff_dashboard.work_orders.detail_unavailable',
  notAssignedToYou: 'staff_dashboard.work_orders.not_assigned_to_you',
  retry: 'staff_dashboard.work_orders.retry',
  technicianNamed: 'staff_dashboard.work_orders.technician_named',
  unassigned: 'staff_dashboard.work_orders.unassigned',
  filterAll: 'staff_dashboard.work_orders.filter_all',
  statusAssigned: 'staff_dashboard.work_orders.status_assigned',
  statusInService: 'staff_dashboard.work_orders.status_in_service',
  statusCompleted: 'staff_dashboard.work_orders.status_completed',
  statusCancelled: 'staff_dashboard.work_orders.status_cancelled',
  detailTitle: 'staff_dashboard.work_orders.detail_title',
  back: 'staff_dashboard.work_orders.back',
  customer: 'staff_dashboard.work_orders.customer',
  station: 'staff_dashboard.work_orders.station',
  beeper: 'staff_dashboard.work_orders.beeper',
  today: 'staff_dashboard.work_orders.today',
  services: 'staff_dashboard.work_orders.services',
  addService: 'staff_dashboard.work_orders.add_service',
  addCustomService: 'staff_dashboard.work_orders.add_custom_service',
  changeService: 'staff_dashboard.work_orders.change_service',
  changeServiceAction: 'staff_dashboard.work_orders.change_service_action',
  addOn: 'staff_dashboard.work_orders.add_on',
  addOnNested: 'staff_dashboard.work_orders.add_on_nested',
  colService: 'staff_dashboard.work_orders.col_service',
  colPrice: 'staff_dashboard.work_orders.col_price',
  colTime: 'staff_dashboard.work_orders.col_time',
  durationMinutes: 'staff_dashboard.work_orders.duration_minutes',
  serviceTotal: 'staff_dashboard.work_orders.service_total',
  startService: 'staff_dashboard.work_orders.start_service',
  completeService: 'staff_dashboard.work_orders.complete_service',
  completeServiceTitle: 'staff_dashboard.work_orders.complete_service_title',
  completeReadyTitle: 'staff_dashboard.work_orders.complete_ready_title',
  completeReadyBody: 'staff_dashboard.work_orders.complete_ready_body',
  suggestedNotes: 'staff_dashboard.work_orders.suggested_notes',
  additionalNote: 'staff_dashboard.work_orders.additional_note',
  optional: 'staff_dashboard.work_orders.optional',
  additionalNotePlaceholder: 'staff_dashboard.work_orders.additional_note_placeholder',
  confirmCompletion: 'staff_dashboard.work_orders.confirm_completion',
  closeCompleteModal: 'staff_dashboard.work_orders.close_complete_modal',
  cancel: 'common.cancel',
  startServiceSuccess: 'staff_dashboard.work_orders.start_service_success',
  completeServiceSuccess: 'staff_dashboard.work_orders.complete_service_success',
  notesImportant: 'staff_dashboard.work_orders.notes_important',
  customerNotes: 'staff_dashboard.work_orders.customer_notes',
  pickerAddTitle: 'staff_dashboard.work_orders.picker_add_title',
  pickerEditTitle: 'staff_dashboard.work_orders.picker_edit_title',
  pickerAddSubtitle: 'staff_dashboard.work_orders.picker_add_subtitle',
  pickerEditSubtitle: 'staff_dashboard.work_orders.picker_edit_subtitle',
  pickerSearchPlaceholder: 'staff_dashboard.work_orders.picker_search_placeholder',
  pickerSearchAria: 'staff_dashboard.work_orders.picker_search_aria',
  pickerEmpty: 'staff_dashboard.work_orders.picker_empty',
  pickerUncategorized: 'staff_dashboard.work_orders.picker_uncategorized',
  pickerLoading: 'staff_dashboard.work_orders.picker_loading',
  pickerNoneAssignable: 'staff_dashboard.work_orders.picker_none_assignable',
  pickerConfirmAdd: 'staff_dashboard.work_orders.picker_confirm_add',
  pickerConfirmEdit: 'staff_dashboard.work_orders.picker_confirm_edit',
  pickerClose: 'staff_dashboard.work_orders.picker_close',
  customTitle: 'staff_dashboard.work_orders.custom_title',
  customSubtitle: 'staff_dashboard.work_orders.custom_subtitle',
  customNameLabel: 'staff_dashboard.work_orders.custom_name_label',
  customNamePlaceholder: 'staff_dashboard.work_orders.custom_name_placeholder',
  customPriceLabel: 'staff_dashboard.work_orders.custom_price_label',
  customPricePlaceholder: 'staff_dashboard.work_orders.custom_price_placeholder',
  customDurationLabel: 'staff_dashboard.work_orders.custom_duration_label',
  customDurationPlaceholder: 'staff_dashboard.work_orders.custom_duration_placeholder',
  customError: 'staff_dashboard.work_orders.custom_error',
  customConfirm: 'staff_dashboard.work_orders.custom_confirm',
  customClose: 'staff_dashboard.work_orders.custom_close',
  approvalPending: 'staff_dashboard.work_orders.approval_pending',
  approvalApproved: 'staff_dashboard.work_orders.approval_approved',
  approvalRejected: 'staff_dashboard.work_orders.approval_rejected',
  approvalTitle: 'staff_dashboard.work_orders.approval_title',
  approvalCancel: 'staff_dashboard.work_orders.approval_cancel',
  approvalCopy: 'staff_dashboard.work_orders.approval_copy',
  approvalRemovedLabel: 'staff_dashboard.work_orders.approval_removed_label',
  approvalSaving: 'staff_dashboard.work_orders.approval_saving',
  approvalHelp: 'staff_dashboard.work_orders.approval_help',
  approvalCodePlaceholder: 'staff_dashboard.work_orders.approval_code_placeholder',
  approvalCodeAria: 'staff_dashboard.work_orders.approval_code_aria',
  approvalSubmit: 'staff_dashboard.work_orders.approval_submit',
  approvalError: 'staff_dashboard.work_orders.approval_error',
  removeAddOnWarning: 'staff_dashboard.work_orders.remove_addon_warning',
  completedNotesTitle: 'staff_dashboard.work_orders.completed_notes_title',
  completedNotesFallback: 'staff_dashboard.work_orders.completed_notes_fallback',
} as const

export const WORK_ORDER_COMPLETION_SUGGESTION_I18N = [
  'staff_dashboard.work_orders.suggestion_completed_as_requested',
  'staff_dashboard.work_orders.suggestion_shorter_finish',
  'staff_dashboard.work_orders.suggestion_follow_up',
  'staff_dashboard.work_orders.suggestion_sensitive_skin',
] as const

export const WORK_ORDER_TICKET_FILTER = {
  All: 'All',
  Assigned: 'Assigned',
  InService: PosOrderStatus.InService,
  Completed: PosOrderStatus.Completed,
} as const

export type WorkOrderTicketFilter =
  (typeof WORK_ORDER_TICKET_FILTER)[keyof typeof WORK_ORDER_TICKET_FILTER]

/** Assigned (Waiting) is the default tab — BE expands Waiting to Pending+Confirmed. */
export const WORK_ORDER_FILTER_STATUSES: Record<WorkOrderTicketFilter, PosOrderStatus[]> = {
  [WORK_ORDER_TICKET_FILTER.All]: [
    PosOrderStatus.Waiting,
    PosOrderStatus.InService,
    PosOrderStatus.Completed,
    PosOrderStatus.Pending,
    PosOrderStatus.Confirmed,
  ],
  [WORK_ORDER_TICKET_FILTER.Assigned]: [PosOrderStatus.Waiting],
  [WORK_ORDER_TICKET_FILTER.InService]: [PosOrderStatus.InService],
  [WORK_ORDER_TICKET_FILTER.Completed]: [PosOrderStatus.Completed],
}

export const WORK_ORDER_STATUS_I18N: Record<PosOrderStatus, string> = {
  [PosOrderStatus.Waiting]: WORK_ORDERS_I18N.statusAssigned,
  [PosOrderStatus.InService]: WORK_ORDERS_I18N.statusInService,
  [PosOrderStatus.Completed]: WORK_ORDERS_I18N.statusCompleted,
  [PosOrderStatus.Cancelled]: WORK_ORDERS_I18N.statusCancelled,
  [PosOrderStatus.Pending]: WORK_ORDERS_I18N.statusAssigned,
  [PosOrderStatus.Confirmed]: WORK_ORDERS_I18N.statusAssigned,
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

export const WORK_ORDER_STATUS_BADGE_CLASS: Record<PosOrderStatus, string> = {
  [PosOrderStatus.Waiting]: 'bg-[#EEF0FF] text-nexoraBrand',
  [PosOrderStatus.InService]: 'bg-[#FFF3D6] text-[#B76000]',
  [PosOrderStatus.Completed]: 'bg-[#E5F9F0] text-[#008655]',
  [PosOrderStatus.Cancelled]: 'bg-rose-50 text-rose-600',
  [PosOrderStatus.Pending]: 'bg-[#EEF0FF] text-nexoraBrand',
  [PosOrderStatus.Confirmed]: 'bg-[#EEF0FF] text-nexoraBrand',
}

/** Start Service is shown for assigned tickets; enabled only once the appointment day has arrived. */
export const WORK_ORDER_STARTABLE_STATUSES: PosOrderStatus[] = [
  PosOrderStatus.Waiting,
  PosOrderStatus.Pending,
  PosOrderStatus.Confirmed,
]

/** Mobile-first type; `sm` tablets, `lg` staff desktop shell (1024px). */
export const WORK_ORDERS_LAYOUT_CLASS = {
  breadcrumbRow: 'flex min-h-9 items-center gap-1 sm:min-h-10',
  breadcrumbBack:
    '-ml-1 inline-flex min-h-9 items-center gap-0.5 rounded-lg py-1 pr-2 text-xs font-medium text-nexoraSubtle transition hover:bg-nexoraCanvas hover:text-nexoraText sm:min-h-10 sm:text-sm',
  breadcrumbIcon: 'h-4 w-4 shrink-0 sm:h-5 sm:w-5',
  breadcrumbCurrent: 'text-xs font-medium text-nexoraSubtle sm:text-sm',
  title: 'mt-2 text-lg font-extrabold tracking-tight text-nexoraText sm:text-xl lg:mt-3 lg:text-2xl',
  subtitle: 'mt-1.5 text-xs leading-relaxed text-nexoraMuted sm:text-sm lg:mt-2',
  list: 'mt-5 space-y-2.5 lg:mt-8 lg:space-y-3',
  card: 'flex w-full items-center gap-3 rounded-2xl border border-nexoraBorder bg-white px-3.5 py-3 text-left shadow-sm transition hover:border-nexoraBrand/20 hover:shadow-md lg:gap-3.5 lg:px-4 lg:py-3.5',
  iconWrap: 'grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-nexoraBrandSoft text-nexoraBrand sm:h-11 sm:w-11',
  storeIcon: 'h-4 w-4 sm:h-5 sm:w-5',
  salonName: 'block truncate text-sm font-extrabold text-nexoraText sm:text-base',
  addressRow: 'mt-0.5 flex items-center gap-1 text-xs text-nexoraMuted sm:text-sm',
  pinIcon: 'h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5',
  chevronIcon: 'h-4 w-4 shrink-0 text-nexoraSubtle sm:h-5 sm:w-5',
  ticketsTitleRow: 'mb-[18px] flex items-start justify-between gap-4',
  ticketsTitle: 'truncate text-[24px] font-black leading-[1.15] text-nexoraText',
  ticketsSalon: 'mt-[3px] text-xs font-semibold text-nexoraSubtle',
  countBadge: 'inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#e9eaff] px-2 text-xs font-black text-nexoraBrand',
  workspaceKicker: 'mb-1.5 text-[11px] font-bold text-nexoraSubtle',
  workspaceSalon: 'flex min-w-0 items-center gap-3',
  workspaceAvatar: 'hidden',
  workspaceSalonButton:
    'border-0 bg-transparent p-0 text-left text-xs font-extrabold text-nexoraBrand',
  workspaceHeadActions: 'flex items-center gap-2.5',
  changeSalon: 'hidden',
  summaryRow: 'hidden',
  summaryCard:
    'flex items-center gap-2.5 rounded-[13px] border border-nexoraBorder bg-white px-3.5 py-3 shadow-sm',
  summaryIcon: 'grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px]',
  summaryIconAssigned: 'bg-[#eef0ff] text-nexoraBrand',
  summaryIconService: 'bg-[#fff6df] text-[#d97706]',
  summaryIconCompleted: 'bg-[#e8faf2] text-[#009c62]',
  summaryValue: 'text-[19px] font-black leading-none text-nexoraText',
  summaryLabel: 'mt-1 text-[11px] font-bold uppercase text-nexoraSubtle',
  dateNav: 'relative flex w-full min-w-0 items-center gap-2',
  dateNavRow: 'flex min-w-0 flex-1 items-center gap-2',
  dateNavButton:
    'grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border border-[#d6daf5] bg-white text-nexoraBrand shadow-[0_7px_18px_rgba(31,42,86,0.045)] transition hover:bg-[#eef0ff]',
  dateNavLabel:
    'inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] border border-[#d6daf5] bg-white px-3 text-xs font-extrabold text-nexoraText shadow-[0_7px_18px_rgba(31,42,86,0.045)]',
  dateNavIcon: 'h-4 w-4 text-nexoraBrand',
  dateNavChevron: 'h-[15px] w-[15px]',
  dateToday:
    'inline-flex h-12 shrink-0 items-center justify-center rounded-[14px] border border-[#d6daf5] bg-white px-3.5 text-[11px] font-extrabold text-nexoraBrand shadow-[0_7px_18px_rgba(31,42,86,0.045)] transition hover:border-nexoraBrand hover:bg-[#f6f6ff]',
  calendarPopover: 'absolute left-0 right-0 z-30 mt-2 w-full rounded-2xl border border-nexoraBorder bg-white p-3 shadow-lg lg:left-1/2 lg:right-auto lg:w-[min(18rem,calc(100%-0.5rem))] lg:-translate-x-1/2',
  calendarNav: 'mb-2 flex items-center justify-between gap-2',
  calendarNavButton:
    'grid h-9 w-9 place-items-center rounded-xl text-nexoraMuted transition hover:bg-nexoraCanvas hover:text-nexoraText',
  calendarMonth: 'text-sm font-extrabold text-nexoraText sm:text-base',
  calendarWeekdays: 'grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wide text-nexoraSubtle sm:text-xs',
  calendarGrid: 'mt-1 grid grid-cols-7 gap-0.5',
  calendarDay: 'grid h-9 w-full place-items-center rounded-full text-xs font-bold transition sm:h-10 sm:text-sm',
  calendarDayIdle: 'text-nexoraText hover:bg-nexoraCanvas',
  calendarDayToday: 'text-nexoraBrand ring-1 ring-nexoraBrand/40 hover:bg-nexoraBrandSoft',
  calendarDaySelected: 'bg-nexoraBrand text-white',
  calendarDaySpacer: 'h-9 sm:h-10',
  filterBar: 'mb-[14px] flex flex-col gap-3',
  filterTab:
    'inline-flex min-h-[38px] shrink-0 items-center gap-[7px] whitespace-nowrap rounded-full border px-3 text-[11px] font-extrabold',
  filterTabActive: 'shadow-[0_7px_16px_rgba(70,72,216,0.1)]',
  filterTabInactive: '',
  statusCount: 'inline-flex h-[21px] min-w-[21px] items-center justify-center rounded-full px-1.5 text-[11px] font-black',
  statusTabs: 'flex w-full gap-2 overflow-x-auto p-px nexora-no-scrollbar',
  ordersLayout: 'block',
  ordersPanel: '',
  ordersPanelHead: 'mb-[11px]',
  ordersPanelTitle: 'text-[11px] font-extrabold text-[#62708a]',
  ordersCount: 'hidden',
  featuredSlot: 'mb-[18px]',
  featuredCard:
    'overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#3245b8_0%,#6738f2_100%)] p-[18px] text-white shadow-[0_18px_34px_rgba(70,72,216,0.24)]',
  featuredTop: 'flex items-center justify-between gap-2.5',
  featuredEyebrow: 'text-[11px] font-extrabold uppercase tracking-[0.04em]',
  featuredStatus:
    'inline-flex min-h-6 items-center rounded-full border border-white/[.24] bg-white/[.14] px-[9px] text-[11px] font-extrabold',
  featuredTitle: 'mt-2.5 text-[19px] font-black tracking-[-0.02em] text-white',
  featuredService: 'mt-[5px] text-xs font-semibold text-white/[.82]',
  featuredNote:
    'mb-[13px] mt-[15px] rounded-xl border border-white/[.18] bg-white/10 px-3 py-[11px] text-[11px] font-semibold leading-[1.45] text-white',
  featuredButton:
    'h-10 w-full rounded-xl border-0 bg-white text-xs font-black text-nexoraBrand shadow-[0_8px_18px_rgba(24,27,90,0.16)]',
  listMeta: 'mt-4 flex items-center justify-between text-xs font-medium text-nexoraSubtle lg:mt-5 sm:text-sm',
  ticketList: 'flex flex-col gap-[9px]',
  ticketCard:
    'min-h-[84px] w-full rounded-2xl border border-nexoraBorder bg-white p-3.5 text-left shadow-[0_8px_20px_rgba(15,23,42,0.055)] transition hover:border-nexoraBrand/45',
  ticketCardActive: 'border-nexoraBorder bg-white shadow-none',
  ticketCardTop: 'grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-[9px]',
  ticketTime: 'flex flex-col text-[11px] font-black text-nexoraText',
  ticketTimeValue: 'text-sm leading-[1.1]',
  ticketTimePeriod: 'mt-1 text-[11px] font-extrabold text-nexoraSubtle',
  ticketChevron: 'mt-1 h-4 w-4 shrink-0 text-nexoraSubtle sm:h-5 sm:w-5',
  ticketHeadRow: 'flex items-start justify-between gap-2',
  ticketCustomer: 'block min-w-0 truncate text-[13px] font-extrabold text-nexoraText',
  ticketService: 'mt-1.5 block truncate text-[11px] font-semibold text-nexoraMuted',
  ticketMeta: 'mt-[7px] flex flex-wrap items-center gap-x-[13px] gap-y-1.5 text-[11px] font-bold text-nexoraMuted',
  ticketMetaIcon: 'h-3 w-3 shrink-0 text-nexoraBrand',
  ticketBadge: 'inline-flex min-h-6 shrink-0 items-center rounded-full px-[9px] text-[11px] font-extrabold whitespace-nowrap',
  customerPhone: 'hidden font-semibold text-nexoraSubtle',
  detailPage:
    'overflow-hidden rounded-[17px] border border-nexoraBorder bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)]',
  detailHeader:
    'flex items-center justify-between gap-3 border-b border-nexoraRule px-[18px] py-[15px]',
  detailHeadMain: 'flex min-w-0 items-center gap-2.5',
  detailBack:
    'grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg border-0 bg-transparent text-nexoraMuted transition hover:bg-nexoraCanvas',
  detailBackIcon: 'h-[18px] w-[18px]',
  detailTitleWrap: 'min-w-0 flex-1',
  detailTitle: 'text-[15px] font-black leading-5 text-nexoraText',
  detailCode: 'mt-[3px] text-[11px] font-bold tracking-[0.03em] text-nexoraSubtle',
  detailBadge: 'inline-flex min-h-6 shrink-0 items-center rounded-full px-[9px] text-[11px] font-extrabold whitespace-nowrap',
  detailBody: 'px-[18px] pb-5 pt-[17px]',
  detailEmpty:
    'hidden min-h-[420px] flex-col items-center justify-center px-10 py-10 text-center text-nexoraSubtle lg:flex',
  detailEmptyIcon: 'mb-3 h-[34px] w-[34px] text-[#b4bdd0]',
  detailEmptyTitle: 'text-sm font-extrabold text-nexoraMuted',
  detailEmptyHint: 'mt-1 text-[11px]',
  customerCard: 'border-b border-nexoraRule pb-[17px]',
  customerRow: 'flex items-center gap-3',
  avatar:
    'grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#cbd0ff] bg-[#eef0ff] text-xs font-black text-nexoraBrand',
  customerLabel: 'text-[11px] font-extrabold text-nexoraBrand',
  customerName: 'mt-1 text-base font-black tracking-tight text-nexoraText',
  servicesCard: 'pt-[18px]',
  servicesTitleRow: 'mb-2.5 flex flex-wrap items-center justify-between gap-2',
  servicesTitle: 'text-[13px] font-black text-nexoraText',
  serviceHeadActions: 'flex flex-wrap justify-end gap-1.5',
  addServiceButton:
    'inline-flex min-h-[30px] items-center justify-center gap-1 rounded-lg border border-[#cfd5e3] bg-white px-2.5 text-[11px] font-extrabold text-nexoraBrand transition hover:border-nexoraBrand hover:bg-[#f7f7ff]',
  addServiceLink: 'cursor-not-allowed select-none text-sm font-semibold text-nexoraBrand/40',
  addOnLink: 'block cursor-not-allowed select-none text-right text-sm font-semibold whitespace-nowrap text-nexoraBrand/40',
  serviceTable: 'w-full min-w-0 border-t border-nexoraRule',
  serviceColPrice: '',
  serviceColTime: '',
  serviceColAction: '',
  serviceHeadCell: 'text-[11px] font-extrabold text-nexoraSubtle',
  serviceHeadCellEnd: 'text-right text-[11px] font-extrabold text-nexoraSubtle',
  serviceTableHead:
    'grid grid-cols-[minmax(0,1fr)_60px_52px] gap-x-2 py-2 text-[11px] font-extrabold text-nexoraSubtle md:grid-cols-[minmax(0,1fr)_60px_52px_auto]',
  serviceTableHeadRead:
    'grid grid-cols-[minmax(0,1fr)_60px_52px] gap-x-2 py-2 text-[11px] font-extrabold text-nexoraSubtle',
  serviceRow:
    'grid grid-cols-[minmax(0,1fr)_60px_52px] items-start gap-x-2 gap-y-2 border-b border-nexoraRule py-3',
  serviceRowEdit:
    'grid grid-cols-[minmax(0,1fr)_60px_52px] items-start gap-x-2 gap-y-2 border-b border-nexoraRule py-3 md:grid-cols-[minmax(0,1fr)_60px_52px_auto] md:items-center',
  serviceNameCell: 'min-w-0',
  serviceNumCell: 'pt-0.5 text-right tabular-nums whitespace-nowrap',
  serviceActionCell: 'col-span-3 flex justify-end md:col-span-1 md:pl-2',
  servicePrice: 'text-[11px] font-extrabold text-nexoraText',
  serviceDuration: 'text-[11px] font-bold text-nexoraMuted',
  serviceNameRow: 'flex min-w-0 items-center gap-[5px]',
  serviceAddOnName: 'flex min-w-0 items-center gap-[5px] pl-3 text-xs font-extrabold text-nexoraText',
  serviceAddOnIcon: 'h-3.5 w-3.5 shrink-0 text-nexoraBrand',
  serviceActionGroup: 'inline-flex flex-wrap items-center justify-end gap-1',
  serviceChangeButton:
    'inline-flex min-h-[30px] items-center justify-center rounded-lg border border-[#c9cafa] bg-[#f6f6ff] px-2.5 text-[11px] font-extrabold whitespace-nowrap text-nexoraBrand transition hover:border-nexoraBrand hover:bg-[#ececff]',
  serviceRemoveButton:
    'inline-flex min-h-[30px] items-center justify-center rounded-lg border border-[#f3c9cd] bg-[#fff7f7] px-2.5 text-[11px] font-extrabold whitespace-nowrap text-[#c9434f] transition hover:border-[#e57d86] hover:bg-[#ffeded]',
  approvalPill: 'inline-flex h-[19px] shrink-0 items-center rounded-full px-[7px] text-[10px] font-extrabold uppercase leading-none whitespace-nowrap',
  approvalPillPending: 'bg-[#FFF3D6] text-[#AD5A00]',
  approvalPillApproved: 'bg-[#E5F9F0] text-[#008655]',
  approvalPillRejected: 'bg-[#FEECEC] text-[#D42D2D]',
  modalCardWide: 'nexora-modal-card w-full max-w-lg rounded-b-none p-0 sm:rounded-2xl',
  modalSubtitle: 'mt-1 text-xs font-semibold text-nexoraSubtle',
  pickerSearchWrap: 'relative block',
  pickerSearchIcon: 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraSubtle',
  pickerSearchInput:
    'h-11 w-full rounded-[10px] border border-nexoraBorder bg-nexoraCanvas py-0 pl-9 pr-3 text-sm text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand',
  pickerList: 'mt-3 max-h-[min(52vh,27rem)] space-y-4 overflow-y-auto pr-0.5',
  pickerCategory: 'mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-nexoraSubtle',
  pickerOptions: 'space-y-1.5',
  pickerOption:
    'grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[11px] border border-nexoraBorder bg-white px-2.5 py-2.5 text-left transition hover:border-nexoraBrand/40 hover:bg-[#FBFBFF]',
  pickerOptionSelected: 'border-nexoraBrand bg-[#F4F4FF] shadow-[0_0_0_1px_rgba(70,72,216,0.08)]',
  pickerRadio: 'inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-[#BBC4D4]',
  pickerRadioSelected: 'border-nexoraBrand after:block after:h-2 after:w-2 after:rounded-full after:bg-nexoraBrand',
  pickerOptionName: 'block text-sm font-extrabold text-nexoraText',
  pickerOptionMeta: 'mt-0.5 block text-[11px] font-medium text-nexoraSubtle',
  pickerOptionPrice: 'text-sm font-black tabular-nums text-nexoraText',
  pickerEmpty: 'px-3 py-8 text-center text-xs font-medium text-nexoraSubtle',
  customFields: 'grid grid-cols-1 gap-3 sm:grid-cols-2',
  customFieldFull: 'sm:col-span-2',
  customLabel: 'mb-1.5 block text-xs font-extrabold text-nexoraText',
  customInput:
    'h-11 w-full rounded-[10px] border border-nexoraBorder bg-white px-3 text-sm text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand',
  fieldError: 'mt-2 text-xs font-bold text-nexoraDanger',
  approvalCard: 'mt-4 rounded-[13px] border border-[#F4B826] bg-[#FFFBEB] px-3.5 py-3.5 text-[#8D380C]',
  approvalHead: 'flex items-center justify-between gap-2.5',
  approvalTitle: 'inline-flex items-center gap-1.5 text-sm font-black',
  approvalCancel:
    'border-0 bg-transparent p-1 text-[11px] font-extrabold text-[#8D380C] underline-offset-2 hover:underline',
  approvalCopy: 'mt-1 text-[11px] font-bold leading-snug',
  approvalServices: 'mt-2 flex flex-col gap-1.5',
  approvalChip:
    'flex min-h-7 items-center justify-between gap-2 rounded-[9px] bg-white px-2.5 text-[11px] font-extrabold text-[#8D380C]',
  approvalHelp: 'mt-1.5 text-[11px] font-bold leading-snug text-nexoraMuted',
  approvalForm: 'mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7.5rem]',
  approvalInput:
    'h-11 w-full rounded-[11px] border border-nexoraBorder bg-white px-3 text-center text-base font-extrabold tracking-[0.22em] text-nexoraText outline-none placeholder:text-sm placeholder:tracking-[0.18em] placeholder:text-nexoraSubtle focus:border-nexoraBrand',
  approvalSubmit:
    'inline-flex h-11 items-center justify-center gap-1.5 rounded-[11px] bg-nexoraBrand px-3 text-[11px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50',
  serviceTotalRow: 'flex items-center justify-between border-b border-nexoraRule py-3.5',
  serviceTotalLabel: 'text-xs font-semibold text-nexoraMuted',
  serviceTotalValue: 'text-sm font-black tabular-nums text-nexoraText',
  detailActions: 'mt-4 flex flex-wrap gap-2',
  primaryAction:
    'order-first inline-flex min-h-[46px] flex-1 basis-full items-center justify-center gap-[7px] rounded-[10px] border border-transparent bg-[linear-gradient(100deg,#315cff,#6c32ef)] px-3.5 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(70,72,216,0.22)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:shrink-0',
  primaryActionGlyph: 'h-[18px] w-[18px] shrink-0',
  modalOverlay:
    'fixed inset-0 z-[60] flex items-end justify-center bg-nexoraText/55 p-0 backdrop-blur-sm sm:items-center sm:p-4',
  modalCard: 'nexora-modal-card w-full max-w-md rounded-b-none p-0 sm:rounded-2xl',
  modalHeader: 'flex shrink-0 items-start justify-between gap-3 border-b border-nexoraRule px-5 py-4',
  modalKicker: 'text-xs font-semibold text-nexoraBrand',
  modalTitle: 'mt-0.5 text-lg font-extrabold text-nexoraText sm:text-xl',
  modalClose:
    'grid h-9 w-9 shrink-0 place-items-center rounded-full text-nexoraMuted transition hover:bg-nexoraCanvas hover:text-nexoraText',
  modalBody: 'flex-1 space-y-4 overflow-y-auto px-5 py-5',
  modalHero: 'text-center',
  modalHeroIcon: 'mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600',
  modalHeroTitle: 'mt-3 text-base font-extrabold text-nexoraText sm:text-lg',
  modalHeroBody: 'mt-1 text-sm leading-relaxed text-nexoraMuted',
  modalSectionTitle: 'text-sm font-extrabold text-nexoraText',
  modalChipRow: 'mt-2 flex flex-wrap gap-2',
  modalChip:
    'rounded-full border px-3.5 py-2 text-left text-xs font-semibold transition sm:text-sm',
  modalChipIdle: 'border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand/40',
  modalChipActive: 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand',
  modalNoteHead: 'flex items-center justify-between gap-2',
  modalOptional: 'text-xs font-medium text-nexoraSubtle',
  modalTextarea:
    'mt-2 min-h-[6.5rem] w-full resize-none rounded-xl border border-nexoraBorder bg-white px-3.5 py-3 text-sm text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand',
  modalFooter:
    'flex shrink-0 gap-3 border-t border-nexoraRule px-5 py-4',
  modalCancel:
    'inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-nexoraBorder bg-white px-4 text-sm font-bold text-nexoraText transition hover:bg-nexoraCanvas disabled:opacity-60',
  modalConfirm:
    'inline-flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-nexoraBrand px-4 text-sm font-extrabold text-white transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50',
  modalConfirmIcon: 'grid h-5 w-5 place-items-center rounded-full bg-white/20',
  notesCard:
    'mt-4 flex items-start gap-[9px] rounded-[11px] border border-[#f3c98e] bg-[#fff8ef] px-3.5 py-[13px] text-[11px] font-semibold leading-normal text-[#596178]',
  notesIcon: 'mt-0.5 h-3.5 w-3.5 shrink-0 text-[#d58b0a]',
  notesKicker: 'text-[11px] font-extrabold text-[#b46909]',
  notesTitle: 'mb-0.5 block text-[11px] font-black text-nexoraText',
  notesBody: 'text-[11px] font-semibold leading-snug text-[#596178]',
  completedNote: 'mt-4 rounded-[11px] border border-[#CCEBDD] bg-[#F0FBF6] px-3 py-3',
  completedNoteTitle: 'inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#00794C]',
  completedNoteIcon: 'h-3.5 w-3.5 shrink-0',
  completedNoteBody: 'mt-1.5 text-[11px] font-semibold leading-relaxed text-[#2D6450]',
  page: 'w-full',
  grow: 'min-w-0 flex-1',
  truncate: 'min-w-0 truncate',
  metaChip: 'inline-flex items-center gap-1',
  iconSm: 'h-4 w-4',
  iconMd: 'h-5 w-5',
  ticketEmpty: 'px-5 py-12 text-center text-nexoraSubtle',
  emptyTitle: 'block text-[13px] font-extrabold text-nexoraMuted',
  emptyBody: 'mt-1.5 block text-[11px] leading-snug',
  emptyIcon: 'mx-auto mb-2 h-[27px] w-[27px]',
  chrome: '',
  hideOnDetailMobile: 'hidden',
  emptyInline: 'mt-3 text-sm text-nexoraMuted sm:text-base',
  serviceName: 'min-w-0 truncate text-xs font-extrabold text-nexoraText',
  serviceTech: 'mt-0.5 text-[11px] font-semibold leading-snug text-nexoraSubtle',
  itemNote: 'mt-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-nexoraText sm:text-sm',
  errorCard: 'rounded-2xl border border-rose-200 bg-rose-50 px-4 py-10 text-center',
  errorText: 'text-sm font-bold text-nexoraDanger sm:text-base',
  retryButton: 'mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-nexoraBrand px-4 text-sm font-bold text-white sm:h-11',
  paddedBlock: 'px-4 py-6',
  textLeft: 'text-left',
  srOnly: 'sr-only',
  iconFill: 'fill-current',
  skeletonGapRow: 'mt-2 flex gap-3',
  skeletonMetaWrap: 'mt-2 flex flex-wrap gap-3',
  skeletonServiceList: 'mt-4 space-y-3',
  skeletonServiceRow: 'flex items-center justify-between gap-3',
  skeletonMt2: 'mt-2',
  skeletonMt3: 'mt-3',
  skeletonMt4: 'mt-4',
  skeletonFlex: 'flex-1',
} as const

export const WORK_ORDERS_BREADCRUMB_SEPARATOR = ' · '
export const WORK_ORDER_WEEKDAY_COUNT = 7
export const WORK_ORDER_MAX_INITIALS = 2
export const WORK_ORDER_KEYBOARD = { escape: 'Escape' } as const
export const WORK_ORDER_DATE_LOCALE = { vi: 'vi-VN', en: 'en-US' } as const
export const WORK_ORDER_VIETNAMESE_PREFIX = 'vi'
export const WORK_ORDER_WEEKDAY_SUNDAY = { year: 2024, month: 0, day: 7 } as const
export const WORK_ORDER_SERVICE_NAME_SEPARATOR = ' + '
export const WORK_ORDER_STATION_DIGITS = 2
export const WORK_ORDER_NUMBER_PREFIX = 'WO-'
export const WORK_ORDER_NUMBER_DIGITS = 4
export const WORK_ORDER_EMPTY_PLACEHOLDER = '_'
export const WORK_ORDER_COMPLETION_NOTE_MAX_LENGTH = 500
export const WORK_ORDER_COMPLETION_NOTE_SEPARATOR = '. '
/** Corner snack duration for add/change/custom/remove — blocking modal toast stays for errors. */
export const WORK_ORDER_TOAST_TYPE = {
  success: 'success',
  error: 'error',
} as const
export const WORK_ORDER_SKELETON_COUNT = {
  salons: 2,
  tickets: 3,
  services: 3,
  metaChips: 3,
  detailMetaChips: 2,
} as const
export const WORK_ORDER_INLINE_LIST_SEPARATOR = ', '
export const WORK_ORDER_NAME_SEPARATOR = ' '
export const WORK_ORDER_PAD_CHAR = '0'
export const WORK_ORDER_DEFAULT_LANGUAGE = 'en'
export const WORK_ORDER_MONEY = {
  locale: 'en-US',
  currency: 'USD',
  fractionDigits: 2,
} as const
export const WORK_ORDER_STATUS_BADGE_VARIANT = {
  ticket: 'ticket',
  detail: 'detail',
} as const
export type WorkOrderStatusBadgeVariant =
  (typeof WORK_ORDER_STATUS_BADGE_VARIANT)[keyof typeof WORK_ORDER_STATUS_BADGE_VARIANT]
export const WORK_ORDER_DATE_STEP = { day: 1, month: 1 } as const
export const STAFF_HOME_PATH = '/staff'

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

export function workOrderCompletionChipClass(isActive: boolean) {
  const state = isActive ? WORK_ORDERS_LAYOUT_CLASS.modalChipActive : WORK_ORDERS_LAYOUT_CLASS.modalChipIdle
  return `${WORK_ORDERS_LAYOUT_CLASS.modalChip} ${state}`
}

export function workOrderPickerOptionClass(isSelected: boolean) {
  return isSelected
    ? `${WORK_ORDERS_LAYOUT_CLASS.pickerOption} ${WORK_ORDERS_LAYOUT_CLASS.pickerOptionSelected}`
    : WORK_ORDERS_LAYOUT_CLASS.pickerOption
}

export function workOrderPickerRadioClass(isSelected: boolean) {
  return isSelected
    ? `${WORK_ORDERS_LAYOUT_CLASS.pickerRadio} ${WORK_ORDERS_LAYOUT_CLASS.pickerRadioSelected}`
    : WORK_ORDERS_LAYOUT_CLASS.pickerRadio
}

export const WORK_ORDER_APPROVAL_I18N = {
  pending: WORK_ORDERS_I18N.approvalPending,
  approved: WORK_ORDERS_I18N.approvalApproved,
  rejected: WORK_ORDERS_I18N.approvalRejected,
} as const

export const WORK_ORDER_APPROVAL_PILL_CLASS = {
  pending: `${WORK_ORDERS_LAYOUT_CLASS.approvalPill} ${WORK_ORDERS_LAYOUT_CLASS.approvalPillPending}`,
  approved: `${WORK_ORDERS_LAYOUT_CLASS.approvalPill} ${WORK_ORDERS_LAYOUT_CLASS.approvalPillApproved}`,
  rejected: `${WORK_ORDERS_LAYOUT_CLASS.approvalPill} ${WORK_ORDERS_LAYOUT_CLASS.approvalPillRejected}`,
} as const

export const WORK_ORDER_FILTER_TAB_STYLE: Record<
  Exclude<WorkOrderTicketFilter, typeof WORK_ORDER_TICKET_FILTER.All>,
  { idle: string; active: string; count: string }
> = {
  [WORK_ORDER_TICKET_FILTER.Assigned]: {
    idle: 'border-[#d8d4ff] bg-[#f2f0ff] text-[#5146c9]',
    active: 'border-[#8e84ee] bg-[#e9e6ff]',
    count: 'bg-[#dfdcff] text-[#5146c9]',
  },
  [WORK_ORDER_TICKET_FILTER.InService]: {
    idle: 'border-[#bdebf5] bg-[#edfbfe] text-[#087b96]',
    active: 'border-[#62cee3] bg-[#dff8fc]',
    count: 'bg-[#d3f3f9] text-[#087b96]',
  },
  [WORK_ORDER_TICKET_FILTER.Completed]: {
    idle: 'border-[#c8ecd9] bg-[#eefaf4] text-[#087b55]',
    active: 'border-[#74d2a5] bg-[#e0f7eb]',
    count: 'bg-[#d8f2e5] text-[#087b55]',
  },
}

export function workOrderFilterTabClass(tab: WorkOrderTicketFilter, isActive: boolean) {
  if (tab === WORK_ORDER_TICKET_FILTER.All) {
    const state = isActive ? 'active' : 'inactive'
    return `${WORK_ORDERS_LAYOUT_CLASS.filterTab} ${WORK_ORDER_FILTER_TAB_STATE_CLASS[state]}`
  }
  const style = WORK_ORDER_FILTER_TAB_STYLE[tab]
  const state = isActive
    ? `${style.idle} ${style.active} ${WORK_ORDERS_LAYOUT_CLASS.filterTabActive}`
    : style.idle
  return `${WORK_ORDERS_LAYOUT_CLASS.filterTab} ${state}`
}

export function workOrderFilterCountClass(tab: WorkOrderTicketFilter) {
  if (tab === WORK_ORDER_TICKET_FILTER.All) return WORK_ORDERS_LAYOUT_CLASS.statusCount
  return `${WORK_ORDERS_LAYOUT_CLASS.statusCount} ${WORK_ORDER_FILTER_TAB_STYLE[tab].count}`
}

export function workOrderServiceRowClass(canEdit: boolean) {
  return canEdit ? WORK_ORDERS_LAYOUT_CLASS.serviceRowEdit : WORK_ORDERS_LAYOUT_CLASS.serviceRow
}

export function workOrderServiceTableHeadClass(canEdit: boolean) {
  return canEdit ? WORK_ORDERS_LAYOUT_CLASS.serviceTableHead : WORK_ORDERS_LAYOUT_CLASS.serviceTableHeadRead
}

export function workOrderTicketCardClass(isActive: boolean) {
  return isActive
    ? `${WORK_ORDERS_LAYOUT_CLASS.ticketCard} ${WORK_ORDERS_LAYOUT_CLASS.ticketCardActive}`
    : WORK_ORDERS_LAYOUT_CLASS.ticketCard
}

export function workOrderStatusClass(
  status: PosOrderStatus,
  variant: WorkOrderStatusBadgeVariant,
): string {
  const sizeClass = variant === WORK_ORDER_STATUS_BADGE_VARIANT.ticket
    ? WORK_ORDERS_LAYOUT_CLASS.ticketBadge
    : WORK_ORDERS_LAYOUT_CLASS.detailBadge
  return `${sizeClass} ${WORK_ORDER_STATUS_BADGE_CLASS[status]}`
}

export function staffWorkOrdersPath(salonId?: string, ticketId?: string) {
  return [STAFF_HOME_PATH, STAFF_WORK_ORDERS_SCREEN, salonId, ticketId]
    .filter((segment): segment is string => Boolean(segment))
    .join('/')
}

export function staffWorkOrdersHref(
  salonId?: string,
  ticketId?: string,
  search?: string,
): string {
  const path = staffWorkOrdersPath(salonId, ticketId)
  const query = search?.replace(/^\?/, '').trim()
  return query ? `${path}?${query}` : path
}
