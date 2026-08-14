export const TOUCHPOINT_SECTION = {
  tip: 'tip',
  payment: 'payment',
  referral: 'referral',
  staffInvite: 'staff-invite',
} as const

export type TouchpointSection =
  (typeof TOUCHPOINT_SECTION)[keyof typeof TOUCHPOINT_SECTION]

export function normalizeTouchpointSection(
  value: string | null | undefined,
): TouchpointSection {
  return value === TOUCHPOINT_SECTION.payment ||
    value === TOUCHPOINT_SECTION.referral ||
    value === TOUCHPOINT_SECTION.staffInvite
    ? value
    : TOUCHPOINT_SECTION.tip
}
