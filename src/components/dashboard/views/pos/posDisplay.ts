// Small display helpers shared by POS front-desk screens.

/** Shown wherever a value is legitimately absent (no technician yet, no ticket in progress). */
export const EMPTY_VALUE = '—'

const MAX_INITIALS = 2

/** Avatar initials — the POS iPad standard uses initials, never a photo placeholder. */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/** Comma-joined list, or the empty placeholder when there is nothing to show. */
export function joinOrEmpty(values: string[] | null | undefined): string {
  return values && values.length > 0 ? values.join(', ') : EMPTY_VALUE
}

/** Formats the salon address for receipt headers without dropping locality fields. */
export function formatBusinessAddress(parts: {
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
}): string {
  const clean = (value?: string | null) => value?.trim() || ''
  const street = clean(parts.address)
  const city = clean(parts.city)
  const state = clean(parts.state)
  const zipCode = clean(parts.zipCode)
  const country = clean(parts.country)
  const stateAndZip = [state, zipCode].filter(Boolean).join(' ')

  return [street, city, stateAndZip, country].filter(Boolean).join(', ')
}
