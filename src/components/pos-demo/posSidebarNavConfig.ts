// POS Admin demo (#589 follow-up) — path helpers shared by the desktop PosSidebar and the
// mobile PosSidebarDrawer. The sidebar itself is a demo-local replica of the REAL Nexora
// owner sidebar (src/components/dashboard/layout/DashboardSidebar.tsx in vlink-nexora-fe) —
// see PosSidebarNav for the menu content.
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

export const SALON_SETTINGS_DEFAULT_PATH = '/pos/staff?staffView=recruitment'
