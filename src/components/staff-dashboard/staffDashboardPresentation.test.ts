import { resolveStaffDashboardPresentation } from './staffDashboardPresentation'

describe('staff dashboard presentation', () => {
  it('uses the report title and wide content shell on the salon report route', () => {
    expect(resolveStaffDashboardPresentation('/staff/salons/report', 'salons', false)).toEqual({
      headerScreen: 'report',
      isWideContent: true,
      mainWidthClass: 'w-full max-w-6xl xl:max-w-7xl',
      mainPaddingClass: 'px-4 py-5 sm:px-6',
    })
  })

  it('keeps the existing salon presentation on the salon list route', () => {
    expect(resolveStaffDashboardPresentation('/staff/salons', 'salons', false)).toEqual({
      headerScreen: 'salons',
      isWideContent: false,
      mainWidthClass: 'w-full max-w-5xl',
      mainPaddingClass: 'px-4 py-5 sm:px-6',
    })
  })

  it('uses the mobile work-orders column and page padding', () => {
    expect(resolveStaffDashboardPresentation(
      '/staff/work-orders/35caee40-cd8e-4b24-861b-f475f2b8ed9f',
      'work-orders',
      false,
    )).toEqual({
      headerScreen: 'work-orders',
      isWideContent: false,
      mainWidthClass: 'w-full max-w-[480px]',
      mainPaddingClass: 'px-[18px] pt-[22px] pb-12',
    })
  })

  it('uses a wider column on work-order ticket detail', () => {
    expect(resolveStaffDashboardPresentation(
      '/staff/work-orders/35caee40-cd8e-4b24-861b-f475f2b8ed9f/c7331eeb-7986-4af7-a123-8bcff7eace82',
      'work-orders',
      false,
    )).toEqual({
      headerScreen: 'work-orders',
      isWideContent: false,
      mainWidthClass: 'w-full max-w-[480px] md:max-w-[640px] lg:max-w-[720px]',
      mainPaddingClass: 'px-[18px] pt-[22px] pb-12',
    })
  })
})
