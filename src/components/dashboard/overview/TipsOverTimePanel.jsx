import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency } from '../utils'
import Panel from '../../ui/Panel'
import { TIP_SERIES_BY_RANGE, buildChartPoints, getBezierPath, useTransitionedPoints } from './chartUtils'

function TipsOverTimePanel({ range, setRange, hasKyb = true }) {
  const { t } = useTranslation()
  const chartRef = useRef(null)
  const [reveal, setReveal] = useState(0)
  const [hoverIndex, setHoverIndex] = useState(null)
  const series = TIP_SERIES_BY_RANGE[range] || TIP_SERIES_BY_RANGE['7 Days']
  const { points: chartPoints, max, width, height } = useMemo(() => buildChartPoints(series), [series])

  // Two different morphing speeds: 600ms for sharp line, 900ms for elastic neon trail
  const transitionedPoints = useTransitionedPoints(chartPoints, range, 600)
  const trailPoints = useTransitionedPoints(chartPoints, range, 900)

  const linePath = getBezierPath(transitionedPoints)
  const trailPath = getBezierPath(trailPoints)
  const areaPath = transitionedPoints.length > 0
    ? `${linePath} L ${transitionedPoints[transitionedPoints.length - 1].x} ${height} L ${transitionedPoints[0].x} ${height} Z`
    : ''

  const yTicks = [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0]
  const revealX = width * reveal
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
      const progress = Math.min((now - start) / 920, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setReveal(eased)
      if (progress < 1) frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [range])

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
      '365 Days': t('dashboard.chart.365_days')
    }[item] || item
  }

  return (
    <Panel className="p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">{t('dashboard.chart.tips_over_time')}</h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {Object.keys(TIP_SERIES_BY_RANGE).map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`min-h-8 rounded-lg px-3 text-xs font-bold transition ${range === item ? 'bg-nexoraBrand text-white' : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:text-nexoraText'}`}
            >
              {rangeLabel(item)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 grid grid-cols-[42px_1fr] gap-2 sm:grid-cols-[56px_1fr] sm:gap-3">
        <div className="flex h-[235px] sm:h-[270px] flex-col justify-between text-right text-sm text-nexoraSubtle">
          {yTicks.map((tick, index) => (
            <span key={`${tick}-${index}`}>{formatCurrency(tick).replace('.00', '')}</span>
          ))}
        </div>
        <div
          ref={chartRef}
          className="dashboard-scrub-chart relative h-[260px] min-w-0 cursor-crosshair touch-pan-y select-none sm:h-[300px]"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <div className="relative h-[235px] w-full sm:h-[270px]">
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
                {/* Secondary delayed neon trail */}
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
                {/* Main Line path with dashoffset draw animation */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#tips-chart-line-grad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#tips-chart-glow)"
                  style={{
                    strokeDasharray: 850,
                    strokeDashoffset: 850 * (1 - reveal),
                  }}
                />
              </g>
              {showTooltip && (
                <>
                  {/* Vertical solid guide line from reference image */}
                  <line
                    x1={activePoint.x}
                    x2={activePoint.x}
                    y1="0"
                    y2={height}
                    className="stroke-slate-200 dark:stroke-slate-700"
                    strokeWidth="1.5"
                    style={{
                      transition: 'x1 150ms cubic-bezier(0.16, 1, 0.3, 1), x2 150ms cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  />
                </>
              )}
            </svg>

            {/* Regular data points that pop up as the line sweeps over them (rendered as HTML to prevent distortion) */}
            {transitionedPoints.map((point, index) => {
              const pointProgress = point.x / width;
              const isRevealed = reveal >= pointProgress;
              return (
                <div
                  key={`${point.label}-${index}`}
                  className="pointer-events-none absolute h-2.5 w-2.5 rounded-full border-[2.5px] border-nexoraBrand bg-white shadow-sm transition-transform duration-300"
                  style={{
                    left: `calc(${(point.x / width) * 100}% - 5px)`,
                    top: `calc(${(point.y / height) * 100}% - 5px)`,
                    transform: isRevealed ? 'scale(1)' : 'scale(0)',
                    transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: 8
                  }}
                />
              )
            })}

            {/* Active tooltip dots (rendered as HTML to prevent distortion) */}
            {showTooltip && (
              <div
                className="pointer-events-none absolute flex items-center justify-center"
                style={{
                  width: '32px',
                  height: '32px',
                  left: `calc(${(activePoint.x / width) * 100}% - 16px)`,
                  top: `calc(${(activePoint.y / height) * 100}% - 16px)`,
                  transition: 'left 150ms cubic-bezier(0.16, 1, 0.3, 1), top 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 9
                }}
              >
                {/* Animated outer glow ring */}
                <div className="absolute h-6.5 w-6.5 rounded-full bg-nexoraBrand/20" />
                {/* Main active dot (solid blue circle with white outline) */}
                <div className="h-4 w-4 rounded-full border-[3px] border-white bg-nexoraBrand shadow-md" />
              </div>
            )}

            {/* Custom Dark Tooltip Pill from reference image */}
            <div
              className="pointer-events-none absolute rounded-lg bg-slate-900 px-4 py-2.5 shadow-2xl text-center"
              style={{
                width: '124px',
                left: `clamp(0px, calc(${(activePoint.x / width) * 100}% - 62px), calc(100% - 124px))`,
                top: `clamp(4px, calc(${(activePoint.y / height) * 100}% - 65px), calc(100% - 70px))`,
                opacity: showTooltip ? 1 : 0,
                transform: showTooltip ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.95)',
                transition: 'left 150ms cubic-bezier(0.16, 1, 0.3, 1), top 150ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease, transform 150ms ease',
                zIndex: 10
              }}
            >
              <div className="text-xs font-bold text-white">{t('dashboard.chart.tooltip_tips')} : {formatCurrency(activePoint.value).replace('.00', '')}</div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-sm font-medium text-nexoraSubtle">
            {series.map((point) => (
              <span key={point.label}>{point.label}</span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}

export default TipsOverTimePanel
