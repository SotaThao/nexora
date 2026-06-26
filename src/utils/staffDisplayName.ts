/** Staff `displayName` constraints per API (accept invite, join-public-invite, PUT /staff/profile). */
export const STAFF_DISPLAY_NAME_MIN_LENGTH = 2
export const STAFF_DISPLAY_NAME_MAX_LENGTH = 100

export function getStaffDisplayNameErrorCode(name: string): string | null {
  const trimmed = String(name || '').trim()
  if (!trimmed) return 'STAFF_DISPLAY_NAME_REQUIRED'
  if (trimmed.length < STAFF_DISPLAY_NAME_MIN_LENGTH) return 'STAFF_DISPLAY_NAME_TOO_SHORT'
  if (trimmed.length > STAFF_DISPLAY_NAME_MAX_LENGTH) return 'STAFF_DISPLAY_NAME_TOO_LONG'
  return null
}

export function isStaffDisplayNameValid(name: string): boolean {
  return getStaffDisplayNameErrorCode(name) === null
}
