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
  empty: 'staff_dashboard.work_orders.empty',
  emptySalons: 'staff_dashboard.work_orders.empty_salons',
  emptySalonsBody: 'staff_dashboard.work_orders.empty_salons_body',
  loading: 'staff_dashboard.work_orders.loading',
  loadError: 'staff_dashboard.work_orders.load_error',
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
  approvalDemo: 'staff_dashboard.work_orders.approval_demo',
  approvalHelp: 'staff_dashboard.work_orders.approval_help',
  approvalCodePlaceholder: 'staff_dashboard.work_orders.approval_code_placeholder',
  approvalCodeAria: 'staff_dashboard.work_orders.approval_code_aria',
  approvalSubmit: 'staff_dashboard.work_orders.approval_submit',
  approvalError: 'staff_dashboard.work_orders.approval_error',
  toastAddService: 'staff_dashboard.work_orders.toast_add_service',
  toastChangeService: 'staff_dashboard.work_orders.toast_change_service',
  toastCustomService: 'staff_dashboard.work_orders.toast_custom_service',
  toastApproved: 'staff_dashboard.work_orders.toast_approved',
  toastCancelled: 'staff_dashboard.work_orders.toast_cancelled',
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
  ticketsTitleRow: 'mt-2 flex items-start justify-between gap-3 lg:mt-3',
  ticketsTitle: 'text-xl font-extrabold tracking-tight text-nexoraText sm:text-2xl lg:text-3xl',
  ticketsSalon: 'mt-1 text-sm font-extrabold text-nexoraBrand sm:text-base',
  countBadge: 'grid h-8 w-8 shrink-0 place-items-center rounded-full bg-nexoraBrandSoft text-xs font-extrabold text-nexoraBrand sm:h-9 sm:w-9 sm:text-sm',
  dateNav: 'relative mt-5 lg:mt-6',
  dateNavRow: 'flex items-center justify-between rounded-2xl border border-nexoraBorder bg-white px-2 py-2.5 shadow-sm lg:px-3',
  dateNavButton: 'grid h-9 w-9 place-items-center rounded-xl text-nexoraMuted transition hover:bg-nexoraCanvas hover:text-nexoraText sm:h-10 sm:w-10',
  dateNavLabel: 'inline-flex min-w-0 items-center gap-2 rounded-xl px-2 py-1 text-sm font-extrabold text-nexoraText transition hover:bg-nexoraCanvas sm:text-base',
  dateNavIcon: 'h-4 w-4 text-nexoraBrand sm:h-5 sm:w-5',
  calendarPopover: 'absolute left-1/2 z-30 mt-2 w-[min(18rem,calc(100%-0.5rem))] -translate-x-1/2 rounded-2xl border border-nexoraBorder bg-white p-3 shadow-lg',
  calendarNav: 'mb-2 flex items-center justify-between gap-2',
  calendarMonth: 'text-sm font-extrabold text-nexoraText sm:text-base',
  calendarWeekdays: 'grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wide text-nexoraSubtle sm:text-xs',
  calendarGrid: 'mt-1 grid grid-cols-7 gap-0.5',
  calendarDay: 'grid h-9 w-full place-items-center rounded-full text-xs font-bold transition sm:h-10 sm:text-sm',
  calendarDayIdle: 'text-nexoraText hover:bg-nexoraCanvas',
  calendarDayToday: 'text-nexoraBrand ring-1 ring-nexoraBrand/40 hover:bg-nexoraBrandSoft',
  calendarDaySelected: 'bg-nexoraBrand text-white',
  calendarDaySpacer: 'h-9 sm:h-10',
  filterBar: 'mt-3 flex gap-1 overflow-x-auto rounded-full border border-nexoraBorder bg-white p-1 shadow-sm nexora-no-scrollbar lg:mt-4',
  filterTab: 'min-w-0 flex-1 whitespace-nowrap rounded-full px-2 py-2 text-center text-xs font-bold transition sm:px-3 sm:text-sm',
  filterTabActive: 'bg-nexoraBrand text-white shadow-sm',
  filterTabInactive: 'bg-transparent text-nexoraSubtle hover:text-nexoraText',
  listMeta: 'mt-4 flex items-center justify-between text-xs font-medium text-nexoraSubtle lg:mt-5 sm:text-sm',
  ticketList: 'mt-2.5 space-y-2.5 lg:mt-3 lg:space-y-3',
  ticketCard: 'flex w-full items-start gap-3 rounded-2xl border border-nexoraBorder bg-white px-3.5 py-3.5 text-left shadow-sm transition hover:border-nexoraBrand/20 hover:shadow-md lg:gap-3.5 lg:px-4 lg:py-4',
  ticketTime: 'min-w-[4.75rem] shrink-0 whitespace-nowrap pt-0.5 text-left text-sm font-extrabold tabular-nums leading-5 text-nexoraBrand sm:min-w-[5.5rem] sm:text-base sm:leading-6',
  ticketChevron: 'mt-1 h-4 w-4 shrink-0 text-nexoraSubtle sm:h-5 sm:w-5',
  ticketHeadRow: 'flex items-start justify-between gap-2',
  ticketCustomer: 'block truncate text-sm font-extrabold leading-5 text-nexoraText sm:text-base sm:leading-6',
  ticketService: 'mt-0.5 block truncate text-xs text-nexoraMuted sm:text-sm',
  ticketMeta: 'mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-nexoraMuted sm:text-sm',
  ticketMetaIcon: 'h-3 w-3 shrink-0 text-nexoraBrand sm:h-3.5 sm:w-3.5',
  ticketBadge: 'inline-flex min-h-6 shrink-0 items-center rounded-full px-2.5 text-[10px] font-extrabold whitespace-nowrap',
  detailPage:
    '-mx-4 -mt-5 bg-white pb-8 sm:-mx-6 lg:mx-0 lg:mt-0 lg:overflow-hidden lg:rounded-3xl lg:border lg:border-nexoraBorder lg:shadow-sm',
  detailHeader: 'flex items-center gap-2 border-b border-nexoraRule px-4 py-3 sm:px-5',
  detailBack: 'grid h-10 w-10 shrink-0 place-items-center rounded-full text-nexoraText transition hover:bg-nexoraCanvas',
  detailTitleWrap: 'min-w-0 flex-1',
  detailTitle: 'text-lg font-extrabold leading-6 text-nexoraText sm:text-xl',
  detailCode: 'mt-0.5 text-sm text-nexoraSubtle',
  detailBadge: 'inline-flex min-h-6 shrink-0 items-center rounded-full px-2.5 text-[10px] font-extrabold whitespace-nowrap',
  customerCard: 'border-b border-nexoraRule px-4 py-4 sm:px-5 sm:py-5',
  customerRow: 'flex items-center gap-3.5 lg:gap-4',
  avatar: 'grid h-14 w-14 shrink-0 place-items-center rounded-full bg-nexoraBrandSoft text-sm font-extrabold text-nexoraBrand sm:h-16 sm:w-16 sm:text-base',
  customerLabel: 'text-xs font-medium text-nexoraMuted sm:text-sm',
  customerName: 'text-xl font-extrabold tracking-tight text-nexoraText sm:text-2xl',
  servicesCard: 'px-4 pt-5 sm:px-5',
  servicesTitleRow: 'flex items-center justify-between gap-3',
  servicesTitle: 'text-lg font-extrabold text-nexoraText',
  serviceHeadActions: 'flex flex-wrap justify-end gap-1.5',
  addServiceButton:
    'inline-flex min-h-8 items-center justify-center rounded-lg border border-nexoraBorder bg-white px-2.5 text-[11px] font-extrabold text-nexoraBrand transition hover:border-nexoraBrand hover:bg-nexoraBrandSoft',
  addServiceLink: 'cursor-not-allowed select-none text-sm font-semibold text-nexoraBrand/40',
  addOnLink: 'block cursor-not-allowed select-none text-right text-sm font-semibold whitespace-nowrap text-nexoraBrand/40',
  serviceTable: 'mt-4 w-full table-fixed border-collapse',
  serviceColPrice: 'w-[5.25rem] sm:w-[6rem]',
  serviceColTime: 'w-[4.75rem] sm:w-[5.5rem]',
  serviceColAction: 'w-[5.5rem] sm:w-[7rem] lg:w-[7.5rem]',
  serviceHeadCell: 'pb-2 text-xs font-medium text-nexoraSubtle',
  serviceHeadCellEnd: 'pb-2 text-right text-xs font-medium text-nexoraSubtle',
  serviceRow: 'border-t border-nexoraRule',
  serviceNameCell: 'min-w-0 overflow-hidden py-3.5 pr-2 align-middle',
  serviceNumCell: 'overflow-hidden py-3.5 align-middle text-right tabular-nums whitespace-nowrap text-ellipsis',
  serviceActionCell: 'overflow-hidden py-3.5 text-right align-middle',
  servicePrice: 'text-sm font-extrabold text-nexoraText',
  serviceDuration: 'text-sm text-nexoraMuted',
  serviceNameRow: 'flex min-w-0 items-center gap-1.5',
  serviceAddOnName: 'flex min-w-0 items-center gap-1.5 pl-3 text-sm font-medium text-nexoraText',
  serviceAddOnIcon: 'h-3.5 w-3.5 shrink-0 text-nexoraBrand',
  serviceChangeButton:
    'inline-flex min-h-7 max-w-full items-center justify-center truncate rounded-md px-1.5 text-[11px] font-extrabold whitespace-nowrap text-nexoraBrand transition hover:bg-nexoraBrandSoft sm:min-h-8 sm:px-2 sm:text-xs',
  approvalPill: 'inline-flex h-[19px] shrink-0 items-center rounded-full px-1.5 text-[8px] font-extrabold uppercase',
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
  approvalCard: 'mx-4 mt-4 rounded-[13px] border border-[#F4B826] bg-[#FFFBEB] px-3.5 py-3.5 text-[#8D380C] sm:mx-5',
  approvalHead: 'flex items-center justify-between gap-2.5',
  approvalTitle: 'inline-flex items-center gap-1.5 text-sm font-black',
  approvalCancel:
    'border-0 bg-transparent p-1 text-[11px] font-extrabold text-[#8D380C] underline-offset-2 hover:underline',
  approvalCopy: 'mt-1 text-[11px] font-bold leading-snug',
  approvalServices: 'mt-2 flex flex-col gap-1.5',
  approvalChip:
    'flex min-h-7 items-center justify-between gap-2 rounded-[9px] bg-white px-2.5 text-[11px] font-extrabold text-[#8D380C]',
  approvalDemo:
    'mt-2 flex min-h-9 items-center justify-center rounded-lg border border-nexoraBrand bg-white text-[11px] font-extrabold text-nexoraBrand',
  approvalHelp: 'mt-1.5 text-[11px] font-bold leading-snug text-nexoraMuted',
  approvalForm: 'mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7.5rem]',
  approvalInput:
    'h-11 w-full rounded-[11px] border border-nexoraBorder bg-white px-3 text-center text-base font-extrabold tracking-[0.22em] text-nexoraText outline-none placeholder:text-sm placeholder:tracking-[0.18em] placeholder:text-nexoraSubtle focus:border-nexoraBrand',
  approvalSubmit:
    'inline-flex h-11 items-center justify-center gap-1.5 rounded-[11px] bg-nexoraBrand px-3 text-[11px] font-extrabold text-white',
  serviceTotalRow: 'flex items-center justify-between border-t border-nexoraRule py-3.5',
  serviceTotalLabel: 'text-sm text-nexoraMuted sm:text-base',
  serviceTotalValue: 'text-lg font-extrabold tabular-nums text-nexoraText sm:text-xl',
  primaryAction:
    'mx-4 mt-4 inline-flex h-14 w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4F7CFF] to-[#7C5CFF] text-base font-extrabold text-white shadow-[0_10px_24px_rgba(79,124,255,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:mx-5 sm:w-[calc(100%-2.5rem)]',
  primaryActionIcon: 'grid h-6 w-6 place-items-center rounded-full bg-white/20',
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
  notesCard: 'mx-4 mt-4 rounded-2xl border border-[#F3D7A8] bg-[#FFF6E8] px-4 py-3.5 sm:mx-5',
  notesKicker: 'text-sm font-bold text-[#C47B2B]',
  notesTitle: 'mt-0.5 text-base font-extrabold text-nexoraText',
  notesBody: 'mt-1 text-sm leading-relaxed text-nexoraMuted sm:text-base',
  completedNote: 'mx-4 mt-4 rounded-[11px] border border-[#CCEBDD] bg-[#F0FBF6] px-3 py-3 sm:mx-5',
  completedNoteTitle: 'inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#00794C]',
  completedNoteIcon: 'h-3.5 w-3.5 shrink-0',
  completedNoteBody: 'mt-1.5 text-[11px] font-semibold leading-relaxed text-[#2D6450]',
  grow: 'min-w-0 flex-1',
  truncate: 'min-w-0 truncate',
  metaChip: 'inline-flex items-center gap-1',
  iconSm: 'h-4 w-4',
  iconMd: 'h-5 w-5',
  ticketEmpty: 'mt-2.5 rounded-2xl border border-dashed border-nexoraBorder bg-white px-4 py-10 text-center text-sm text-nexoraMuted sm:text-base',
  emptyTitle: 'font-semibold text-nexoraText',
  emptyBody: 'mt-1',
  emptyInline: 'mt-3 text-sm text-nexoraMuted sm:text-base',
  serviceName: 'truncate text-sm font-extrabold text-nexoraText sm:text-base',
  serviceTech: 'mt-0.5 truncate text-xs text-nexoraMuted sm:text-sm',
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
  pending: WORK_ORDERS_LAYOUT_CLASS.approvalPillPending,
  approved: WORK_ORDERS_LAYOUT_CLASS.approvalPillApproved,
  rejected: WORK_ORDERS_LAYOUT_CLASS.approvalPillRejected,
} as const

export function workOrderFilterTabClass(isActive: boolean) {
  const state = isActive ? 'active' : 'inactive'
  return `${WORK_ORDERS_LAYOUT_CLASS.filterTab} ${WORK_ORDER_FILTER_TAB_STATE_CLASS[state]}`
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
