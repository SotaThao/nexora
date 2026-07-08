export const MASTER_TOUCHPOINT_NAME = 'Master Store'
export const MASTER_TOUCHPOINT_SLUG = 'master-store'
export const MASTER_TOUCHPOINT_API_TYPE = 'FrontDesk'

export const TOUCHPOINT_UI_TYPES = {
  MASTER_STORE: MASTER_TOUCHPOINT_NAME,
  TABLE_QR: 'Table QR',
  FRONT_DESK: 'Front Desk',
  RECEIPT_QR: 'Receipt QR',
  BUSINESS_MAIN: 'Business Main',
  STAFF_QR: 'Staff QR',
} as const

export const DEFAULT_TOUCHPOINT_TYPE = TOUCHPOINT_UI_TYPES.MASTER_STORE

export const TOUCHPOINT_TYPE_OPTIONS = Object.values(TOUCHPOINT_UI_TYPES).map((value) => ({
  value,
  label: value,
}))

export const TOUCHPOINT_API_TYPE_BY_UI_TYPE = {
  [TOUCHPOINT_UI_TYPES.MASTER_STORE]: MASTER_TOUCHPOINT_API_TYPE,
  [TOUCHPOINT_UI_TYPES.FRONT_DESK]: MASTER_TOUCHPOINT_API_TYPE,
  [TOUCHPOINT_UI_TYPES.BUSINESS_MAIN]: MASTER_TOUCHPOINT_API_TYPE,
  [TOUCHPOINT_UI_TYPES.TABLE_QR]: 'Table',
  [TOUCHPOINT_UI_TYPES.RECEIPT_QR]: 'Receipt',
  [TOUCHPOINT_UI_TYPES.STAFF_QR]: 'StaffCard',
} as const

type TouchpointLike = {
  slug?: string | null
  type?: string | null
  name?: string | null
}

export function getTouchpointApiType(type: unknown): string {
  const normalizedType = typeof type === 'string' ? type.trim() : ''
  return (
    TOUCHPOINT_API_TYPE_BY_UI_TYPE[
      normalizedType as keyof typeof TOUCHPOINT_API_TYPE_BY_UI_TYPE
    ] ?? TOUCHPOINT_API_TYPE_BY_UI_TYPE[TOUCHPOINT_UI_TYPES.TABLE_QR]
  )
}

export function isMasterTouchpoint(point: TouchpointLike = {}): boolean {
  const slug = typeof point.slug === 'string' ? point.slug.trim().toLowerCase() : ''
  if (slug) return slug === MASTER_TOUCHPOINT_SLUG

  const type = typeof point.type === 'string' ? point.type.trim() : ''
  const name = typeof point.name === 'string' ? point.name.trim() : ''

  return (
    type === MASTER_TOUCHPOINT_API_TYPE ||
    type === TOUCHPOINT_UI_TYPES.FRONT_DESK ||
    name === MASTER_TOUCHPOINT_NAME
  )
}
