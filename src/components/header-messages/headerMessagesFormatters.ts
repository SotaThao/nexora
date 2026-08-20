export const HEADER_MESSAGES_LOCALE_VI = 'vi-VN' as const
export const HEADER_MESSAGES_LOCALE_EN = 'en-US' as const
export const HEADER_MESSAGES_LANGUAGE_VI = 'vi' as const

export function getHeaderMessagesIntlLocale(language: string): string {
  return language === HEADER_MESSAGES_LANGUAGE_VI
    ? HEADER_MESSAGES_LOCALE_VI
    : HEADER_MESSAGES_LOCALE_EN
}

export function formatHeaderMessageDateTime(value: string, language: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(getHeaderMessagesIntlLocale(language), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatHeaderMessageChatTime(value: string, language: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat(getHeaderMessagesIntlLocale(language), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}
