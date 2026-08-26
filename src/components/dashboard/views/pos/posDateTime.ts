// Thin POS wrapper over the shared date/time core (parseApiDateTime + formatDatePart/
// formatTimePart), the same building blocks Staff's DateTimeCell/formatTransactionDateTime
// and AI Hub's bookingHubFormatters.ts already use — mirrors that pattern instead of
// duplicating it. parseApiDateTime treats an API timestamp with no "Z"/offset as UTC before
// parsing, which matters here: PosOrder.CompletedAt / PosOrderItem.AssignedAt are genuine
// DateTime.UtcNow values that round-trip through a Postgres "timestamp without time zone"
// column and serialize without a trailing "Z".
import { parseApiDateTime } from '../../utils'
import { formatDatePart, formatTimePart } from '../../../../utils/localDate'

function posLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function isVietnamese(language: string): boolean {
  return String(language || 'en').toLowerCase().startsWith('vi')
}

/** Time-only display for a genuine UTC API timestamp (e.g. Turn Board "serving since"). */
export function formatPosTime(iso: string | null | undefined, language: string = 'en'): string {
  const date = parseApiDateTime(iso)
  if (!date) return ''
  return formatTimePart(date, isVietnamese(language), posLocalTimeZone())
}

/** Date+time display for a genuine UTC API timestamp (Completed Orders, Booking createdAt). */
export function formatPosDateTime(
  iso: string | null | undefined,
  language: string = 'en',
  { withYear = true, empty = '—' }: { withYear?: boolean; empty?: string } = {},
): string {
  const date = parseApiDateTime(iso)
  if (!date) return empty
  const timeZone = posLocalTimeZone()
  const vietnamese = isVietnamese(language)
  return `${formatDatePart(date, vietnamese, { timeZone, withYear })} ${formatTimePart(date, vietnamese, timeZone)}`
}
