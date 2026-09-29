// Shared formatting helpers for POS customer/booking/staff displays (US-043).
// Keep display formatting identical to AI Hub so a phone does not change shape when staff move
// between the Booking and Front Desk screens.
import { formatNationalNumber, parsePhone, PhoneDialCode } from '../../../../CountryCodeSelect'

const US_NATIONAL_PHONE_PATTERN = /^(\d{3})(\d{3})(\d{4})$/

function formatUsPhone(nationalNumber: string): string | null {
  const digits = nationalNumber.replace(/\D/g, '')
  const match = US_NATIONAL_PHONE_PATTERN.exec(
    digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits,
  )
  return match ? `+1 (${match[1]}) ${match[2]}-${match[3]}` : null
}

// The backend stores the country code separately from the national number, and returns the
// assembled E.164 form alongside it. Prefer E.164 when available; a 10-digit unresolved value
// follows the POS default country and is rendered as US. Short/malformed values stay untouched.
export function formatCustomerPhone(
  nationalNumber: string | null | undefined,
  e164: string | null | undefined,
): string {
  const fallback = nationalNumber?.trim() ?? ''
  if (!e164?.trim()) return formatUsPhone(fallback) ?? fallback

  const parsed = parsePhone(e164)
  if (parsed.countryCode === PhoneDialCode.US) {
    return formatUsPhone(parsed.nationalNumber) ?? e164
  }

  const national = formatNationalNumber(parsed.nationalNumber, parsed.countryCode)
  return `${parsed.countryCode} ${national}`
}

export function maskCustomerPhone(phone?: string | null): string {
  const value = phone?.trim() ?? ''
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 4 || !/^\+?[\d\s().-]+$/.test(value)) return '****'
  return `***-***-${digits.slice(-4)}`
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
