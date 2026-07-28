import {
  BOOKING_CALENDAR_COLORS,
  BOOKING_CALENDAR_DEFAULT_DURATION_MINUTES,
  BOOKING_CALENDAR_UNASSIGNED_TECH,
  type BookingCalendarColor,
} from './bookingTodayConstants'
import { BOOKING_HUB_EMPTY_CELL, pad2 } from './bookingHubFormatters'
import { parseApiDateTime } from '../utils'

export type BookingCalendarSource = {
  id: string
  name: string
  tech: string
  date: string
  services: string[]
  statusLabel: string
  startAtUtc: string | null
  endAtUtc: string | null
}

export type BookingCalendarColumn = {
  id: string
  name: string
  toolTip: string
}

export type BookingCalendarEvent = {
  id: string
  text: string
  start: string
  end: string
  resource: string
  backColor: string
  borderColor: string
  barColor: string
  fontColor: string
  borderRadius: number
  padding: number
  cssClass: string
  html: string
  toolTip: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatLocalDateTime(date: Date) {
  return (
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
    + `T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00`
  )
}

function resolveTechId(tech: string) {
  const trimmed = tech.trim()
  if (!trimmed || trimmed === BOOKING_HUB_EMPTY_CELL) {
    return BOOKING_CALENDAR_UNASSIGNED_TECH
  }
  return trimmed
}

function resolveTechLabel(techId: string, unassignedLabel: string) {
  return techId === BOOKING_CALENDAR_UNASSIGNED_TECH ? unassignedLabel : techId
}

export function buildBookingCalendarColumns(
  bookings: ReadonlyArray<Pick<BookingCalendarSource, 'tech'>>,
  unassignedLabel: string,
  /** Stable Active-staff roster (API order). When set, column positions stay fixed across refetches. */
  staffNames: ReadonlyArray<string> = [],
): BookingCalendarColumn[] {
  const columns: BookingCalendarColumn[] = []
  const seen = new Set<string>()

  const pushTech = (rawName: string) => {
    const id = resolveTechId(rawName)
    if (!id || id === BOOKING_CALENDAR_UNASSIGNED_TECH || seen.has(id)) return
    seen.add(id)
    columns.push({ id, name: id, toolTip: id })
  }

  // 1) Fixed roster first — same order as Active staff list.
  for (const name of staffNames) {
    pushTech(name)
  }

  // 2) Any tech present on bookings but missing from roster (alpha-stable, append only).
  const orphans: string[] = []
  for (const booking of bookings) {
    const id = resolveTechId(booking.tech)
    if (!id || id === BOOKING_CALENDAR_UNASSIGNED_TECH || seen.has(id)) continue
    seen.add(id)
    orphans.push(id)
  }
  orphans.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  for (const id of orphans) {
    columns.push({ id, name: id, toolTip: id })
  }

  // 3) Unassigned always last — creating from this column stays put.
  columns.push({
    id: BOOKING_CALENDAR_UNASSIGNED_TECH,
    name: resolveTechLabel(BOOKING_CALENDAR_UNASSIGNED_TECH, unassignedLabel),
    toolTip: resolveTechLabel(BOOKING_CALENDAR_UNASSIGNED_TECH, unassignedLabel),
  })

  return columns
}

function colorForResource(resourceId: string, columns: BookingCalendarColumn[]): BookingCalendarColor {
  const index = columns.findIndex((column) => column.id === resourceId)
  return BOOKING_CALENDAR_COLORS[(index < 0 ? 0 : index) % BOOKING_CALENDAR_COLORS.length]
}

function resolveEventWindow(booking: BookingCalendarSource, calendarDate: string) {
  // BE omits trailing Z on UTC fields — always parse as UTC then convert to local for DayPilot.
  // Calendar intentionally spans start→end (duration). List modes (table/card) show start only.
  const start = booking.startAtUtc ? parseApiDateTime(booking.startAtUtc) : null
  if (start) {
    const endRaw = booking.endAtUtc ? parseApiDateTime(booking.endAtUtc) : null
    const end = endRaw && endRaw > start
      ? endRaw
      : new Date(start.getTime() + BOOKING_CALENDAR_DEFAULT_DURATION_MINUTES * 60_000)
    return { start, end }
  }

  // Fallback when API has no start: place a 60-minute block at business open (local).
  const startFallback = new Date(`${calendarDate}T09:00:00`)
  const endFallback = new Date(
    startFallback.getTime() + BOOKING_CALENDAR_DEFAULT_DURATION_MINUTES * 60_000,
  )
  return { start: startFallback, end: endFallback }
}

export function buildBookingCalendarEvents(
  bookings: ReadonlyArray<BookingCalendarSource>,
  columns: BookingCalendarColumn[],
  calendarDate: string,
): BookingCalendarEvent[] {
  return bookings
    .filter((booking) => booking.date === calendarDate)
    .map((booking) => {
      const resource = resolveTechId(booking.tech)
      const color = colorForResource(resource, columns)
      const { start, end } = resolveEventWindow(booking, calendarDate)
      const minutes = Math.max(
        15,
        Math.round((end.getTime() - start.getTime()) / 60_000),
      )
      const service = booking.services.filter((item) => item && item !== BOOKING_HUB_EMPTY_CELL).join(' · ')
        || BOOKING_HUB_EMPTY_CELL
      const name = booking.name?.trim() && booking.name !== BOOKING_HUB_EMPTY_CELL
        ? booking.name
        : BOOKING_HUB_EMPTY_CELL
      return {
        id: booking.id,
        text: name,
        start: formatLocalDateTime(start),
        end: formatLocalDateTime(end),
        resource,
        backColor: color.bg,
        borderColor: color.border,
        barColor: color.border,
        fontColor: color.text,
        borderRadius: 10,
        padding: 8,
        cssClass: 'booking-calendar-event',
        html: (
          `<div class="booking-calendar-event">`
          + `<div class="booking-calendar-event-name">${escapeHtml(name)}</div>`
          + `<div class="booking-calendar-event-service">${escapeHtml(service)}</div>`
          + `<div class="booking-calendar-event-meta">${minutes} min · ${escapeHtml(booking.statusLabel)}</div>`
          + `</div>`
        ),
        toolTip: `${name} · ${service}`,
      }
    })
}

export function shiftLocalDateIso(dateIso: string, dayDelta: number) {
  const date = new Date(`${dateIso}T12:00:00`)
  date.setDate(date.getDate() + dayDelta)
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  return `${year}-${month}-${day}`
}

export function formatBookingCalendarNavLabel(dateIso: string, locale: string) {
  return new Date(`${dateIso}T12:00:00`).toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
