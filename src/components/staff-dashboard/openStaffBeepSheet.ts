// Reopening the beep sheet from outside it. The sheet itself lives in the staff shell
// (StaffBeepAlert) and owns which calls the tech has closed or minimised on this device, so the
// notification feed asks for it by event rather than by sharing that state — same pattern as
// openCommunityChatSession.ts for the header messenger.
import { isPosStaffBeepNotification } from '../../constants/posStaffBeep'

export const OPEN_STAFF_BEEP_SHEET_EVENT = 'nexora:open-staff-beep-sheet' as const

/** Ask the staff shell to bring the beep sheet back (un-dismiss + un-minimise). */
export function openStaffBeepSheet(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_STAFF_BEEP_SHEET_EVENT))
}

/** Reopen from a notification row. Returns true when the row was a beep and was handled here. */
export function openStaffBeepSheetFromNotification(
  notification: { type?: string | null } | null | undefined,
): boolean {
  if (!isPosStaffBeepNotification(notification?.type)) return false
  openStaffBeepSheet()
  return true
}
