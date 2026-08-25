import { resolveStaffDashboardPresentation } from './staffDashboardPresentation'

describe('staff dashboard presentation', () => {
  it('uses the report title and wide content shell on the salon report route', () => {
    expect(resolveStaffDashboardPresentation('/staff/salons/report', 'salons', false)).toEqual({
      headerScreen: 'report',
      isWideContent: true,
    })
  })

  it('keeps the existing salon presentation on the salon list route', () => {
    expect(resolveStaffDashboardPresentation('/staff/salons', 'salons', false)).toEqual({
      headerScreen: 'salons',
      isWideContent: false,
    })
  })
})
