/** Format a Date as YYYY-MM-DD in local timezone (avoids UTC day shift from toISOString). */
export function formatLocalDateIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
