import {
  STAFF_WORKSPACE_SUBMENU,
  isStaffWorkspaceSubActive,
} from './constants'

describe('staff salon report navigation', () => {
  it('exposes the salon report as a workspace submenu route', () => {
    expect(STAFF_WORKSPACE_SUBMENU).toContainEqual(
      expect.objectContaining({ id: 'report', screen: 'salons/report' }),
    )
  })

  it('activates only the matching salon submenu for list and report routes', () => {
    const salonsItem = STAFF_WORKSPACE_SUBMENU.find((item) => item.id === 'my_salons')!
    const reportItem = STAFF_WORKSPACE_SUBMENU.find((item) => item.id === 'report')!

    expect(isStaffWorkspaceSubActive('salons', null, salonsItem, '/staff/salons')).toBe(true)
    expect(isStaffWorkspaceSubActive('salons', null, reportItem, '/staff/salons')).toBe(false)
    expect(isStaffWorkspaceSubActive('salons', null, salonsItem, '/staff/salons/report')).toBe(false)
    expect(isStaffWorkspaceSubActive('salons', null, reportItem, '/staff/salons/report')).toBe(true)
  })
})
