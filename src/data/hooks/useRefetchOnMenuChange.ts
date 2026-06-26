import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'

type QueryKeyPrefix = readonly unknown[]

/** Query prefixes to invalidate when the merchant opens each dashboard menu. */
const MERCHANT_MENU_QUERIES: Record<string, QueryKeyPrefix[]> = {
  overview: [
    qk.dashboardOverview(),
    qk.transactions(),
    qk.merchantStaff(),
    qk.merchantTouchpoints(),
    ['dashboard', 'reviews'],
  ],
  staff: [
    qk.merchantStaff(),
    qk.merchantInviteLink(),
  ],
  tips: [
    qk.transactions(),
    ['transactions', 'paginated'],
    qk.dashboardOverview(),
    qk.dashboardTipsChart(),
  ],
  reports: [
    qk.transactions(),
    ['transactions', 'paginated'],
    qk.merchantTouchpoints(),
  ],
  analytics: [
    qk.transactions(),
    qk.dashboardOverview(),
    qk.dashboardTipsChart(),
    qk.dashboardStaff(),
    qk.dashboardTouchpoints(),
  ],
  touchpoints: [qk.merchantTouchpoints()],
  reviews: [['dashboard', 'reviews'], qk.reviews()],
  settings: [
    qk.profileSettings(),
    qk.merchantSetup(),
    qk.merchantPaymentMethods(),
    qk.verifiedStatus(),
  ],
  subscriptions: [qk.profileSettings()],
}

/** Query prefixes to invalidate when staff switches bottom-nav / sidebar screen. */
const STAFF_MENU_QUERIES: Record<string, QueryKeyPrefix[]> = {
  home: [qk.staffDashboardSummary(), ['staffTips'], qk.staffBusinesses()],
  qr: [qk.staffBusinesses(), qk.staffProfile()],
  tips: [['staffTips']],
  reviews: [qk.staffReviews()],
  pay: [qk.staffPaymentMethods()],
  profile: [qk.userProfile(), qk.staffProfile(), qk.staffBusinesses()],
  notifications: [
    qk.notifications(),
    qk.notificationsUnreadCount(),
    ['notifications', 'list'],
  ],
}

function useRefetchOnMenuChange(
  activeMenu: string,
  menuQueries: Record<string, QueryKeyPrefix[]>,
) {
  const queryClient = useQueryClient()
  const prevMenu = useRef<string | null>(null)

  useEffect(() => {
    const isInitial = prevMenu.current === null
    const menuChanged = prevMenu.current !== activeMenu
    prevMenu.current = activeMenu

    if (isInitial || !menuChanged) return

    const prefixes = menuQueries[activeMenu]
    if (!prefixes?.length) return

    prefixes.forEach((queryKey) => {
      void queryClient.invalidateQueries({ queryKey })
    })
  }, [activeMenu, menuQueries, queryClient])
}

export function useRefetchMerchantMenuQueries(activeMenu: string) {
  useRefetchOnMenuChange(activeMenu, MERCHANT_MENU_QUERIES)
}

export function useRefetchStaffMenuQueries(activeScreen: string) {
  useRefetchOnMenuChange(activeScreen, STAFF_MENU_QUERIES)
}
