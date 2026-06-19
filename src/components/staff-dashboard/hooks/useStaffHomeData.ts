import { useMemo } from 'react'
import { useStaffDashboardSummary, useStaffTips } from '../../../data/hooks/useStaffSelf'
import { PAYOUT_UI_LABELS, payoutTypeToUiKey } from '../../../data/paymentMethodTypes'
import { useStaffLinkedBusinesses } from './useStaffLinkedBusinesses'

const PENDING_TIPS_PAGE_SIZE = 50

function paymentMethodLabel(method: string | null | undefined) {
  if (!method) return '—'
  const uiKey = payoutTypeToUiKey(method)
  return PAYOUT_UI_LABELS[uiKey] || method
}

function tipDisplayAmount(amount: number, totalAmount: number) {
  return totalAmount > 0 ? totalAmount : amount
}

/** Home tab data — summary KPIs + pending tips + linked businesses. */
export function useStaffHomeData() {
  const {
    data: dashboardSummary = null,
    isPending: isSummaryPending,
    isFetching: isSummaryFetching,
  } = useStaffDashboardSummary()

  const {
    data: pendingTipsPage = null,
    isPending: isPendingTipsPending,
    isFetching: isPendingTipsFetching,
  } = useStaffTips({
    pageNumber: 1,
    pageSize: PENDING_TIPS_PAGE_SIZE,
    status: 'Initiated',
  })

  const { linkedBusinesses, isLoading: isBusinessesLoading } = useStaffLinkedBusinesses()

  const isHomeLoading =
    isSummaryPending || isSummaryFetching || isPendingTipsPending || isBusinessesLoading

  const kpis = useMemo(() => {
    if (dashboardSummary) {
      return {
        todayTips: dashboardSummary.todayTips.totalAmount,
        todayCount: dashboardSummary.todayTips.count,
        monthTips: dashboardSummary.thisMonthTips.totalAmount,
        monthCount: dashboardSummary.thisMonthTips.count,
        pendingCount: dashboardSummary.pendingTips.count,
        rating: dashboardSummary.averageRating,
        totalReviews: dashboardSummary.totalReviews,
        isLoading: false,
      }
    }

    return {
      todayTips: 0,
      todayCount: 0,
      monthTips: 0,
      monthCount: 0,
      pendingCount: 0,
      rating: 0,
      totalReviews: 0,
      isLoading: isHomeLoading,
    }
  }, [dashboardSummary, isHomeLoading])

  const pendingTips = useMemo(
    () =>
      (pendingTipsPage?.items ?? []).map((tip) => ({
        id: tip.id,
        amount: tipDisplayAmount(tip.amount, tip.totalAmount),
        paymentMethod: paymentMethodLabel(tip.paymentMethod),
        touchpoint:
          [tip.touchPointName, tip.businessName].filter(Boolean).join(' · ') || '—',
      })),
    [pendingTipsPage],
  )

  return {
    kpis,
    linkedBusinesses,
    isHomeLoading,
    isPendingTipsFetching,
    pendingTips,
  }
}
