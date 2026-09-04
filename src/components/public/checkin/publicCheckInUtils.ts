// The one piece of public-check-in logic that is not the shared module's: reading the salon's
// wall clock out of a booking instant.
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
