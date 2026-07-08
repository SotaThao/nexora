import { useMemo, useRef, useState } from 'react'
import { useStaffDashboardSummary, useStaffTips } from '../../../data/hooks/useStaffSelf'
import { useStaffPaymentStats } from '../../../data/hooks/useStaffPayments'
import { useStaffPayoutStats, useStaffPayoutsList } from '../../../data/hooks/useStaffPayouts'
import { PayoutStatus, PayoutType, hasPayoutType } from '../../../data/payoutConstants'
import { formatLocalDateIso } from '../../../utils/localDate'
import { toApiDateTime } from '../../../utils/directPaymentDateRange'
import {
  buildLastNDayBuckets,
  buildSvgMetrics,
  computeWeekOverWeekChange,
  sumBucketValues,
} from '../utils/staffEarningsChart'

function getMonthToDateRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    from: toApiDateTime(formatLocalDateIso(start))!,
    to: toApiDateTime(formatLocalDateIso(now), true)!,
  }
}

function getRollingDateRange(dayCount: number) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - (dayCount - 1))
  return {
    dateFrom: formatLocalDateIso(start),
    dateTo: formatLocalDateIso(now),
  }
}

export function useStaffEarningsData(currentLanguage: string) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const monthRange = useMemo(() => getMonthToDateRange(), [])
  const chartTipRange = useMemo(() => getRollingDateRange(14), [])

  const { data: summary, isPending: isSummaryPending } = useStaffDashboardSummary()
  const { data: payoutStats, isPending: isPayoutStatsPending } = useStaffPayoutStats()
  const { data: monthPaymentStats, isPending: isPaymentStatsPending } = useStaffPaymentStats(monthRange)
  const { data: chartTipsPage, isPending: isChartTipsPending } = useStaffTips({
    pageNumber: 1,
    pageSize: 200,
    dateFrom: chartTipRange.dateFrom,
    dateTo: chartTipRange.dateTo,
  })
  const { data: payoutsPage, isPending: isPayoutsListPending } = useStaffPayoutsList({
    page: 1,
    pageSize: 100,
    status: PayoutStatus.Confirmed,
  })

  const chartTips = chartTipsPage?.items ?? []
  const thisWeekBuckets = useMemo(
    () => buildLastNDayBuckets(chartTips, 7, currentLanguage),
    [chartTips, currentLanguage],
  )
  const lastWeekBuckets = useMemo(() => {
    const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US'
    const buckets = []
    const now = new Date()
    for (let offset = 13; offset >= 7; offset -= 1) {
      const day = new Date(now)
      day.setDate(now.getDate() - offset)
      const date = formatLocalDateIso(day)
      buckets.push({
        date,
        label: day.toLocaleDateString(locale, { weekday: 'short' }),
        value: 0,
      })
    }
    const bucketByDate = Object.fromEntries(buckets.map((bucket) => [bucket.date, bucket]))
    chartTips.forEach((tip) => {
      const date = tip.createdAt?.split('T')[0]
      if (!date || !bucketByDate[date]) return
      bucketByDate[date].value += Number(tip.amount) || 0
    })
    return buckets
  }, [chartTips, currentLanguage])

  const svgMetrics = useMemo(() => buildSvgMetrics(thisWeekBuckets), [thisWeekBuckets])
  const yTicks = svgMetrics
    ? [svgMetrics.max, svgMetrics.max * 0.75, svgMetrics.max * 0.5, svgMetrics.max * 0.25, 0]
    : []
  const activePoint = hoverIndex != null && svgMetrics ? svgMetrics.points[hoverIndex] : null

  const thisWeekTotal = sumBucketValues(thisWeekBuckets)
  const lastWeekTotal = sumBucketValues(lastWeekBuckets)
  const weekChangePct = computeWeekOverWeekChange(thisWeekTotal, lastWeekTotal)

  const tipsAmount = summary?.thisMonthTips.totalAmount ?? 0
  const paymentsAmount = monthPaymentStats?.byStatus.completed.totalAmount
    ?? monthPaymentStats?.totalAmount
    ?? 0
  const bonusesAmount = useMemo(() => {
    const payouts = payoutsPage?.items ?? []
    return payouts.reduce((sum, payout) => {
      if (!hasPayoutType(payout.payoutTypes, PayoutType.Bonus)) return sum
      return sum + (Number(payout.amount) || 0)
    }, 0)
  }, [payoutsPage?.items])
  const referralAmount = 0

  const breakdownTotal = tipsAmount + paymentsAmount + bonusesAmount + referralAmount
  const breakdownRows = useMemo(
    () => [
      { id: 'tips', amount: tipsAmount },
      { id: 'payments', amount: paymentsAmount },
      { id: 'referral', amount: referralAmount },
      { id: 'bonuses', amount: bonusesAmount },
    ].map((row) => ({
      ...row,
      percent: breakdownTotal > 0 ? Math.round((row.amount / breakdownTotal) * 100) : 0,
    })),
    [tipsAmount, paymentsAmount, bonusesAmount, referralAmount, breakdownTotal],
  )

  const availableBalance = payoutStats?.currentDebtBalance ?? 0
  const pendingAmount =
    (payoutStats?.totalPendingAmount ?? 0) + (summary?.pendingTips.totalAmount ?? 0)
  const lifetimeEarnings =
    (payoutStats?.totalReceivedAllTime ?? 0)
    + paymentsAmount
    + tipsAmount

  const isLoading =
    isSummaryPending
    || isPayoutStatsPending
    || isPaymentStatsPending
    || isChartTipsPending
    || isPayoutsListPending

  return {
    isLoading,
    availableBalance,
    pendingAmount,
    lifetimeEarnings,
    breakdownRows,
    thisWeekTotal,
    weekChangePct,
    chartBars: thisWeekBuckets,
    svgMetrics,
    yTicks,
    chartRef,
    hoverIndex,
    setHoverIndex,
    activePoint,
  }
}
