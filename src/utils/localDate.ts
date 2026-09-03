/** Format a Date as YYYY-MM-DD in local timezone (avoids UTC day shift from toISOString). */
export function formatLocalDateIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** YYYY-MM-DD in an IANA zone (salon calendar day). Falls back to the runtime local zone. */
export function formatDateIsoInTimeZone(date: Date, timeZone?: string | null): string {
  const zone = timeZone?.trim()
  if (!zone) return formatLocalDateIso(date)
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
    const year = get('year')
    const month = get('month')
    const day = get('day')
    if (!year || !month || !day) return formatLocalDateIso(date)
    return `${year}-${month}-${day}`
  } catch {
    return formatLocalDateIso(date)
  }
}

/**
 * Parse BE datetime strings. Wire values often omit `Z` / offset but are UTC
 * (e.g. `2026-09-06T01:26:32.369146`). Treat bare ISO as UTC, then callers
 * format with local getters / Intl for the user's timezone.
 */
export function parseApiUtcDateTime(isoString: string | null | undefined): Date | null {
  const raw = String(isoString ?? '').trim()
  if (!raw) return null

  if (/[zZ]$/.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw)) {
    const date = new Date(raw)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (raw.includes(' ') && !raw.includes('T')) {
    const date = new Date(`${raw.replace(' ', 'T')}Z`)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const date = new Date(`${raw}Z`)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T00:00:00Z`)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Format ISO datetime as locale-aware "Apr 2024" / "thg 4 2024" for member-since labels. */
export function formatMemberSinceDate(
  isoString: string | null | undefined,
  language: string = 'en',
): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'
  return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' })
}

/** Sáng/Chiều (VI) or am/pm (EN) for the given date's local hour. Shared by every date+time formatter below so the Sáng/Chiều cutoff (hour < 12) never drifts between them. */
export function getMeridiem(date: Date, isVietnamese: boolean): string {
  return date.getHours() < 12
    ? (isVietnamese ? 'Sáng' : 'am')
    : (isVietnamese ? 'Chiều' : 'pm')
}

/**
 * Shared date-part formatter — "MMM DD, YYYY" (EN) / "DD Tháng M, YYYY" (VI), or without the
 * year when `withYear` is false. `timeZone` pins the render to a specific IANA zone (e.g. for
 * API timestamps); omit it to use the runtime's local zone.
 */
export function formatDatePart(
  date: Date,
  isVietnamese: boolean,
  { timeZone, withYear = true }: { timeZone?: string; withYear?: boolean } = {},
): string {
  const parts = new Intl.DateTimeFormat(isVietnamese ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: isVietnamese ? 'numeric' : 'short',
    ...(withYear ? { year: 'numeric' as const } : {}),
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const year = withYear ? `, ${get('year')}` : ''
  return isVietnamese
    ? `${get('day')} Tháng ${get('month')}${year}`
    : `${get('month')} ${get('day')}${year}`
}

/** Shared time-part formatter — "hh:mm am/pm" (EN) / "hh:mm sáng/chiều" (VI). hourCycle is forced to h12 — ICU defaults vi-VN to h11 (would render "00:05" instead of "12:05"). */
export function formatTimePart(date: Date, isVietnamese: boolean, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat(isVietnamese ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h12',
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('hour')}:${get('minute')} ${getMeridiem(date, isVietnamese)}`
}

/** Format ISO date (no time), e.g. "Jun 03, 2026" (EN) / "03 Tháng 6, 2026" (VI). Use for screens that only need a date, not a time. */
export function formatDateOnly(
  isoString: string | null | undefined,
  language: string = 'en',
): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''

  return formatDatePart(date, language.toLowerCase().startsWith('vi'))
}

export function formatJoinedDate(isoString: string | null | undefined): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return isoString

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getMonth()]
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()

  let h = date.getHours()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  h = h ? h : 12 // the hour '0' should be '12'

  const hours = String(h).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`
}
