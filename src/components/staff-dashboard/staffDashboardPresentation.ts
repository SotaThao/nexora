import { STAFF_WORK_ORDERS_SCREEN } from './constants'

const STAFF_DASHBOARD_MAIN_WIDTH = {
  default: 'max-w-3xl',
  medium: 'w-full max-w-5xl',
  wide: 'w-full max-w-6xl xl:max-w-7xl',
  workOrders: 'w-full max-w-[480px]',
} as const

const STAFF_DASHBOARD_MAIN_PADDING = {
  default: 'px-4 py-5 sm:px-6',
  workOrders: 'px-[18px] pt-[22px] pb-12',
} as const

export function resolveStaffDashboardPresentation(
  pathname: string,
  activeScreen: string,
  isVerificationSection: boolean,
) {
  const normalizedPathname = pathname.replace(/\/+$/, '')
  const isSalonReport = normalizedPathname === '/staff/salons/report'
  const isSalonList = normalizedPathname === '/staff/salons'
  const isWorkOrders = activeScreen === STAFF_WORK_ORDERS_SCREEN
  const isWideContent =
    isSalonReport
    || activeScreen === 'payments'
    || activeScreen === 'earnings'
    || isVerificationSection

  return {
    headerScreen: isSalonReport ? 'report' : activeScreen,
    isWideContent,
    mainWidthClass: isWorkOrders
      ? STAFF_DASHBOARD_MAIN_WIDTH.workOrders
      : isWideContent
        ? STAFF_DASHBOARD_MAIN_WIDTH.wide
        : isSalonList
          ? STAFF_DASHBOARD_MAIN_WIDTH.medium
          : STAFF_DASHBOARD_MAIN_WIDTH.default,
    mainPaddingClass: isWorkOrders
      ? STAFF_DASHBOARD_MAIN_PADDING.workOrders
      : STAFF_DASHBOARD_MAIN_PADDING.default,
  }
}
