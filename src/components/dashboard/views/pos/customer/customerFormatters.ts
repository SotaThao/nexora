// Shared formatting helpers for the POS Front Desk "Customer" tab (US-043).
import { formatNationalNumber, parsePhone, PhoneDialCode } from '@/components/CountryCodeSelect'

// The backend stores the country code separately from the national number, and returns the
// assembled E.164 form alongside it. Always format off the E.164 value — never off the national
// number alone, which no longer carries the country code and would render a foreign number as
// if it were local. A number the backend could not resolve has no E.164 form; show it raw.
export function formatCustomerPhone(
  nationalNumber: string | null | undefined,
  e164: string | null | undefined,
): string {
  if (!e164) return nationalNumber ?? ''

  const parsed = parsePhone(e164)
  const national = formatNationalNumber(parsed.nationalNumber, parsed.countryCode)

  return parsed.countryCode === PhoneDialCode.US ? national : `${parsed.countryCode} ${national}`
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
