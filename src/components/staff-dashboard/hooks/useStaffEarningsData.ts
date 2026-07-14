import { useMemo, useRef, useState } from 'react'
import { useStaffDashboardStatistics, useStaffTips } from '../../../data/hooks/useStaffSelf'
import { formatLocalDateIso } from '../../../utils/localDate'
import {
  buildLastNDayBuckets,
  buildSvgMetrics,
  computeWeekOverWeekChange,
  sumBucketValues,
} from '../utils/staffEarningsChart'
import type { EarningsChartPoint } from '../utils/staffEarningsChart'
import type { StaffStatisticsCategory } from '../../../types/domain'

const BREAKDOWN_ROWS = [
  { id: 'tips', category: 'Tips' },
  { id: 'payments', category: 'Payments' },
  { id: 'referral', category: 'ReferralRewards' },
  { id: 'bonuses', category: 'Bonuses' },
] as const

function findCategory(categories: StaffStatisticsCategory[], categoryName: string) {
  return categories.find((c) => c.category === categoryName)
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

  const chartTipRange = useMemo(() => getRollingDateRange(14), [])

  const { data: statistics, isPending: isStatisticsPending } = useStaffDashboardStatistics()
  const { data: chartTipsPage, isPending: isChartTipsPending } = useStaffTips({
    pageNumber: 1,
    pageSize: 200,
    dateFrom: chartTipRange.dateFrom,
    dateTo: chartTipRange.dateTo,
  })

  const chartTips = chartTipsPage?.items ?? []
  const thisWeekBuckets = useMemo(
    () => buildLastNDayBuckets(chartTips, 7, currentLanguage),
    [chartTips, currentLanguage],
  )
  const lastWeekBuckets = useMemo(() => {
    const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US'
    const buckets: EarningsChartPoint[] = []
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

  const categories = statistics?.categories ?? []
  const breakdownRows = useMemo(
    () =>
      BREAKDOWN_ROWS.map((row) => {
        const match = findCategory(categories, row.category)
        return {
          id: row.id,
          amount: match?.amount ?? 0,
          percent: Math.round(match?.percentageOfTotal ?? 0),
        }
      }),
    [categories],
  )

  const availableBalance = statistics?.availableBalance ?? 0
  const pendingAmount = statistics?.pending ?? 0
  const lifetimeEarnings = statistics?.lifetimeEarnings ?? 0

  const isLoading = isStatisticsPending || isChartTipsPending

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
