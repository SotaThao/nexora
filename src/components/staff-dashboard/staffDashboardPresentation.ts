export function resolveStaffDashboardPresentation(
  pathname: string,
  activeScreen: string,
  isVerificationSection: boolean,
) {
  const normalizedPathname = pathname.replace(/\/+$/, '')
  const isSalonReport = normalizedPathname === '/staff/salons/report'

  return {
    headerScreen: isSalonReport ? 'report' : activeScreen,
    isWideContent:
      isSalonReport
      || activeScreen === 'payments'
      || activeScreen === 'earnings'
      || isVerificationSection,
  }
}
