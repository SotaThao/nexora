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

export const DEFAULT_TOUCHPOINT_SECTION = TOUCHPOINT_SECTION.oneQr

/**
 * Missing / unknown `?section=` values land on OneQR: clicking Stations & QR
 * Codes in the sidebar opens the OneQR builder. Other sections are opted into
 * via `?section=tip` (etc.).
 */
export function normalizeTouchpointSection(
  value: string | null | undefined,
): TouchpointSection {
  return KNOWN_SECTIONS.includes(value as TouchpointSection)
    ? (value as TouchpointSection)
    : DEFAULT_TOUCHPOINT_SECTION
}

/** Query string for `/dashboard/touchpoints` — defaults the stations tab to OneQR. */
export function buildTouchpointsSearch(options?: {
  tab?: string
  section?: string
}): string {
  const tab = options?.tab || 'stations'
  const params = new URLSearchParams()
  params.set('tab', tab)
  if (tab === 'stations') {
    params.set('section', normalizeTouchpointSection(options?.section))
  }
  return params.toString()
}
