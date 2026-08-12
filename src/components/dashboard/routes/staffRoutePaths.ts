export const STAFF_ROUTE_FAMILY = {
  Legacy: 'legacy',
  Settings: 'settings',
} as const

export type StaffRouteFamily =
  (typeof STAFF_ROUTE_FAMILY)[keyof typeof STAFF_ROUTE_FAMILY]

const STAFF_ROUTE_BASE: Record<StaffRouteFamily, string> = {
  [STAFF_ROUTE_FAMILY.Legacy]: '/dashboard/staff',
  [STAFF_ROUTE_FAMILY.Settings]: '/dashboard/settings/staff',
}

const LEGACY_STAFF_PATH = /^\/dashboard\/staff(?:\/[^/]+)?\/?$/
const SETTINGS_STAFF_PATH = /^\/dashboard\/settings\/staff(?:\/[^/]+)?\/?$/

export function buildStaffRoutePath(
  family: StaffRouteFamily,
  staffId?: string | null,
): string {
  const base = STAFF_ROUTE_BASE[family]
  const id = String(staffId ?? '').trim()
  return id ? `${base}/${encodeURIComponent(id)}` : base
}

export function isStaffManagementPath(pathname: string): boolean {
  return LEGACY_STAFF_PATH.test(pathname) || SETTINGS_STAFF_PATH.test(pathname)
}

export function resolveMerchantDataMenu(
  pathname: string,
  activeMenu: string,
): string {
  return isStaffManagementPath(pathname) ? 'staff' : activeMenu
}
