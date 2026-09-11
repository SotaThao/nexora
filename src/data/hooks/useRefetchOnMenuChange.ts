import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DASHBOARD_MENU_ID } from '../../components/dashboard/constants'
import { STAFF_WORK_ORDERS_SCREEN } from '../../components/staff-dashboard/constants'
import { qk } from '../queryKeys'

type QueryKeyPrefix = readonly unknown[]

/** Query prefixes to invalidate when the merchant opens each dashboard menu. */
const MERCHANT_MENU_QUERIES: Record<string, QueryKeyPrefix[]> = {
  [DASHBOARD_MENU_ID.overview]: [
    qk.dashboardOverview(),
    qk.dashboardAnalytics(),
    qk.transactions(),
    qk.merchantStaff(),
    qk.merchantTouchpoints(),
    ['dashboard', 'reviews'],
  ],
  [DASHBOARD_MENU_ID.staff]: [
    qk.merchantStaff(),
    qk.merchantInviteLink(),
    qk.merchantPaymentMethods(),
  ],
  [DASHBOARD_MENU_ID.tips]: [
    qk.transactions(),
    ['transactions', 'paginated'],
    qk.dashboardOverview(),
    qk.dashboardTipsChart(),
  ],
  [DASHBOARD_MENU_ID.reports]: [
    qk.transactions(),
    ['transactions', 'paginated'],
    qk.merchantTouchpoints(),
  ],
  [DASHBOARD_MENU_ID.analytics]: [
    qk.dashboardAnalytics(),
    qk.dashboardTipsChart(),
  ],
  [DASHBOARD_MENU_ID.touchpoints]: [qk.merchantTouchpoints()],
  [DASHBOARD_MENU_ID.reviews]: [['dashboard', 'reviews'], qk.reviews()],
  [DASHBOARD_MENU_ID.settings]: [
    qk.profileSettings(),
    qk.merchantSetup(),
    qk.merchantPaymentMethods(),
    qk.verifiedStatus(),
  ],
  [DASHBOARD_MENU_ID.subscriptions]: [qk.profileSettings()],
}

/** Query prefixes to invalidate when staff switches bottom-nav / sidebar screen. */
const STAFF_MENU_QUERIES: Record<string, QueryKeyPrefix[]> = {
  home: [qk.staffDashboardSummary(), ['staffTips'], qk.staffBusinesses()],
  qr: [qk.staffBusinesses(), qk.staffProfile()],
  tips: [['staffTips']],
  reviews: [qk.staffReviews()],
  pay: [qk.staffPaymentMethods()],
  earnings: [
    qk.staffDashboardSummary(),
    qk.staffPayoutStats(),
    ['staffPayouts'],
    ['staffPayments', 'stats'],
    ['staffTips'],
  ],
  salons: [qk.staffBusinesses()],
  [STAFF_WORK_ORDERS_SCREEN]: [qk.staffWorkOrdersRoot(), qk.staffBusinesses()],
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
