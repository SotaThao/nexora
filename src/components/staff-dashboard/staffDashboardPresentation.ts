const MAIN_WIDTH = {
  default: 'max-w-3xl',
  medium: 'w-full max-w-5xl',
  wide: 'w-full max-w-6xl xl:max-w-7xl',
} as const

export function resolveStaffDashboardPresentation(
  pathname: string,
  activeScreen: string,
  isVerificationSection: boolean,
) {
  const normalizedPathname = pathname.replace(/\/+$/, '')
  const isSalonReport = normalizedPathname === '/staff/salons/report'
  const isSalonList = normalizedPathname === '/staff/salons'
  const isWideContent =
    isSalonReport
    || activeScreen === 'payments'
    || activeScreen === 'earnings'
    || isVerificationSection

  return {
    headerScreen: isSalonReport ? 'report' : activeScreen,
    isWideContent,
    mainWidthClass: isWideContent
      ? MAIN_WIDTH.wide
      : isSalonList
        ? MAIN_WIDTH.medium
        : MAIN_WIDTH.default,
  }
}
