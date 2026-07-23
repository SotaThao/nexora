import type React from 'react'
import {
  formatNationalNumber,
  isValidPhoneE164,
  parsePhone,
} from '../../CountryCodeSelect'

export const EMPTY_CALL_DURATION = '00:00'

/** Placeholder when a Booking Hub table cell has no value. */
export const BOOKING_HUB_EMPTY_CELL = '_' as const

/** Chip filter value: show every status on the current page (UI-only, not sent to BE). */
export const BOOKING_HUB_STATUS_FILTER_ALL = 'all' as const

export type BookingHubStatusFilterAll = typeof BOOKING_HUB_STATUS_FILTER_ALL

/** Shared className for Booking Hub Pagination (matches `booking-hub.css`). */
export const BOOKING_HUB_PAGINATION_CLASSNAME = 'booking-pagination' as const

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
 * Filter the **current page** list by status chip.
 * Does not refetch or change paging — BE list query stays page/search only.
 */
export function filterPageItemsByStatus<T extends { status: string }>(
  items: ReadonlyArray<T>,
  statusFilter: T['status'] | BookingHubStatusFilterAll,
): T[] {
  if (statusFilter === BOOKING_HUB_STATUS_FILTER_ALL) return items as T[]
  return items.filter((item) => item.status === statusFilter)
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
