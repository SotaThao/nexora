// POS Admin demo (#589 follow-up) — nav config shared by the desktop PosSidebar and the
// mobile PosSidebarDrawer. Mirrors the approved reference (OneQR pack, "Recruitment · POS
// -> NailHub" screen): a POS group expanded under a fixed dark sidebar, with items that
// have no real page in this public demo rendered inert (see PosSidebarNavList).
const SERVICES_PATHS = ['/pos', '/pos/services', '/pos-services', '/services', '/preview/pos']

export function isPosServicesPath(pathname: string): boolean {
  return SERVICES_PATHS.includes(pathname)
}

export function isPosStaffPath(pathname: string): boolean {
  return pathname.startsWith('/pos/staff') || pathname.startsWith('/pos/recruitment')
}

export function isPosGroupActive(pathname: string): boolean {
  return isPosServicesPath(pathname) || isPosStaffPath(pathname)
}

/** The "Salon Settings" child covers both the Staff and Services public routes. */
export function isSalonSettingsActive(pathname: string): boolean {
  return isPosStaffPath(pathname) || isPosServicesPath(pathname)
}

export const SALON_SETTINGS_DEFAULT_PATH = '/pos/services'

export type PosInertItemKey = 'overview' | 'oneQr' | 'frontDesk' | 'supplies' | 'report' | 'promotions'

export const POS_INERT_ITEM_KEYS: PosInertItemKey[] = [
  'overview',
  'oneQr',
  'frontDesk',
  'supplies',
  'report',
  'promotions',
]
