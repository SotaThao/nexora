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

/** The front desk's optional message on a beep — the textarea limit and the clamp on a saved one. */
export const POS_BEEP_MESSAGE_MAX_LENGTH = 200

/**
 * Front-desk quick messages the salon typed itself, kept on this device.
 *
 * Device-local rather than business-level for the same reason as the printer profile
 * (`POS_PRINTER_PROFILE_STORAGE_KEY` in `posPrinter.ts`): there is no beep-suggestion endpoint,
 * and the wording that helps is the wording of the iPad it is typed on ("station 2" means nothing
 * on the back-office machine). Key naming follows `pos_printer_profile_v1`; `storage.ts` prefixes
 * it with `nexora_v3_`.
 */
export const POS_BEEP_SUGGESTIONS_STORAGE_KEY = 'pos_beep_suggestions_v1'

/**
 * Cap on saved quick messages. The chips sit above the textarea in a modal that must still fit an
 * iPad in portrait, so the list has to stop growing somewhere; the modal disables Save at the cap
 * and asks for a removal instead of silently dropping the oldest.
 */
export const POS_BEEP_SAVED_SUGGESTIONS_MAX = 12

/**
 * Trims a typed message down to what a chip can hold: one line, and no longer than the beep
 * textarea itself allows. Empty means there is nothing worth saving.
 *
 * Newlines collapse rather than survive — the chip renders on one line, and a suggestion that
 * looks like one line here but arrives as three on the tech's phone is a surprise.
 */
export function normalizeBeepSuggestion(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, POS_BEEP_MESSAGE_MAX_LENGTH)
}

/**
 * What "already a quick message" means, for both the built-in five and the saved ones. Case- and
 * whitespace-insensitive so the same sentence typed again with a capital letter or a stray double
 * space does not earn a second chip that looks identical to the first.
 */
export function beepSuggestionKey(value: string): string {
  return normalizeBeepSuggestion(value).toLowerCase()
}

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

/**
 * A local staff member (added manually, no linked user account) or one with no email on file has
 * no app to ring — sending a beep would always land as undelivered. Checked from the check-in
 * technician list (`CheckInTechnicianApiDto`) since neither `isLocalStaff` nor `email` is on the
 * roster/turn-board/beep-feed responses yet; both fields are optional there pending a BE contract
 * update, so a technician absent from that list (or fetched before BE ships the fields) reads as
 * "not local" rather than blocking every Beep button.
 */
export function cannotReceiveBeep(
  technician: { isLocalStaff?: boolean; email?: string | null } | undefined,
): boolean {
  if (!technician) return false
  return technician.isLocalStaff === true || technician.email === null
}

/** NotificationType.PosStaffBeep — the front desk ringing this tech (the feed row for a call). */
export const POS_STAFF_BEEP_NOTIFICATION_TYPE = 'PosStaffBeep'

function normalizeBeepTypeKey(value: string | null | undefined): string {
  return String(value ?? '').toLowerCase().replace(/[\s_-]+/g, '')
}

/**
 * True only for the call itself, never for `PosStaffBeepResponse` — that one is the front desk's
 * copy of the tech's answer and has no sheet to reopen.
 */
export function isPosStaffBeepNotification(type: string | null | undefined): boolean {
  return normalizeBeepTypeKey(type) === normalizeBeepTypeKey(POS_STAFF_BEEP_NOTIFICATION_TYPE)
}
