export const PosSalonSettingsTab = {
  SalonInformation: 'salon-information',
  Staff: 'staff',
  Services: 'services',
  RolesPermissions: 'roles-permissions',
  StaffLevels: 'staff-levels',
  Sms: 'sms',
} as const

export type PosSalonSettingsTab =
  (typeof PosSalonSettingsTab)[keyof typeof PosSalonSettingsTab]

export function isPosSalonSettingsTab(value?: string): value is PosSalonSettingsTab {
  return Object.values(PosSalonSettingsTab).includes(value as PosSalonSettingsTab)
}

export function posSalonSettingsPath(tab: PosSalonSettingsTab): string {
  return `/dashboard/pos/settings/${tab}`
}
