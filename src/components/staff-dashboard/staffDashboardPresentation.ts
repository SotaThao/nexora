const MAIN_WIDTH = {
  default: 'max-w-3xl',
  medium: 'w-full max-w-5xl',
  wide: 'w-full max-w-6xl xl:max-w-7xl',
  workOrders: 'w-full max-w-[480px]',
  workOrderDetail: 'w-full max-w-[480px] md:max-w-[640px] lg:max-w-[720px]',
} as const

const MAIN_PADDING = {
  default: 'px-4 py-5 sm:px-6',
  workOrders: 'px-[18px] pt-[22px] pb-12',
} as const

const WORK_ORDER_DETAIL_PATH = /^\/staff\/work-orders\/[^/]+\/[^/]+$/

export function resolveStaffDashboardPresentation(
  pathname: string,
  activeScreen: string,
  isVerificationSection: boolean,
) {
  const normalizedPathname = pathname.replace(/\/+$/, '')
  const isSalonReport = normalizedPathname === '/staff/salons/report'
  const isSalonList = normalizedPathname === '/staff/salons'
  const isWorkOrders = activeScreen === 'work-orders'
  const isWorkOrderDetail = WORK_ORDER_DETAIL_PATH.test(normalizedPathname)
  const isWideContent =
    isSalonReport
    || activeScreen === 'payments'
    || activeScreen === 'earnings'
    || isVerificationSection

  return {
    headerScreen: isSalonReport ? 'report' : activeScreen,
    isWideContent,
    mainWidthClass: isWorkOrderDetail
      ? MAIN_WIDTH.workOrderDetail
      : isWorkOrders
        ? MAIN_WIDTH.workOrders
        : isWideContent
          ? MAIN_WIDTH.wide
          : isSalonList
            ? MAIN_WIDTH.medium
            : MAIN_WIDTH.default,
    mainPaddingClass: isWorkOrders ? MAIN_PADDING.workOrders : MAIN_PADDING.default,
  }
}
