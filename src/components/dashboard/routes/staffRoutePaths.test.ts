import {
  buildStaffRoutePath,
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
})
