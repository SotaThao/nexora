import type React from 'react'
import {
  formatNationalNumber,
  isValidPhoneE164,
  parsePhone,
} from '../../CountryCodeSelect'
import { formatDatePart, formatTimePart } from '../../../utils/localDate'
import { parseApiDateTime } from '../utils'

export const EMPTY_CALL_DURATION = '00:00'

/** Placeholder when a Booking Hub table cell has no value. */
export const BOOKING_HUB_EMPTY_CELL = '_' as const

/** Chip filter value: show every status on the current page (UI-only, not sent to BE). */
export const BOOKING_HUB_STATUS_FILTER_ALL = 'all' as const

export type BookingHubStatusFilterAll = typeof BOOKING_HUB_STATUS_FILTER_ALL

/** Shared className for Booking Hub Pagination (matches `booking-hub.css`). */
export const BOOKING_HUB_PAGINATION_CLASSNAME = 'booking-pagination' as const

/** Open the native date/time picker from a trusted click (full-field UX). */
export function openNativeDateTimePicker(input: HTMLInputElement | null) {
  if (!input || input.disabled) return
  input.focus()
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker()
    } catch {
      // Browser may block showPicker without a trusted user gesture.
    }
  }
}

/** Same EN/VI switch as Staff `DateTimeCell` / `formatTransactionDateTime`. */
export function isBookingHubVietnamese(language: string = 'en'): boolean {
  return String(language || 'en').toLowerCase().startsWith('vi')
}

function bookingHubLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * AI Hub date-only display for local `YYYY-MM-DD`.
 * Matches Staff linked-date date part: `Jul 09, 2026` / `09 Tháng 7, 2026`.
 */
export function formatBookingHubDateDisplay(isoDate: string, language: string = 'en') {
  const [year, month, day] = String(isoDate || '').split('-').map(Number)
  if (!year || !month || !day) return isoDate || ''
  return formatDatePart(new Date(year, month - 1, day), isBookingHubVietnamese(language))
}

/**
 * AI Hub time-only display for local `HH:mm`.
 * Matches Staff linked-date time part: `05:21 AM` / `05:21 Sáng`.
 */
export function formatBookingHubTimeDisplay(hhmm: string, language: string = 'en') {
  const [hours, minutes] = String(hhmm || '').split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return hhmm || ''
  return formatTimePart(
    new Date(1970, 0, 1, hours, minutes, 0, 0),
    isBookingHubVietnamese(language),
  )
}

export type BookingHubDateTimeParts = {
  date: string
  time: string
}

/**
 * Split API timestamp into Staff-style date + time parts (user timezone).
 * Returns null when the value cannot be parsed.
 */
export function formatBookingHubDateTimeParts(
  value: string | null | undefined,
  language: string = 'en',
): BookingHubDateTimeParts | null {
  const date = parseApiDateTime(value)
  if (!date) return null
  const isVietnamese = isBookingHubVietnamese(language)
  const timeZone = bookingHubLocalTimeZone()
  return {
    date: formatDatePart(date, isVietnamese, { timeZone }),
    time: formatTimePart(date, isVietnamese, timeZone),
  }
}

/**
 * Full datetime for AI Hub tables/details — same shape as Staff Linked date:
 * `Jul 09, 2026 05:21 AM` / `09 Tháng 7, 2026 05:21 Sáng`.
 */
export function formatBookingHubDateTime(
  value: string | null | undefined,
  language: string = 'en',
  empty: string = BOOKING_HUB_EMPTY_CELL,
): string {
  const parts = formatBookingHubDateTimeParts(value, language)
  if (!parts) return empty
  return `${parts.date} ${parts.time}`
}

/**
 * Date part only from an API timestamp (optional year), Staff `formatDatePart` style.
 */
export function formatBookingHubTimestampDate(
  value: string | null | undefined,
  language: string = 'en',
  { withYear = true }: { withYear?: boolean } = {},
): string {
  const date = parseApiDateTime(value)
  if (!date) return BOOKING_HUB_EMPTY_CELL
  return formatDatePart(date, isBookingHubVietnamese(language), {
    timeZone: bookingHubLocalTimeZone(),
    withYear,
  })
}

/**
 * Time part only from an API timestamp, Staff `formatTimePart` style.
 */
export function formatBookingHubTimestampTime(
  value: string | null | undefined,
  language: string = 'en',
): string {
  const date = parseApiDateTime(value)
  if (!date) return BOOKING_HUB_EMPTY_CELL
  return formatTimePart(date, isBookingHubVietnamese(language), bookingHubLocalTimeZone())
}

/** Zero-pad to two digits (dates/times). */
export function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Count statuses on the **current page** list for Booking Hub status chips.
 * Intentionally page-scoped (same as Appointment Today): chips do not call BE `Status`.
 */
export function countPageItemsByStatus<TStatus extends string>(
  items: ReadonlyArray<{ status: TStatus }>,
  statusOrder: ReadonlyArray<TStatus>,
): Record<BookingHubStatusFilterAll | TStatus, number> {
  const counts = {
    [BOOKING_HUB_STATUS_FILTER_ALL]: items.length,
  } as Record<BookingHubStatusFilterAll | TStatus, number>

  for (const status of statusOrder) {
    counts[status] = 0
  }
  for (const item of items) {
    counts[item.status] = (counts[item.status] ?? 0) + 1
  }
  return counts
}

/**
 * Filter list items by status chip.
 * When used after a full collect fetch, this is the filtered “new list” for client paging.
 */
export function filterPageItemsByStatus<T extends { status: string }>(
  items: ReadonlyArray<T>,
  statusFilter: T['status'] | BookingHubStatusFilterAll,
): T[] {
  if (statusFilter === BOOKING_HUB_STATUS_FILTER_ALL) return items as T[]
  return items.filter((item) => item.status === statusFilter)
}

/** Slice a filtered list into a page window for client-side pagination. */
export function paginateItems<T>(
  items: ReadonlyArray<T>,
  pageNumber: number,
  pageSize: number,
): {
  items: T[]
  pageNumber: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
} {
  const totalCount = items.length
  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)) || 1)
  const safePage = Math.min(Math.max(1, pageNumber), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize) as T[],
    pageNumber: safePage,
    totalCount,
    totalPages,
    hasPreviousPage: safePage > 1,
    hasNextPage: safePage < totalPages,
  }
}

/** Prefer client page meta when status-filter collect is active; else server page meta. */
export function resolveBookingListPaging(
  statusFilterActive: boolean,
  clientPage: ReturnType<typeof paginateItems> | null,
  serverPage: {
    totalCount?: number
    totalPages?: number
    hasNextPage?: boolean
    hasPreviousPage?: boolean
  } | null | undefined,
) {
  if (statusFilterActive && clientPage) {
    return {
      totalCount: clientPage.totalCount,
      totalPages: clientPage.totalPages,
      hasNextPage: clientPage.hasNextPage,
      hasPreviousPage: clientPage.hasPreviousPage,
    }
  }
  return {
    totalCount: serverPage?.totalCount ?? 0,
    totalPages: serverPage?.totalPages ?? 1,
    hasNextPage: serverPage?.hasNextPage,
    hasPreviousPage: serverPage?.hasPreviousPage,
  }
}

export const BOOKING_KPI_ACCENTS = {
  electric: { '--kpi-accent': 'var(--nexora-electric)' } as React.CSSProperties,
  success: { '--kpi-accent': 'var(--nexora-success)' } as React.CSSProperties,
  red: { '--kpi-accent': 'var(--nexora-danger, #ef4444)' } as React.CSSProperties,
  brand: { '--kpi-accent': 'var(--nexora-brand)' } as React.CSSProperties,
}

/** Local calendar date as `YYYY-MM-DD` (end-user timezone via Date getters). */
export function toLocalDateIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convert a local `YYYY-MM-DD` to an inclusive UTC instant for API DateFrom/DateTo.
 * Uses the end-user timezone (not bare `T00:00:00.000Z`, which shifts the day).
 */
export function localDateIsoToUtcRange(dateIso: string, bound: 'start' | 'end'): string {
  const [year, month, day] = dateIso.split('-').map(Number)
  if (!year || !month || !day) return dateIso
  const local = bound === 'start'
    ? new Date(year, month - 1, day, 0, 0, 0, 0)
    : new Date(year, month - 1, day, 23, 59, 59, 999)
  return local.toISOString()
}

/** Keep rows whose Appointment local date (`YYYY-MM-DD`) is inside [from, to]. */
export function filterByAppointmentDate<T extends { date: string }>(
  items: ReadonlyArray<T>,
  dateFrom: string,
  dateTo: string,
): T[] {
  if (!dateFrom && !dateTo) return [...items]
  return items.filter((item) => {
    if (!item.date) return false
    if (dateFrom && item.date < dateFrom) return false
    if (dateTo && item.date > dateTo) return false
    return true
  })
}

/** Call duration as `mm:ss`; empty/invalid → `empty` (default `00:00`). */
export function formatCallDurationSeconds(
  seconds: number | null | undefined,
  empty: string = EMPTY_CALL_DURATION,
): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return empty
  const total = Math.floor(seconds)
  const minutes = String(Math.floor(total / 60)).padStart(2, '0')
  const rest = String(total % 60).padStart(2, '0')
  return `${minutes}:${rest}`
}

/**
 * Format a voice/booking phone for display.
 * @param empty Value when phone is missing (Today uses `null`, lists use `BOOKING_HUB_EMPTY_CELL`).
 */
export function formatVoicePhoneDisplay(
  phone: string | null | undefined,
  empty: string | null = '',
): string | null {
  const raw = phone?.trim()
  if (!raw) return empty

  const parsed = parsePhone(raw)
  if (isValidPhoneE164(raw, parsed.countryCode)) {
    const national = formatNationalNumber(parsed.nationalNumber, parsed.countryCode)
    if (national.replace(/\D/g, '')) {
      return `${parsed.countryCode} ${national}`.trim()
    }
  }

  return raw
}
