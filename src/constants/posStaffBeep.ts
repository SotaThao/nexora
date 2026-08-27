/**
 * PosStaffBeep — mirrors backend Nexora.Domain.Enums.Pos.PosStaffBeepStatus and
 * PosStaffBeepResponse. The only place these wire strings appear as literals; every component,
 * hook and repository comparison goes through here.
 *
 * Expired is never stored server-side — it is computed at read time from the silence window, so a
 * beep flips to it without anything writing a row.
 */
export enum PosStaffBeepStatus {
  Sent = 'Sent',
  Acknowledged = 'Acknowledged',
  Delayed = 'Delayed',
  Declined = 'Declined',
  Resolved = 'Resolved',
  Expired = 'Expired',
}

/** What the tech tapped. Sent/Resolved/Expired are deliberately not expressible here. */
export enum PosStaffBeepResponse {
  OnMyWay = 'OnMyWay',
  Busy = 'Busy',
  CantCome = 'CantCome',
}

/**
 * Fallback for the "Busy — X minutes" chips. The server sends `allowedDelayMinutes` on
 * /staff/beeps/active and that value wins: it is the same array the validator checks against, so
 * the buttons can never offer a delay the API would reject.
 */
export const POS_BEEP_DELAY_MINUTES_FALLBACK: readonly number[] = [2, 5, 10]

/** Matches [MaxLength(500)] on PosStaffBeep.ResponseNote. */
export const POS_BEEP_NOTE_MAX_LENGTH = 500

/** A call the front desk has not closed and that has not timed out. */
export function isBeepOpen(status: string | null | undefined): boolean {
  return (
    status === PosStaffBeepStatus.Sent ||
    status === PosStaffBeepStatus.Acknowledged ||
    status === PosStaffBeepStatus.Delayed ||
    status === PosStaffBeepStatus.Declined
  )
}

/** Still waiting on the tech — nothing has come back yet. */
export function isBeepAwaitingStaff(status: string | null | undefined): boolean {
  return status === PosStaffBeepStatus.Sent
}

/**
 * "Busy — 5 min" whose 5 minutes are up. Derived on the client rather than asked of the server:
 * it needs no new field and no extra state in the status machine, and both sides recompute it on
 * their own poll.
 */
export function isDelayLapsed(
  status: string | null | undefined,
  respondedAt: Date | null | undefined,
  delayMinutes: number | null | undefined,
  now: Date = new Date(),
): boolean {
  if (status !== PosStaffBeepStatus.Delayed) return false
  if (!respondedAt || !delayMinutes) return false
  return respondedAt.getTime() + delayMinutes * 60_000 <= now.getTime()
}
