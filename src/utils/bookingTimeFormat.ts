/** Format an "HH:mm" (24h) time string as a locale-aware 12h AM/PM string, e.g. "09:00" -> "9:00 AM". */
export function formatHHmmTo12Hour(hhmm: string, locale = 'en-US'): string {
  const [hours, minutes] = String(hhmm || '').split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return hhmm || ''
  const date = new Date(1970, 0, 1, hours, minutes, 0, 0)
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    hourCycle: 'h12',
  }).format(date)
}
