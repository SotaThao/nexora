import { BookingUiSearchField, BookingUiStatus, isBookingUiStatus } from '../../../data/repositories/merchantVoice'

export enum BookingTodayViewMode {
  Table = 'table',
  Card = 'card',
}

/** Appointments list vs team calendar workspace (Booking Book subtabs). */
export enum BookingTodayLayout {
  Appointments = 'appointments',
  Calendar = 'calendar',
}

export enum BookingCalendarStatusGroup {
  Completed = 'completed',
  Upcoming = 'upcoming',
  Pending = 'pending',
  Cancelled = 'cancelled',
}

export const BOOKING_TODAY_VIEW_MODE_ORDER = [
  BookingTodayViewMode.Table,
  BookingTodayViewMode.Card,
] as const

/**
 * Below this width the calendar appointment side panel uses overlay presentation
 * (matches HTML `bookingAppointmentPanelUsesModal`). Keep CSS `@media` in sync.
 */
export const BOOKING_APPOINTMENT_PANEL_MODAL_MAX_PX = 1399

export const BOOKING_APPOINTMENT_PANEL_MODAL_MQ =
  `(max-width: ${BOOKING_APPOINTMENT_PANEL_MODAL_MAX_PX}px)` as const

export const BOOKING_APPOINTMENT_PANEL_MODAL_BODY_CLASS =
  'booking-appointment-panel-modal-open' as const

export enum BookingAppointmentPanelPresentation {
  Rail = 'rail',
  Modal = 'modal',
}

export enum BookingAppointmentPanelState {
  Empty = 'empty',
  New = 'new',
}

export const BOOKING_STATUS_META: Record<
  BookingUiStatus,
  { labelKey: string; badgeClass: string; rowClass: string }
> = {
  [BookingUiStatus.New]: {
    labelKey: 'statusNew',
    badgeClass: 'booking-status-new',
    rowClass: 'is-new',
  },
  [BookingUiStatus.SmsSent]: {
    labelKey: 'statusSms',
    badgeClass: 'booking-status-sms',
    rowClass: 'is-sms-sent',
  },
  [BookingUiStatus.Done]: {
    labelKey: 'statusDone',
    badgeClass: 'booking-status-done',
    rowClass: 'is-done',
  },
  [BookingUiStatus.NoShow]: {
    labelKey: 'statusNoShow',
    badgeClass: 'booking-status-noshow',
    rowClass: 'is-noshow',
  },
  [BookingUiStatus.Cancelled]: {
    labelKey: 'statusCancelled',
    badgeClass: 'booking-status-cancelled',
    rowClass: 'is-cancelled',
  },
}

export const BOOKING_STATUS_FALLBACK_META = {
  badgeClass: 'booking-status-unknown',
  rowClass: 'is-unknown',
} as const

export function getBookingStatusMeta(status: string) {
  return isBookingUiStatus(status) ? BOOKING_STATUS_META[status] : BOOKING_STATUS_FALLBACK_META
}

export function bookingStatusLabelKey(status: string): string | null {
  return isBookingUiStatus(status) ? BOOKING_STATUS_META[status].labelKey : null
}

const BOOKING_MUTATION_STATUS = new Set<string>([
  BookingUiStatus.New,
  BookingUiStatus.SmsSent,
])

export function canMutateBookingStatus(status: string) {
  return BOOKING_MUTATION_STATUS.has(status)
}

export const BOOKING_STATUS_FILTER_ORDER: BookingUiStatus[] = [
  BookingUiStatus.New,
  BookingUiStatus.SmsSent,
  BookingUiStatus.Done,
  BookingUiStatus.NoShow,
  BookingUiStatus.Cancelled,
]

/** i18n key suffixes under `…BookingHubView.today` for keyword placeholders. */
export const BOOKING_TODAY_KEYWORD_PLACEHOLDER_KEY: Record<BookingUiSearchField, string> = {
  [BookingUiSearchField.All]: 'keywordPlaceholderAll',
  [BookingUiSearchField.Name]: 'keywordPlaceholderName',
  [BookingUiSearchField.Phone]: 'keywordPlaceholderPhone',
  [BookingUiSearchField.Email]: 'keywordPlaceholderEmail',
  [BookingUiSearchField.Service]: 'keywordPlaceholderService',
}
/** Matches booking-book-phase-1.html `BOOKING_CALENDAR_COLORS`. */
export const BOOKING_CALENDAR_COLORS = [
  { bg: '#ebe6ff', border: '#7456e9', text: '#272343' },
  { bg: '#e0f3f8', border: '#2b96ba', text: '#173a47' },
  { bg: '#e5f7f1', border: '#158a69', text: '#163d34' },
  { bg: '#fff1d6', border: '#d97706', text: '#654003' },
  { bg: '#fde7f0', border: '#c24182', text: '#5e203f' },
] as const

export const POS_BOOKING_CALENDAR_STATUS_COLORS = {
  [BookingCalendarStatusGroup.Completed]: {
    bg: '#E8F7F1',
    border: '#1F8F70',
    text: '#155E4B',
  },
  [BookingCalendarStatusGroup.Upcoming]: {
    bg: '#EAF2FF',
    border: '#3978D4',
    text: '#234F91',
  },
  [BookingCalendarStatusGroup.Pending]: {
    bg: '#FFF4E5',
    border: '#B8751E',
    text: '#7A4A0E',
  },
  [BookingCalendarStatusGroup.Cancelled]: {
    bg: '#F1F5F9',
    border: '#94A3B8',
    text: '#64748B',
  },
} as const

export const BOOKING_CALENDAR_UNASSIGNED_TECH = 'unassigned' as const

export const BOOKING_CALENDAR_DEFAULT_DURATION_MINUTES = 60

/** DayPilot grid cell length in minutes (must match `BOOKING_CALENDAR_DAYPILOT_OPTIONS.cellDuration`). */
export const BOOKING_CALENDAR_CELL_DURATION_MINUTES = 15

/**
 * DayPilot Calendar:
 * - `BusinessHours` enables internal vertical scroll so staff column headers stay fixed.
 * - Non-business cells are hidden so Front Desk only sees schedulable hours.
 */
export const BOOKING_CALENDAR_BUSINESS_BEGINS_HOUR = 9
export const BOOKING_CALENDAR_BUSINESS_ENDS_HOUR = 19
export const BOOKING_CALENDAR_CELL_HEIGHT_PX = 28
export const BOOKING_CALENDAR_HEADER_HEIGHT_PX = 44
export const BOOKING_CALENDAR_HOUR_WIDTH_PX = 64
export const BOOKING_CALENDAR_DEFAULT_SCROLL_HOUR = BOOKING_CALENDAR_BUSINESS_BEGINS_HOUR

export const BOOKING_CALENDAR_DAYPILOT_OPTIONS = {
  viewType: 'Resources' as const,
  businessBeginsHour: BOOKING_CALENDAR_BUSINESS_BEGINS_HOUR,
  businessEndsHour: BOOKING_CALENDAR_BUSINESS_ENDS_HOUR,
  showNonBusiness: false,
  heightSpec: 'BusinessHoursNoScroll' as const,
  cellDuration: BOOKING_CALENDAR_CELL_DURATION_MINUTES,
  cellHeight: BOOKING_CALENDAR_CELL_HEIGHT_PX,
  hourWidth: BOOKING_CALENDAR_HOUR_WIDTH_PX,
  headerHeight: BOOKING_CALENDAR_HEADER_HEIGHT_PX,
  timeFormat: 'Clock12Hours' as const,
  eventMoveHandling: 'Disabled' as const,
  eventResizeHandling: 'Disabled' as const,
  /** Overridden to `Enabled` in `BookingTeamCalendar` when slot create is wired. */
  timeRangeSelectedHandling: 'Disabled' as const,
}

export type BookingCalendarColor = (typeof BOOKING_CALENDAR_COLORS)[number]
