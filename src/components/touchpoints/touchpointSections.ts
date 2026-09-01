export const TOUCHPOINT_SECTION = {
  oneQr: 'one-qr',
  tip: 'tip',
  payment: 'payment',
  referral: 'referral',
  staffInvite: 'staff-invite',
} as const

export type TouchpointSection =
  (typeof TOUCHPOINT_SECTION)[keyof typeof TOUCHPOINT_SECTION]

const KNOWN_SECTIONS: TouchpointSection[] = [
  TOUCHPOINT_SECTION.oneQr,
  TOUCHPOINT_SECTION.tip,
  TOUCHPOINT_SECTION.payment,
  TOUCHPOINT_SECTION.referral,
  TOUCHPOINT_SECTION.staffInvite,
]

/**
 * `tip` stays the default: existing links, bookmarks and the sidebar entry all
 * land on the tip-station list, and OneQR is opted into explicitly via
 * `?section=one-qr`.
 */
export function normalizeTouchpointSection(
  value: string | null | undefined,
): TouchpointSection {
  return KNOWN_SECTIONS.includes(value as TouchpointSection)
    ? (value as TouchpointSection)
    : TOUCHPOINT_SECTION.tip
}
