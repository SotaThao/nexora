import {
  buildStaffRoutePath,
  isStaffManagementPath,
  resolveMerchantDataMenu,
  STAFF_ROUTE_FAMILY,
} from './staffRoutePaths'

describe('merchant Staff route paths', () => {
  it('builds list and detail paths for both route families', () => {
    expect(buildStaffRoutePath(STAFF_ROUTE_FAMILY.Legacy)).toBe('/dashboard/staff')
    expect(buildStaffRoutePath(STAFF_ROUTE_FAMILY.Legacy, 'NEX-STAFF-1')).toBe(
      '/dashboard/staff/NEX-STAFF-1',
    )
    expect(buildStaffRoutePath(STAFF_ROUTE_FAMILY.Settings)).toBe(
      '/dashboard/settings/staff',
    )
    expect(buildStaffRoutePath(STAFF_ROUTE_FAMILY.Settings, 'NEX STAFF/1')).toBe(
      '/dashboard/settings/staff/NEX%20STAFF%2F1',
    )
  })

  it.each([
    '/dashboard/staff',
    '/dashboard/staff/NEX-1',
    '/dashboard/settings/staff',
    '/dashboard/settings/staff/NEX-1',
  ])('classifies %s as Staff management', (pathname) => {
    expect(isStaffManagementPath(pathname)).toBe(true)
    expect(resolveMerchantDataMenu(pathname, 'settings')).toBe('staff')
  })

  it.each([
    '/dashboard/settings/profile',
    '/dashboard/settings/affiliate',
    '/dashboard/pos/staff',
    '/staff/profile',
  ])('does not classify %s as merchant Staff management', (pathname) => {
    expect(isStaffManagementPath(pathname)).toBe(false)
  })

  it('keeps the active menu for unrelated routes', () => {
    expect(resolveMerchantDataMenu('/dashboard/settings/profile', 'settings')).toBe(
      'settings',
    )
  })
})
