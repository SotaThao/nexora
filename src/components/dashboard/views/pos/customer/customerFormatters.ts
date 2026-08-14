// Shared formatting helpers for the POS Front Desk "Customer" tab (US-043).
//
// Customer.Phone is stored digits-only (10-digit US) on the backend — see
// CustomerMatchHelper / PhoneHelper.NormalizePhone — unlike PosOrder.CustomerPhone, which is
// stored pre-formatted. This only formats for display; it never touches what's sent to the API.
export function formatCustomerPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length !== 10) return phone
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
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
