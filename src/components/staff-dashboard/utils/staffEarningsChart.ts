import { formatLocalDateIso } from '../../../utils/localDate'
import type { StaffTipItem } from '../../../types/domain'

export type EarningsChartPoint = {
  label: string
  value: number
  date: string
}

export function buildLastNDayBuckets(
  tips: StaffTipItem[],
  dayCount: number,
  currentLanguage: string,
): EarningsChartPoint[] {
  const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US'
  const buckets: EarningsChartPoint[] = []
  const now = new Date()

  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
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
  tips.forEach((tip) => {
    const date = tip.createdAt?.split('T')[0]
    if (!date || !bucketByDate[date]) return
    bucketByDate[date].value += Number(tip.amount) || 0
  })

  return buckets
}

export function buildSvgMetrics(chartBars: EarningsChartPoint[]) {
  if (chartBars.length === 0) return null

  const width = 500
  const height = 160
  const values = chartBars.map((bar) => bar.value)
  const maxVal = Math.max(...values, 10)
  const roundedMax = Math.ceil(maxVal / 50) * 50 || 50
  const points = chartBars.map((bar, index) => ({
    x: chartBars.length === 1 ? width / 2 : (index / (chartBars.length - 1)) * width,
    y: height - (bar.value / roundedMax) * height,
    label: bar.label,
    value: bar.value,
  }))

  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const cp1x = p0.x + (p1.x - p0.x) / 3
    const cp1y = p0.y
    const cp2x = p0.x + (2 * (p1.x - p0.x)) / 3
    const cp2y = p1.y
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`
  }

  const areaPath = `${path} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
  return { points, max: roundedMax, width, height, path, areaPath }
}

export function sumBucketValues(buckets: EarningsChartPoint[]) {
  return buckets.reduce((sum, bucket) => sum + bucket.value, 0)
}

export function computeWeekOverWeekChange(thisWeek: number, lastWeek: number) {
  if (lastWeek <= 0) {
    return thisWeek > 0 ? 100 : 0
  }
  return ((thisWeek - lastWeek) / lastWeek) * 100
}
