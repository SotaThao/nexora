import type { TFunction } from '../../../types/contexts'
import type { StaffBusinessLink } from '../../../types/domain'
import { formatDatePart, formatLocalDateIso, formatTimePart, getMeridiem, parseApiUtcDateTime } from '../../../utils/localDate'
import {
  STAFF_BUSINESS_LINK_STATUS,
  resolveStaffBusinessLinkStatusLabel,
} from '../../../utils/staffBusinessLinkStatus'
import { STAFF_SALONS_PATH } from '../staffSalonPaths'
import {
  StaffWorkOrdersViewKind,
  WORK_ORDERS_I18N,
  WORK_ORDER_CALENDAR_DAY_STATE,
  WORK_ORDER_COMPLETION_NOTE_MAX_LENGTH,
  WORK_ORDER_COMPLETION_NOTE_SEPARATOR,
  WORK_ORDER_DATE_LOCALE,
  WORK_ORDER_DEFAULT_LANGUAGE,
  WORK_ORDER_EMPTY_PLACEHOLDER,
  WORK_ORDER_FILTER_STATUSES,
  WORK_ORDER_INLINE_LIST_SEPARATOR,
  WORK_ORDER_MAX_INITIALS,
  WORK_ORDER_MONEY,
  WORK_ORDER_NAME_SEPARATOR,
  WORK_ORDER_NUMBER_DIGITS,
  WORK_ORDER_NUMBER_PREFIX,
  WORK_ORDER_PAD_CHAR,
  WORK_ORDER_SERVICE_NAME_SEPARATOR,
  WORK_ORDER_STARTABLE_STATUSES,
  WORK_ORDER_STATION_DIGITS,
  WORK_ORDER_TICKET_FILTER,
  WORK_ORDER_VIETNAMESE_PREFIX,
  WORK_ORDER_WEEKDAY_COUNT,
  WORK_ORDER_WEEKDAY_SUNDAY,
  type WorkOrderDetail,
  type WorkOrderListItem,
  type WorkOrderSalon,
  type WorkOrderTicketFilter,
} from './constants'
import { PosOrderStatus } from '../../../constants/posOrderStatus'

export function isWorkOrderVietnamese(language: string): boolean {
  return language.toLowerCase().startsWith(WORK_ORDER_VIETNAMESE_PREFIX)
}

export function workOrderDateLocale(language: string): string {
  return isWorkOrderVietnamese(language) ? WORK_ORDER_DATE_LOCALE.vi : WORK_ORDER_DATE_LOCALE.en
}

export function getWorkOrderSalonById(
  salons: WorkOrderSalon[],
  salonId: string | undefined,
): WorkOrderSalon | undefined {
  if (!salonId) return undefined
  return salons.find((salon) => salon.id === salonId)
}

function formatSalonAddress(link: StaffBusinessLink): string {
  return [link.address, link.city, link.state]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(WORK_ORDER_INLINE_LIST_SEPARATOR)
}

function isActiveStaffBusinessLink(link: StaffBusinessLink): boolean {
  return resolveStaffBusinessLinkStatusLabel(link).trim().toLowerCase()
    === STAFF_BUSINESS_LINK_STATUS.active
}

export function toWorkOrderSalons(links: StaffBusinessLink[] | undefined): WorkOrderSalon[] {
  if (!links?.length) return []
  return links.flatMap((link) => {
    const id = link.businessId?.trim()
    if (!id || !isActiveStaffBusinessLink(link)) return []
    return [{
      id,
      name: link.businessName?.trim() ?? '',
      address: formatSalonAddress(link),
      timeZone: link.timeZone,
    }]
  })
}

export function parseLocalIso(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}

export function addLocalDateIso(iso: string, days: number): string {
  const { year, month, day } = parseLocalIso(iso)
  return formatLocalDateIso(new Date(year, month - 1, day + days))
}

export function shiftLocalMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

export function formatWorkOrderMonthLabel(year: number, month: number, language: string): string {
  return new Intl.DateTimeFormat(workOrderDateLocale(language), { month: 'short', year: 'numeric' })
    .format(new Date(year, month - 1, 1))
}

export function formatWorkOrderCheckedInAt(
  iso: string,
  language: string,
  timeZone?: string | null,
): string {
  const date = parseApiUtcDateTime(iso)
  if (!date) return ''
  return formatTimePart(salonWallClockDate(date, timeZone), isWorkOrderVietnamese(language))
}

const SALON_CLOCK_ANCHOR_YEAR = 2000
const SALON_CLOCK_ANCHOR_MONTH = 0
const SALON_CLOCK_ANCHOR_DAY = 1

function anchoredClockDate(hour: number, minute: number): Date {
  return new Date(
    SALON_CLOCK_ANCHOR_YEAR,
    SALON_CLOCK_ANCHOR_MONTH,
    SALON_CLOCK_ANCHOR_DAY,
    hour,
    minute,
  )
}

/**
 * Re-anchor a UTC instant (`checkedInAt`) onto the salon's wall clock so it reads the same on a
 * technician's phone in any timezone. Without `timeZone` it falls back to the device zone.
 */
function salonWallClockDate(date: Date, timeZone?: string | null): Date {
  const zone = timeZone?.trim()
  if (!zone) return date
  try {
    const parts = new Intl.DateTimeFormat(WORK_ORDER_DATE_LOCALE.en, {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date)
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '')
    const hour = get('hour')
    const minute = get('minute')
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return date
    return anchoredClockDate(hour, minute)
  } catch {
    return date
  }
}

const WALL_CLOCK_TIME = /T(\d{2}):(\d{2})/

/** Salon wall-clock as 12h "09:00 am" / "10:19 pm" from a DateTimeOffset the API already converted. */
export function formatWorkOrderWallClockTime(iso: string, language?: string): string {
  const match = WALL_CLOCK_TIME.exec(iso)
  const lang = language ?? WORK_ORDER_DEFAULT_LANGUAGE
  if (!match) return formatWorkOrderCheckedInAt(iso, lang)
  return formatTimePart(
    new Date(2000, 0, 1, Number(match[1]), Number(match[2])),
    isWorkOrderVietnamese(lang),
  )
}

export function formatWorkOrderTicketTime(
  ticket: { scheduledAt?: string | null; checkedInAt: string },
  language: string,
  timeZone?: string | null,
): string {
  const clock = formatWorkOrderTicketClock(ticket, language, timeZone)
  if (clock.value === WORK_ORDER_EMPTY_PLACEHOLDER) return WORK_ORDER_EMPTY_PLACEHOLDER
  return `${clock.value} ${clock.period}`
}

export type WorkOrderClockParts = { value: string; period: string }

function ticketClockDate(
  ticket: { scheduledAt?: string | null; checkedInAt: string },
  timeZone?: string | null,
): Date | null {
  const scheduled = ticket.scheduledAt?.trim()
  if (scheduled) {
    // The API already returns ScheduledAt with the salon's offset — read the wall clock as-is.
    const match = WALL_CLOCK_TIME.exec(scheduled)
    if (match) return anchoredClockDate(Number(match[1]), Number(match[2]))
  }
  const checkedIn = parseApiUtcDateTime(ticket.checkedInAt)
  return checkedIn ? salonWallClockDate(checkedIn, timeZone) : null
}

export function formatWorkOrderTicketClock(
  ticket: { scheduledAt?: string | null; checkedInAt: string },
  language: string,
  timeZone?: string | null,
): WorkOrderClockParts {
  const date = ticketClockDate(ticket, timeZone)
  if (!date) {
    return { value: WORK_ORDER_EMPTY_PLACEHOLDER, period: WORK_ORDER_EMPTY_PLACEHOLDER }
  }
  const vietnamese = isWorkOrderVietnamese(language)
  const hour = date.getHours() % 12 || 12
  const minute = String(date.getMinutes()).padStart(WORK_ORDER_STATION_DIGITS, WORK_ORDER_PAD_CHAR)
  const meridiem = getMeridiem(date, vietnamese)
  return {
    value: `${hour}:${minute}`,
    period: vietnamese ? meridiem : meridiem.toUpperCase(),
  }
}

export function workOrderPrimaryServiceName(serviceNames: string[]): string {
  return workOrderTextOrPlaceholder(serviceNames.find((name) => name.trim()) ?? '')
}

export function workOrderBeeperDisplay(beeper: string | null | undefined): string {
  const text = workOrderBeeperLabel(beeper)
  if (!text) return WORK_ORDER_EMPTY_PLACEHOLDER
  return /^b/i.test(text) ? text : `B${text}`
}

export function workOrderSalonInitials(name: string): string {
  const initials = workOrderCustomerInitials(name)
  return initials || WORK_ORDER_EMPTY_PLACEHOLDER
}

export function isWorkOrderAssignedStatus(status: PosOrderStatus): boolean {
  return WORK_ORDER_FILTER_STATUSES[WORK_ORDER_TICKET_FILTER.Assigned].includes(status)
    || status === PosOrderStatus.Pending
    || status === PosOrderStatus.Confirmed
}

export function workOrderTicketMatchesFilter(
  status: PosOrderStatus,
  filter: WorkOrderTicketFilter,
): boolean {
  if (filter === WORK_ORDER_TICKET_FILTER.All) return true
  if (filter === WORK_ORDER_TICKET_FILTER.Assigned) return isWorkOrderAssignedStatus(status)
  return WORK_ORDER_FILTER_STATUSES[filter].includes(status)
}

const MINUTES_PER_HOUR = 60

export function workOrderTicketRank(ticket: WorkOrderListItem, timeZone?: string | null): number {
  const date = ticketClockDate(ticket, timeZone)
  if (!date) return 0
  return date.getHours() * MINUTES_PER_HOUR + date.getMinutes()
}

export function sortWorkOrderTicketsByTime(
  tickets: WorkOrderListItem[],
  timeZone?: string | null,
): WorkOrderListItem[] {
  return tickets
    .slice()
    .sort((left, right) => workOrderTicketRank(left, timeZone) - workOrderTicketRank(right, timeZone))
}

export function newestAssignedWorkOrder(
  tickets: WorkOrderListItem[],
): WorkOrderListItem | null {
  return tickets.reduce<WorkOrderListItem | null>((newest, ticket) => {
    if (!isWorkOrderAssignedStatus(ticket.myStatus)) return newest
    if (!newest) return ticket
    const newestTime = Date.parse(newest.checkedInAt)
    const ticketTime = Date.parse(ticket.checkedInAt)
    if (!Number.isFinite(ticketTime)) return newest
    if (!Number.isFinite(newestTime) || ticketTime >= newestTime) return ticket
    return newest
  }, null)
}

export function countWorkOrdersByFilter(
  tickets: WorkOrderListItem[],
  filter: WorkOrderTicketFilter,
): number {
  return tickets.filter((ticket) => workOrderTicketMatchesFilter(ticket.myStatus, filter)).length
}

export function formatWorkOrderStationNumber(stationNumber: number): string {
  return String(stationNumber).padStart(WORK_ORDER_STATION_DIGITS, WORK_ORDER_PAD_CHAR)
}

export function formatWorkOrderStationValue(stationNumber: number | null | undefined): string {
  return stationNumber != null
    ? formatWorkOrderStationNumber(stationNumber)
    : WORK_ORDER_EMPTY_PLACEHOLDER
}

export function workOrderStationLabel(stationNumber: number | null | undefined): string | null {
  if (typeof stationNumber !== 'number' || !Number.isFinite(stationNumber) || stationNumber <= 0) {
    return null
  }
  return formatWorkOrderStationNumber(stationNumber)
}

export function workOrderBeeperLabel(beeper: string | null | undefined): string | null {
  const text = beeper?.trim() ?? ''
  if (!text || text === WORK_ORDER_EMPTY_PLACEHOLDER) return null
  return text
}

export function workOrderStationChipText(
  stationNumber: number | null | undefined,
  translate: TFunction,
): string {
  return translate(WORK_ORDERS_I18N.station, {
    number: workOrderStationLabel(stationNumber) ?? WORK_ORDER_EMPTY_PLACEHOLDER,
  })
}

export function workOrderBeeperChipText(
  beeper: string | null | undefined,
  translate: TFunction,
): string {
  return translate(WORK_ORDERS_I18N.beeper, {
    code: workOrderBeeperDisplay(beeper),
  })
}

const WORK_ORDER_NUMERIC = /^\d+$/

/** Check-in stores a daily sequence ("1"); the mockup displays it as WO-0001. */
export function formatWorkOrderNumber(orderNumber: string | null | undefined): string {
  const raw = orderNumber?.trim() ?? ''
  if (!raw) return WORK_ORDER_EMPTY_PLACEHOLDER
  if (!WORK_ORDER_NUMERIC.test(raw)) return raw
  return `${WORK_ORDER_NUMBER_PREFIX}${raw.padStart(WORK_ORDER_NUMBER_DIGITS, WORK_ORDER_PAD_CHAR)}`
}

export function workOrderTextOrPlaceholder(value: string | null | undefined): string {
  const text = value?.trim() ?? ''
  return text || WORK_ORDER_EMPTY_PLACEHOLDER
}

const WORK_ORDER_DATE_ISO = /^(\d{4}-\d{2}-\d{2})/

export function workOrderScheduledDateIso(scheduledAt: string | null | undefined): string | null {
  const match = WORK_ORDER_DATE_ISO.exec(scheduledAt?.trim() ?? '')
  return match?.[1] ?? null
}

/** Walk-ins (no scheduledAt) can start anytime; bookings wait until the salon appointment day. */
export function isWorkOrderStartDateReached(
  scheduledAt: string | null | undefined,
  todayIso: string,
): boolean {
  const scheduledDate = workOrderScheduledDateIso(scheduledAt)
  if (!scheduledDate) return true
  return scheduledDate <= todayIso
}

const WORK_ORDER_MONEY_FORMATTER = new Intl.NumberFormat(WORK_ORDER_MONEY.locale, {
  style: 'currency',
  currency: WORK_ORDER_MONEY.currency,
  minimumFractionDigits: WORK_ORDER_MONEY.fractionDigits,
})

export function formatWorkOrderMoney(amount: number): string {
  return WORK_ORDER_MONEY_FORMATTER.format(amount)
}

export function formatWorkOrderDurationMinutes(minutes: number, translate: TFunction): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return WORK_ORDER_EMPTY_PLACEHOLDER
  return translate(WORK_ORDERS_I18N.durationMinutes, { minutes })
}

export function isWorkOrderStartActionVisible(status: PosOrderStatus): boolean {
  return WORK_ORDER_STARTABLE_STATUSES.includes(status)
}

export function canStartWorkOrderNow(
  ticket: Pick<WorkOrderDetail, 'status' | 'scheduledAt'>,
  todayIso: string,
): boolean {
  // The guest is already in the chair — remaining Assigned work for this technician can begin now.
  if (ticket.status === PosOrderStatus.InService) return true
  return isWorkOrderStartDateReached(ticket.scheduledAt, todayIso)
}

export function toggleWorkOrderSuggestion(selected: string[], suggestion: string): string[] {
  return selected.includes(suggestion)
    ? selected.filter((item) => item !== suggestion)
    : [...selected, suggestion]
}

export function composeWorkOrderCompletionNote(
  selectedSuggestions: string[],
  additionalNote: string,
): string | null {
  const parts = [
    ...selectedSuggestions.map((item) => item.trim()).filter(Boolean),
    additionalNote.trim(),
  ].filter(Boolean)
  if (parts.length === 0) return null
  return parts.join(WORK_ORDER_COMPLETION_NOTE_SEPARATOR).slice(0, WORK_ORDER_COMPLETION_NOTE_MAX_LENGTH)
}

export function isWorkOrderCompletedStatus(status: PosOrderStatus): boolean {
  return status === PosOrderStatus.Completed
}

export function workOrderCompletionNoteText(
  ticket: Pick<WorkOrderDetail, 'completionNote' | 'items'>,
  fallback: string,
  localNote?: string | null,
): string {
  const fromLocal = localNote?.trim()
  if (fromLocal) return fromLocal
  const fromTicket = ticket.completionNote?.trim()
  if (fromTicket) return fromTicket
  const itemNotes = (ticket.items ?? [])
    .map((item) => item?.note?.trim())
    .filter((note): note is string => Boolean(note))
  if (itemNotes.length) {
    return itemNotes.join(WORK_ORDER_COMPLETION_NOTE_SEPARATOR)
  }
  return fallback
}

export function workOrderWeekdayLabels(language: string): string[] {
  const formatter = new Intl.DateTimeFormat(workOrderDateLocale(language), { weekday: 'narrow' })
  return Array.from({ length: WORK_ORDER_WEEKDAY_COUNT }, (_, index) => (
    formatter.format(new Date(
      WORK_ORDER_WEEKDAY_SUNDAY.year,
      WORK_ORDER_WEEKDAY_SUNDAY.month,
      WORK_ORDER_WEEKDAY_SUNDAY.day + index,
    ))
  ))
}

export type WorkOrderCalendarDay = {
  iso: string
  day: number
  selected: boolean
  isToday: boolean
}

export function buildWorkOrderMonthCells(
  viewYear: number,
  viewMonth: number,
  selectedIso: string,
  todayIso: string,
): Array<WorkOrderCalendarDay | null> {
  const totalDays = new Date(viewYear, viewMonth, 0).getDate()
  const offset = new Date(viewYear, viewMonth - 1, 1).getDay()
  const cells: Array<WorkOrderCalendarDay | null> = Array.from({ length: offset }, () => null)

  for (let day = 1; day <= totalDays; day += 1) {
    const iso = formatLocalDateIso(new Date(viewYear, viewMonth - 1, day))
    cells.push({
      iso,
      day,
      selected: iso === selectedIso,
      isToday: iso === todayIso,
    })
  }
  return cells
}

export function workOrderCalendarDayState(
  day: WorkOrderCalendarDay,
): (typeof WORK_ORDER_CALENDAR_DAY_STATE)[keyof typeof WORK_ORDER_CALENDAR_DAY_STATE] {
  if (day.selected) return WORK_ORDER_CALENDAR_DAY_STATE.selected
  if (day.isToday) return WORK_ORDER_CALENDAR_DAY_STATE.today
  return WORK_ORDER_CALENDAR_DAY_STATE.idle
}

export function formatWorkOrderNavDate(iso: string, language: string): string {
  const { year, month, day } = parseLocalIso(iso)
  return formatDatePart(
    new Date(year, month - 1, day),
    isWorkOrderVietnamese(language),
    { withYear: false },
  )
}

export function workOrderCustomerInitials(name: string): string {
  return name
    .split(WORK_ORDER_NAME_SEPARATOR)
    .filter(Boolean)
    .slice(0, WORK_ORDER_MAX_INITIALS)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function joinWorkOrderLabels(values: string[], separator: string): string {
  return values.filter(Boolean).join(separator)
}

export function joinWorkOrderServiceNames(names: string[]): string {
  return joinWorkOrderLabels(names, WORK_ORDER_SERVICE_NAME_SEPARATOR)
}

export function joinWorkOrderTechnicianNames(names: string[]): string {
  return joinWorkOrderLabels(names, WORK_ORDER_INLINE_LIST_SEPARATOR)
}

export function workOrderAssignedTechnicianLabel(
  technicianName: string | null | undefined,
  translate: TFunction,
): string {
  const name = technicianName?.trim()
  if (!name) return translate(WORK_ORDERS_I18N.unassigned)
  return translate(WORK_ORDERS_I18N.technicianNamed, { name })
}

export type StaffWorkOrdersView =
  | { kind: StaffWorkOrdersViewKind.Redirect; to: string }
  | { kind: StaffWorkOrdersViewKind.Tickets; salon: WorkOrderSalon }
  | { kind: StaffWorkOrdersViewKind.Detail; salon: WorkOrderSalon; orderId: string }

export function resolveStaffWorkOrdersView(
  salonId: string | undefined,
  ticketId: string | undefined,
  salons: WorkOrderSalon[],
): StaffWorkOrdersView {
  if (!salonId) return { kind: StaffWorkOrdersViewKind.Redirect, to: STAFF_SALONS_PATH }

  const salon = getWorkOrderSalonById(salons, salonId) ?? {
    id: salonId,
    name: '',
    address: '',
  }
  if (!ticketId) return { kind: StaffWorkOrdersViewKind.Tickets, salon }

  return { kind: StaffWorkOrdersViewKind.Detail, salon, orderId: ticketId }
}
