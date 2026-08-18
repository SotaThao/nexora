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
