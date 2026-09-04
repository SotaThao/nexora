// The pieces of public-check-in logic that are not the shared module's: wall-clock labels,
// and the path back to the keypad from the status page (which is addressed by receipt token
// alone, so it does not know the salon slug on its own).
const LAST_SLUG_STORAGE_KEY = 'nexora.publicCheckIn.businessSlug'

export function rememberPublicCheckInSlug(businessSlug: string): void {
  try {
    sessionStorage.setItem(LAST_SLUG_STORAGE_KEY, businessSlug)
  } catch {
    // Private mode can throw; the return path then relies on location.state only.
  }
}

export function readPublicCheckInSlug(): string | null {
  try {
    return sessionStorage.getItem(LAST_SLUG_STORAGE_KEY)
  } catch {
    return null
  }
}

export function publicCheckInPagePath(businessSlug: string): string {
  return `/checkin/${businessSlug}`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Wall-clock time out of an ISO instant, read via UTC getters — the same rule as
 * ManageBookingPage/ConfirmationScreen. This feature has no genuine per-business timezone
 * concept, so converting to the viewer's local zone would shift the salon's own time, and the
 * viewer here really can be in another zone (a customer's own phone, not a device in the salon).
 */
export function formatBookingWallClockTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const hours24 = date.getUTCHours()
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${hours12}:${pad(date.getUTCMinutes())} ${period}`
}
