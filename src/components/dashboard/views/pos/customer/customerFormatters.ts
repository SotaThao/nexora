// Shared formatting helpers for POS customer/booking/staff displays (US-043).
// Keep display formatting identical to AI Hub so a phone does not change shape when staff move
// between the Booking and Front Desk screens.
import { formatVoicePhoneDisplay } from '../../bookingHubFormatters'

// The backend stores the country code separately from the national number, and returns the
// assembled E.164 form alongside it. Prefer that canonical value; when it is unavailable, use
// AI Hub's validated national/raw fallback so a 10-digit US value still gets display formatting.
export function formatCustomerPhone(
  nationalNumber: string | null | undefined,
  e164?: string | null,
): string {
  // Prefer the canonical E.164 value when the API resolved it; otherwise apply the same
  // validation/fallback path AI Hub uses for a national/raw phone value.
  return formatVoicePhoneDisplay(e164?.trim() || nationalNumber?.trim(), '') ?? ''
}

// DateOfBirth is a backend DateOnly ("YYYY-MM-DD", no time component) — a calendar date with
// no timezone meaning. Never run it through a UTC-to-local Date conversion (see
// feedback_frontend_datetime_timezone_naive): `new Date("2000-01-01")` is UTC midnight, which
// shifts a day backward once converted to any timezone behind UTC. Parse the digits directly.
export function formatDateOnly(value?: string | null): string {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null
  if (!match) return '—'
  const [, year, month, day] = match
  return `${month}/${day}/${year}`
}
