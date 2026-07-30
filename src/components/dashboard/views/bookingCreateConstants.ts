import { BookingUiStatus } from '../../../data/repositories/merchantVoice'
import { toLocalDateIso, pad2 } from './bookingHubFormatters'

export const BOOKING_CREATE_TK = 'components.dashboard.views.BookingHubView.today.create'

/** Empty select value → omit `staffId` on create payload. Not the same as calendar column id `BOOKING_CALENDAR_UNASSIGNED_TECH`. */
export const BOOKING_CREATE_UNASSIGNED_STAFF = '' as const

export const BOOKING_CREATE_NAME_MAX = 60
export const BOOKING_CREATE_NOTE_MAX = 240
export const BOOKING_CREATE_TIME_STEP_SECONDS = 900
export const BOOKING_CREATE_TIME_STEP_MINUTES = BOOKING_CREATE_TIME_STEP_SECONDS / 60
export const BOOKING_CREATE_STAFF_PAGE_SIZE = 100
export const BOOKING_CREATE_LOCAL_ID_PREFIX = 'local-created-' as const
export const BOOKING_CREATE_OPTIMISTIC_TTL_MS = 45_000
/** Visual separator in service chips / success toast (not user-facing copy). */
export const BOOKING_CREATE_DISPLAY_SEPARATOR = ' · ' as const

export const BOOKING_CREATE_CELL_ADD_HTML =
  '<span class="booking-cell-add" aria-hidden="true"><span>+</span></span>'

export const BOOKING_CREATE_CELL_PAST_CLASS = 'is-past-slot'

export enum BookingCreateField {
  Phone = 'phone',
  Name = 'name',
  Services = 'services',
  Date = 'date',
  Time = 'time',
}

/** Where the create form mounts: centered overlay vs calendar side rail. */
export enum BookingCreateVariant {
  Modal = 'modal',
  Panel = 'panel',
}

export type BookingCreateFieldErrors = Partial<Record<BookingCreateField, string>>

export type BookingCreatePrefill = {
  date?: string
  time?: string
  /** Staff list id when known; otherwise match by `staffName`. */
  staffId?: string | null
  staffName?: string | null
}

/** Local wall-clock slot returned after a successful create (for calendar paint). */
export type BookingCreateCreatedSlot = {
  date: string
  time: string
  staffName: string | null
  customerName: string
  serviceNames: string[]
  durationMinutes: number
  status: BookingUiStatus
}

/** Client-local `HH:mm` from the user's machine clock (any timezone). */
export function toClientLocalTimeHhmm(date = new Date()) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

/**
 * Build a Date in the **user's local timezone** from calendar date + HH:mm.
 * Do not use `Date.parse('YYYY-MM-DDTHH:mm')` — that is UTC in some engines.
 */
export function clientLocalDateTime(dateIso: string, timeHhmm: string): Date | null {
  const dateMatch = String(dateIso || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const timeMatch = String(timeHhmm || '').trim().match(/^([01]\d|2[0-3]):([0-5]\d)/)
  if (!dateMatch || !timeMatch) return null
  return new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0,
    0,
  )
}

/** True when `dateIso` is before today on the user's machine calendar. */
export function isClientLocalDateBeforeToday(dateIso: string, now = new Date()) {
  const today = toLocalDateIso(now)
  return Boolean(dateIso) && dateIso < today
}

/**
 * Slot is unavailable when its local start is already at/after now.
 * Uses the browser clock so US / VN / etc. clients each see their own day & time.
 */
export function isClientLocalSlotPast(
  dateIso: string,
  timeHhmm: string,
  now = new Date(),
) {
  if (isClientLocalDateBeforeToday(dateIso, now)) return true
  const start = clientLocalDateTime(dateIso, timeHhmm)
  if (!start) return true
  return start.getTime() <= now.getTime()
}

/**
 * Earliest bookable `HH:mm` on `dateIso` for this client, or `null` when the whole day is open
 * (future date). Returns `null` also when date is invalid; empty string when no slot left today.
 */
export function getMinBookableClientLocalTime(
  dateIso: string,
  now = new Date(),
  stepMinutes = BOOKING_CREATE_TIME_STEP_MINUTES,
): string | null {
  const today = toLocalDateIso(now)
  if (!dateIso || dateIso > today) return null
  if (dateIso < today) return ''

  const totalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  const stepSeconds = stepMinutes * 60
  // +1s so an exact step boundary (e.g. 09:15:00) is already past → next step.
  const nextStepSec = Math.ceil((totalSeconds + 1) / stepSeconds) * stepSeconds
  if (nextStepSec >= 24 * 3600) return ''
  const hours = Math.floor(nextStepSec / 3600)
  const minutes = Math.floor((nextStepSec % 3600) / 60)
  return `${pad2(hours)}:${pad2(minutes)}`
}
