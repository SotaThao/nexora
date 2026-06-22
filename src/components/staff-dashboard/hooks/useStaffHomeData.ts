import { useMemo } from 'react'
import { useStaffDashboardSummary, useStaffTips } from '../../../data/hooks/useStaffSelf'
import { PAYOUT_UI_LABELS, payoutTypeToUiKey } from '../../../data/paymentMethodTypes'
import { useStaffLinkedBusinesses } from './useStaffLinkedBusinesses'

const PENDING_TIPS_PAGE_SIZE = 50

// Tip lifecycle: Initiated (customer chose tip, not yet paid) -> Confirmed
// (customer confirmed external payment) -> staff/merchant confirm receipt -> Completed.
// "Pending Confirmations" = tips the customer has paid (Confirmed) that are still
// awaiting the staff's receipt confirmation. Filtering by Initiated is wrong: staff
// cannot confirm receipt of money not yet sent, so confirm-receipt rejects those ids.
const PENDING_CONFIRMATION_STATUS = 'Confirmed'

function paymentMethodLabel(method: string | null | undefined) {
  if (!method) return '—'
  const uiKey = payoutTypeToUiKey(method)
  return PAYOUT_UI_LABELS[uiKey] || method
}

// Show the amount THIS staff received, not the group total. For a multi-staff tip,
// `amount` is the signed-in staff's share and `totalAmount` is the full split total —
// displaying totalAmount would overstate every member's earnings.
function tipDisplayAmount(amount: number, totalAmount: number) {
  return amount > 0 ? amount : totalAmount
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
    status: PENDING_CONFIRMATION_STATUS,
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
