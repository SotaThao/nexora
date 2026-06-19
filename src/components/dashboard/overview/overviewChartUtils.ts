import type { TipsChartDayMetric } from '../../../types/repositories'

interface ChartSeriesPoint {
  label: string
  value: number
  date: string
}

function formatChartAxisLabel(dateStr: string, totalPoints: number, currentLanguage: string) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return dateStr

  if (currentLanguage === 'vi') {
    if (totalPoints <= 7) {
      return d.toLocaleDateString('vi-VN', { weekday: 'short', timeZone: 'UTC' })
    }
    return `${d.getUTCDate()} thg ${d.getUTCMonth() + 1}`
  }

  if (totalPoints <= 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
  }

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function shouldShowChartAxisLabel(index: number, total: number, compact = false) {
  if (compact) {
    if (total <= 4) return true
    if (total <= 7) return index === 0 || index === total - 1 || index === Math.floor((total - 1) / 2)
    return index === 0 || index === total - 1
  }

  if (total <= 7) return true
  if (total <= 31) return index % 2 === 0 || index === total - 1
  if (total <= 90) return index % 7 === 0 || index === total - 1
  return index % 14 === 0 || index === total - 1
}

export function mapTipsChartToSeries(
  points: TipsChartDayMetric[] = [],
  currentLanguage = 'en',
): ChartSeriesPoint[] {
  const totalPoints = points.length

  return points.map((point) => ({
    date: point.date,
    value: point.totalAmount ?? 0,
    label: formatChartAxisLabel(point.date, totalPoints, currentLanguage),
  }))
}
