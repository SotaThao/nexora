import { BookingUiSearchField, BookingUiStatus } from '../../../data/repositories/merchantVoice'

export enum BookingTodayViewMode {
  Table = 'table',
  Card = 'card',
  Calendar = 'calendar',
}

export const BOOKING_TODAY_VIEW_MODE_ORDER = [
  BookingTodayViewMode.Table,
  BookingTodayViewMode.Card,
  BookingTodayViewMode.Calendar,
] as const

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
}

export const BOOKING_STATUS_FILTER_ORDER: BookingUiStatus[] = [
  BookingUiStatus.New,
  BookingUiStatus.SmsSent,
  BookingUiStatus.Done,
  BookingUiStatus.NoShow,
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

export const BOOKING_CALENDAR_UNASSIGNED_TECH = 'unassigned' as const

export const BOOKING_CALENDAR_DEFAULT_DURATION_MINUTES = 60

/** DayPilot grid cell length in minutes (must match `BOOKING_CALENDAR_DAYPILOT_OPTIONS.cellDuration`). */
export const BOOKING_CALENDAR_CELL_DURATION_MINUTES = 15

/**
 * DayPilot Calendar:
 * - `BusinessHours` enables internal vertical scroll so staff column headers stay fixed.
 * - Content is still a full 24h day (midnight→midnight); `businessBegins/EndsHour` only size the viewport.
 * - Default `initScrollPos: Auto` opens scrolled to `businessBeginsHour` (9 AM); user can scroll up/down freely.
 */
export const BOOKING_CALENDAR_DEFAULT_SCROLL_HOUR = 9

export const BOOKING_CALENDAR_DAYPILOT_OPTIONS = {
  viewType: 'Resources' as const,
  businessBeginsHour: BOOKING_CALENDAR_DEFAULT_SCROLL_HOUR,
  businessEndsHour: 20,
  heightSpec: 'BusinessHours' as const,
  cellDuration: BOOKING_CALENDAR_CELL_DURATION_MINUTES,
  cellHeight: 28,
  hourWidth: 64,
  headerHeight: 44,
  timeFormat: 'Clock12Hours' as const,
  eventMoveHandling: 'Disabled' as const,
  eventResizeHandling: 'Disabled' as const,
  /** Overridden to `Enabled` in `BookingTeamCalendar` when slot create is wired. */
  timeRangeSelectedHandling: 'Disabled' as const,
}

export type BookingCalendarColor = (typeof BOOKING_CALENDAR_COLORS)[number]
