import { parseApiUtcDateTime } from '../../utils/localDate'

export const HEADER_MESSAGES_LOCALE_VI = 'vi-VN' as const
export const HEADER_MESSAGES_LOCALE_EN = 'en-US' as const
export const HEADER_MESSAGES_LANGUAGE_VI = 'vi' as const

export function getHeaderMessagesIntlLocale(language: string): string {
  return language === HEADER_MESSAGES_LANGUAGE_VI
    ? HEADER_MESSAGES_LOCALE_VI
    : HEADER_MESSAGES_LOCALE_EN
}

/** Browser / OS timezone of the signed-in user (IANA). */
export function getHeaderMessagesUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

/**
 * Community chat API timestamps are UTC (often without `Z`).
 * Parse as UTC, then format in the user's local timezone.
 */
function parseHeaderMessageInstant(value: string | null | undefined): Date | null {
  return parseApiUtcDateTime(value)
}

export function formatHeaderMessageDateTime(value: string, language: string): string {
  const date = parseHeaderMessageInstant(value)
  if (!date) return ''

  return new Intl.DateTimeFormat(getHeaderMessagesIntlLocale(language), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: getHeaderMessagesUserTimeZone(),
  }).format(date)
}

export function formatHeaderMessageChatTime(value: string, language: string): string {
  const date = parseHeaderMessageInstant(value)
  if (!date) return ''

  return new Intl.DateTimeFormat(getHeaderMessagesIntlLocale(language), {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: getHeaderMessagesUserTimeZone(),
  }).format(date)
}

/** Local calendar day key (`YYYY-MM-DD`) for grouping messages in the thread. */
export function formatHeaderMessageLocalDayKey(value: string): string {
  const date = parseHeaderMessageInstant(value)
  if (!date) return String(value ?? '').slice(0, 10)

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: getHeaderMessagesUserTimeZone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}
