import { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react'
import { LineChart } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency } from '../utils'
import { useDashboardTipsChart } from '../../../data/hooks/useDashboard'
import Panel from '../../ui/Panel'
import Skeleton from '../../ui/skeleton/Skeleton'
import OverviewEmptyState from './OverviewEmptyState'
import { buildChartPoints, getBezierPath, useTransitionedPoints } from './chartUtils'
import { mapTipsChartToSeries, shouldShowChartAxisLabel } from './overviewChartUtils'

function TipsOverTimePanel({
  range,
  setRange,
  chartStartDate,
  chartEndDate,
  setChartStartDate,
  setChartEndDate,
}) {
  const { t, currentLanguage } = useTranslation()
  const chartRef = useRef(null)
  const linePathRef = useRef(null)
  const [reveal, setReveal] = useState(0)
  const [linePathLength, setLinePathLength] = useState(850)
  const [hoverIndex, setHoverIndex] = useState<any | null>(null)
  const [isCompactChart, setIsCompactChart] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const update = () => setIsCompactChart(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const { data: chartData = [], isLoading, isFetching } = useDashboardTipsChart({
    startDate: chartStartDate,
    endDate: chartEndDate,
  })

  const series = useMemo(
    () => mapTipsChartToSeries(chartData, currentLanguage),
    [chartData, currentLanguage],
  )

  const hasChartData = useMemo(
    () => series.some((item) => item.value > 0),
    [series],
  )

  const isChartLoading = isLoading || isFetching

  const { points: chartPoints, max, ticks: yTicks, width, height } = useMemo(() => buildChartPoints(series), [series])

  const transitionedPoints = useTransitionedPoints(chartPoints, range, 600)
  const trailPoints = useTransitionedPoints(chartPoints, range, 900)

  const linePath = getBezierPath(transitionedPoints)
  const trailPath = getBezierPath(trailPoints)
  const areaPath = transitionedPoints.length > 0
    ? `${linePath} L ${transitionedPoints[transitionedPoints.length - 1].x} ${height} L ${transitionedPoints[0].x} ${height} Z`
    : ''

  useLayoutEffect(() => {
    const length = linePathRef.current?.getTotalLength?.()
    if (length && length > 0) {
      setLinePathLength(length)
    }
  }, [linePath, reveal])

  const revealX = reveal >= 1 ? width + 8 : width * reveal
  const isRevealComplete = reveal >= 1
  const showTooltip = hoverIndex !== null
  const activePoint = hoverIndex !== null
    ? transitionedPoints[hoverIndex]
    : transitionedPoints[transitionedPoints.length - 1] || { x: 0, y: 0, value: 0, label: '' }

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setReveal(1)
      return undefined
    }

    let frameId
    const start = performance.now()
    setReveal(0.02)
    const tick = (now) => {
      const progress = Math.min(Math.max((now - start) / 920, 0), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setReveal(eased)
      if (progress < 1) frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [range, chartStartDate, chartEndDate])

  const handlePointerMove = (event) => {
    if (transitionedPoints.length === 0) return
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect) return
    const next = (event.clientX - rect.left) / rect.width
    const bounded = Math.min(1, Math.max(0, next))
    const index = Math.round(bounded * (transitionedPoints.length - 1))
    setHoverIndex(index)
  }

  const handlePointerLeave = () => {
    setHoverIndex(null)
  }

  const rangeLabel = (item) => {
    return {
      '7 Days': t('dashboard.chart.7_days'),
      '30 Days': t('dashboard.chart.30_days'),
      '90 Days': t('dashboard.chart.90_days'),
      '180 Days': t('dashboard.chart.180_days'),
      '365 Days': t('dashboard.chart.365_days'),
      'Custom': t('components.dashboard.overview.TipsOverTimePanel.custom'),
    }[item] || item
  }

  return (
    <Panel className="overflow-hidden p-4 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">{t('dashboard.chart.tips_over_time')}</h2>
        <div className="-mx-1 overflow-x-auto pb-1 sm:mx-0 sm:overflow-visible sm:pb-0">
          <div className="flex min-w-max items-center gap-1.5 px-1 sm:min-w-0 sm:flex-wrap sm:justify-end sm:gap-2 sm:px-0">
          {['7 Days', '30 Days', '90 Days', '180 Days', '365 Days', 'Custom'].map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`min-h-8 shrink-0 rounded-lg px-2.5 text-[11px] font-bold transition cursor-pointer sm:px-3 sm:text-xs ${range === item ? 'bg-nexoraBrand text-white' : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:text-nexoraText hover:bg-nexoraBorder'}`}
            >
              {rangeLabel(item)}
            </button>
          ))}
          </div>
        </div>
      </div>

      {range === 'Custom' && (
        <div className="flex flex-wrap items-center justify-end gap-3 mt-4 mb-2 border-t border-dashed border-nexoraBorder dark:border-luxuryCoal pt-4 text-xs font-bold text-nexoraText">
          <div className="flex items-center gap-2">
            <span className="text-nexoraMuted">{t('components.dashboard.overview.TipsOverTimePanel.from')}</span>
            <input
              type="date"
              value={chartStartDate}
              onChange={(e) => setChartStartDate(e.target.value)}
              className="bg-nexoraSurfaceMuted dark:bg-luxuryCoal border border-nexoraBorder dark:border-luxuryGold/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-nexoraBrand cursor-pointer dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-nexoraMuted">{t('components.dashboard.overview.TipsOverTimePanel.to')}</span>
            <input
              type="date"
              value={chartEndDate}
              onChange={(e) => setChartEndDate(e.target.value)}
              className="bg-nexoraSurfaceMuted dark:bg-luxuryCoal border border-nexoraBorder dark:border-luxuryGold/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-nexoraBrand cursor-pointer dark:text-white"
            />
          </div>
        </div>
      )}

      {isChartLoading ? (
        <Skeleton height={260} className="mt-6 w-full sm:mt-8" borderRadius={12} />
      ) : !hasChartData ? (
        <div className="mt-6 w-full sm:mt-8">
          <OverviewEmptyState
            icon={LineChart}
            title={t('components.dashboard.overview.TipsOverTimePanel.empty_title')}
            description={t('components.dashboard.overview.TipsOverTimePanel.empty_desc')}
            className="w-full min-h-[260px]"
          />
        </div>
      ) : (
        <div className="mt-6 grid min-w-0 grid-cols-[minmax(32px,auto)_minmax(0,1fr)] items-end gap-1.5 sm:mt-8 sm:grid-cols-[56px_1fr] sm:gap-3">
          <div className="flex h-[220px] flex-col justify-between pb-6 text-right text-[10px] leading-none text-nexoraSubtle sm:h-[265px] sm:pb-7 sm:text-sm">
            {yTicks.map((tick, index) => (
              <span key={`${tick}-${index}`} className="whitespace-nowrap">
                {formatCurrency(tick).replace('.00', '')}
              </span>
            ))}
          </div>
          <div
            ref={chartRef}
            className="dashboard-scrub-chart relative min-w-0 cursor-crosshair touch-pan-y select-none"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <div className="relative h-[220px] w-full sm:h-[265px]">
              <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="tips-chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4648D8" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4648D8" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="tips-chart-line-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4648D8" />
                    <stop offset="50%" stopColor="#6C5CE7" />
                    <stop offset="100%" stopColor="#32D7FF" />
                  </linearGradient>
                  <filter id="tips-chart-glow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#4648D8" floodOpacity="0.22" />
                  </filter>
                  <filter id="tips-chart-neon-blur" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" />
                  </filter>
                  <clipPath id={`tips-chart-reveal-${range.replace(/\s+/g, '-')}`}>
                    <rect x="0" y="-10" width={revealX} height={height + 20} />
                  </clipPath>
                </defs>
                {yTicks.map((tick, index) => {
                  const yVal = max === 0 ? height : height - (tick / max) * height
                  return (
                    <line
                      key={`${tick}-${index}`}
                      x1="0"
                      x2={width}
                      y1={yVal}
                      y2={yVal}
                      className="stroke-slate-300 dark:stroke-slate-700"
                      strokeWidth="1"
                      strokeOpacity={0.07}
                    />
                  )
                })}
                <g clipPath={`url(#tips-chart-reveal-${range.replace(/\s+/g, '-')})`}>
                  <path d={areaPath} fill="url(#tips-chart-area-grad)" className="dashboard-chart-area" />
                  {trailPath && (
                    <path
                      d={trailPath}
                      fill="none"
                      stroke="url(#tips-chart-line-grad)"
                      strokeWidth="8"
                      opacity="0.25"
                      filter="url(#tips-chart-neon-blur)"
                      className="pointer-events-none"
                    />
                  )}
                  <path
                    ref={linePathRef}
                    d={linePath}
                    fill="none"
                    stroke="url(#tips-chart-line-grad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#tips-chart-glow)"
                    style={
                      isRevealComplete
                        ? undefined
                        : {
                            strokeDasharray: linePathLength + 4,
                            strokeDashoffset: (linePathLength + 4) * (1 - reveal),
                          }
                    }
                  />
                </g>
                {showTooltip && (
                  <line
                    x1={activePoint.x}
                    x2={activePoint.x}
                    y1="0"
                    y2={height}
                    className="stroke-slate-200 dark:stroke-slate-700"
                    strokeWidth="1.5"
                    style={{
                      transition: 'x1 150ms cubic-bezier(0.16, 1, 0.3, 1), x2 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                )}
              </svg>

              {transitionedPoints.map((point, index) => {
                const pointProgress = point.x / width
                const isRevealed = reveal >= pointProgress
                return (
                  <div
                    key={`${point.label}-${index}`}
                    className="pointer-events-none absolute h-2.5 w-2.5 rounded-full border-[2.5px] border-nexoraBrand bg-white shadow-sm transition-transform duration-300"
                    style={{
                      left: `calc(${(point.x / width) * 100}% - 5px)`,
                      top: `calc(${(point.y / height) * 100}% - 5px)`,
                      transform: isRevealed ? 'scale(1)' : 'scale(0)',
                      transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                      zIndex: 8,
                    }}
                  />
                )
              })}

              {showTooltip && (
                <div
                  className="pointer-events-none absolute flex items-center justify-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    left: `calc(${(activePoint.x / width) * 100}% - 16px)`,
                    top: `calc(${(activePoint.y / height) * 100}% - 16px)`,
                    transition: 'left 150ms cubic-bezier(0.16, 1, 0.3, 1), top 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                    zIndex: 9,
                  }}
                >
                  <div className="absolute h-6.5 w-6.5 rounded-full bg-nexoraBrand/20" />
                  <div className="h-4 w-4 rounded-full border-[3px] border-white bg-nexoraBrand shadow-md" />
                </div>
              )}

              <div
                className="pointer-events-none absolute rounded-lg bg-nexoraText px-3 py-2 shadow-2xl text-center sm:px-4 sm:py-2.5"
                style={{
                  width: isCompactChart ? '108px' : '124px',
                  left: isCompactChart
                    ? `clamp(0px, calc(${(activePoint.x / width) * 100}% - 54px), calc(100% - 108px))`
                    : `clamp(0px, calc(${(activePoint.x / width) * 100}% - 62px), calc(100% - 124px))`,
                  top: `clamp(4px, calc(${(activePoint.y / height) * 100}% - 65px), calc(100% - 70px))`,
                  opacity: showTooltip ? 1 : 0,
                  transform: showTooltip ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.95)',
                  transition: 'left 150ms cubic-bezier(0.16, 1, 0.3, 1), top 150ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease, transform 150ms ease',
                  zIndex: 10,
                }}
              >
                <div className="text-[10px] font-bold text-white sm:text-xs">
                  {t('dashboard.chart.tooltip_tips')} : {formatCurrency(activePoint.value).replace('.00', '')}
                </div>
              </div>
            </div>
            <div className="mt-1 flex justify-between gap-0.5 text-[10px] font-medium text-nexoraSubtle sm:text-sm">
              {series.map((point, index) => (
                <span key={`${point.label}-${index}`} className="min-w-0 flex-1 truncate text-center first:text-left last:text-right">
                  {shouldShowChartAxisLabel(index, series.length, isCompactChart) ? point.label : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Panel>
  )
}

export default TipsOverTimePanel
