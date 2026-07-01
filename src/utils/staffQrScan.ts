export function extractStaffSearchValueFromQrText(value: string): string {
  const text = value.trim()
  if (!text) return ''

  if (text.includes('@')) return text

  try {
    const parsed = new URL(text)
    const staffKeys = ['staff', 'staffCode', 'staffProfileId', 'staffId', 'code', 'id']
    for (const key of staffKeys) {
      const queryValue = parsed.searchParams.get(key)
      if (queryValue?.trim()) return queryValue.trim()
    }

    const segments = parsed.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1] || ''
    if (last && !['touch', 'staff', 'invite'].includes(last.toLowerCase())) {
      if (/^[a-zA-Z0-9@._+\-]{3,}$/.test(last)) return last
    }
  } catch {
    // Plain text payloads are handled below.
  }

  return text
}
