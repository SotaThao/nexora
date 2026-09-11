// POS Booking sends the picked wall-clock numbers to the backend unshifted: business hours
// and PosStaffWeeklySchedule are naive TimeOnly values with no timezone concept, so building
// the instant with Date.UTC (never the local-timezone Date constructor) keeps 2:00 PM as
// 2:00 PM instead of silently comparing against another hour.
export function toBookingWallClockIso(date: string, time: string): string | undefined {
  if (!date || !time) return undefined
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  if ([year, month, day, hour, minute].some((part) => !Number.isFinite(part))) return undefined
  return new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString()
}
