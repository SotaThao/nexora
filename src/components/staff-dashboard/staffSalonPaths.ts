import { withStaffChatStartHint } from '../staff/constants'

export const STAFF_SALONS_PATH = '/staff/salons' as const

export function buildStaffSalonsListPath(options?: { startChatHint?: boolean }): string {
  return withStaffChatStartHint(STAFF_SALONS_PATH, options?.startChatHint)
}
