import { formatHHmmTo12Hour } from '../../../utils/bookingTimeFormat'
import { formatDatePart, formatLocalDateIso } from '../../../utils/localDate'
import {
  StaffWorkOrdersViewKind,
  WORK_ORDER_CALENDAR_DAY_STATE,
  WORK_ORDER_MAX_INITIALS,
  WORK_ORDER_TICKET_FILTER,
  WORK_ORDER_WEEKDAY_COUNT,
  staffWorkOrdersPath,
  type WorkOrderSalonMock,
  type WorkOrderTicketFilter,
  type WorkOrderTicketMock,
} from './constants'
import { WORK_ORDER_SALON_MOCKS, WORK_ORDER_TICKET_MOCKS } from './workOrderMocks'

const VI_LOCALE = 'vi-VN'
const EN_LOCALE = 'en-US'
const WEEKDAY_SUNDAY = { year: 2024, month: 0, day: 7 } as const

export function isWorkOrderVietnamese(language: string): boolean {
  return language.toLowerCase().startsWith('vi')
}

export function workOrderDateLocale(language: string): string {
  return isWorkOrderVietnamese(language) ? VI_LOCALE : EN_LOCALE
}

export function getWorkOrderSalonById(salonId: string | undefined): WorkOrderSalonMock | undefined {
  if (!salonId) return undefined
  return WORK_ORDER_SALON_MOCKS.find((salon) => salon.id === salonId)
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

export function formatWorkOrderTime(hhmm: string, language: string): string {
  return formatHHmmTo12Hour(hhmm, workOrderDateLocale(language))
}

export function workOrderWeekdayLabels(language: string): string[] {
  const formatter = new Intl.DateTimeFormat(workOrderDateLocale(language), { weekday: 'narrow' })
  return Array.from({ length: WORK_ORDER_WEEKDAY_COUNT }, (_, index) => (
    formatter.format(new Date(WEEKDAY_SUNDAY.year, WEEKDAY_SUNDAY.month, WEEKDAY_SUNDAY.day + index))
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
  )
}

export function ticketsForSalon(salonId: string): WorkOrderTicketMock[] {
  return WORK_ORDER_TICKET_MOCKS.filter((ticket) => ticket.salonId === salonId)
}

export function getWorkOrderTicketById(
  salonId: string | undefined,
  ticketId: string | undefined,
): WorkOrderTicketMock | undefined {
  if (!salonId || !ticketId) return undefined
  return WORK_ORDER_TICKET_MOCKS.find(
    (ticket) => ticket.id === ticketId && ticket.salonId === salonId,
  )
}

export function workOrderCustomerInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, WORK_ORDER_MAX_INITIALS)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function workOrderServiceTotal(services: WorkOrderTicketMock['services']): number {
  return services.reduce((sum, line) => sum + line.price, 0)
}

export function filterWorkOrderTickets(
  tickets: WorkOrderTicketMock[],
  filter: WorkOrderTicketFilter,
): WorkOrderTicketMock[] {
  if (filter === WORK_ORDER_TICKET_FILTER.All) return tickets
  return tickets.filter((ticket) => ticket.status === filter)
}

export function assignedTicketCount(tickets: WorkOrderTicketMock[]): number {
  return filterWorkOrderTickets(tickets, WORK_ORDER_TICKET_FILTER.Assigned).length
}

export type StaffWorkOrdersView =
  | { kind: StaffWorkOrdersViewKind.Picker }
  | { kind: StaffWorkOrdersViewKind.Redirect; to: string }
  | { kind: StaffWorkOrdersViewKind.Tickets; salon: WorkOrderSalonMock }
  | { kind: StaffWorkOrdersViewKind.Detail; salon: WorkOrderSalonMock; ticket: WorkOrderTicketMock }

export function resolveStaffWorkOrdersView(
  salonId: string | undefined,
  ticketId: string | undefined,
): StaffWorkOrdersView {
  if (!salonId) return { kind: StaffWorkOrdersViewKind.Picker }

  const salon = getWorkOrderSalonById(salonId)
  if (!salon) return { kind: StaffWorkOrdersViewKind.Redirect, to: staffWorkOrdersPath() }
  if (!ticketId) return { kind: StaffWorkOrdersViewKind.Tickets, salon }

  const ticket = getWorkOrderTicketById(salonId, ticketId)
  if (!ticket) return { kind: StaffWorkOrdersViewKind.Redirect, to: staffWorkOrdersPath(salonId) }

  return { kind: StaffWorkOrdersViewKind.Detail, salon, ticket }
}
