import DOMPurify from 'dompurify'

/**
 * Sanitize user-provided free text before it is sent to the API / persisted.
 *
 * We strip ALL HTML — review comments and similar fields are plain text, so any
 * markup is unwanted and a potential stored-XSS vector for non-React consumers
 * (admin panels, email templates, exports) that don't auto-escape like JSX does.
 *
 * @param value Raw user input.
 * @returns Trimmed plain-text string with all tags/markup removed.
 */
export function sanitizePlainText(value: string | null | undefined): string {
  if (!value) return ''
  const stripped = DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
  return stripped.trim()
}
