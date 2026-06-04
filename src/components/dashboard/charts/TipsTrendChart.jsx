import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

export default function TipsTrendChart({
  svgMetrics,
  yTicks,
  chartBars,
  chartRef,
  hoverIndex,
  setHoverIndex,
  activePoint,
}) {
  const { t } = useTranslation();

  const handlePointerMove = (event) => {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect || !svgMetrics) return;
    const relativeX = (event.clientX - rect.left) / rect.width;
    const clampedX = Math.min(1, Math.max(0, relativeX));
    const index = Math.round(clampedX * (svgMetrics.points.length - 1));
    setHoverIndex(index);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="h-56 flex items-end gap-4 pt-4 relative">
      {/* Y-Axis Column */}
      <div className="h-40 flex flex-col justify-between text-right text-[10px] font-mono font-semibold text-mutedGrey dark:text-slate-400 select-none w-10 shrink-0 mb-6 pb-0.5">
        {yTicks.map((tick, i) => (
          <span key={i}>${tick}</span>
        ))}
      </div>

      {/* Chart area containing gridlines and SVG path */}
      <div className="flex-1 h-full flex flex-col justify-end relative">
        {/* Horizontal Gridlines */}
        <div className="absolute left-0 right-0 bottom-6 h-40 flex flex-col justify-between pointer-events-none opacity-40 dark:opacity-20 pb-0.5">
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <div key={ratio} className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-0" />
          ))}
        </div>

        {/* SVG Area and Line Chart */}
        <div
          ref={chartRef}
          className="relative h-40 w-full cursor-crosshair select-none mb-6"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {svgMetrics && (
            <svg
              className="h-full w-full overflow-visible"
              viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="tips-weekly-chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4648D8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#4648D8" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="tips-weekly-line-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4648D8" />
                  <stop offset="100%" stopColor="#32D7FF" />
                </linearGradient>
              </defs>

              {/* Area path */}
              <path d={svgMetrics.areaPath} fill="url(#tips-weekly-chart-grad)" />

              {/* Curve line path */}
              <path
                d={svgMetrics.path}
                fill="none"
                stroke="url(#tips-weekly-line-grad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Scrubber vertical line */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  x2={activePoint.x}
                  y1="0"
                  y2={svgMetrics.height}
                  className="stroke-slate-300 dark:stroke-slate-700"
                  strokeWidth="1.5"
                />
              )}
            </svg>
          )}

          {/* Plain/Active dots rendered as HTML to prevent scaling distortions */}
          {svgMetrics && svgMetrics.points.map((pt, i) => (
            <div
              key={i}
              className="pointer-events-none absolute h-2 w-2 rounded-full border-2 border-nexoraBrand bg-white shadow-sm transition-transform duration-200"
              style={{
                left: `calc(${(pt.x / svgMetrics.width) * 100}% - 4px)`,
                top: `calc(${(pt.y / svgMetrics.height) * 100}% - 4px)`,
                zIndex: 8,
                transform: activePoint && activePoint.label === pt.label ? 'scale(1.2)' : 'none'
              }}
            />
          ))}

          {/* Active scrubber ring & active dot */}
          {activePoint && (
            <>
              <div
                className="pointer-events-none absolute h-4 w-4 rounded-full bg-nexoraBrand/10 animate-ping"
                style={{
                  left: `calc(${(activePoint.x / svgMetrics.width) * 100}% - 8px)`,
                  top: `calc(${(activePoint.y / svgMetrics.height) * 100}% - 8px)`,
                  zIndex: 9
                }}
              />
              <div
                className="pointer-events-none absolute h-3 w-3 rounded-full border-2 border-white bg-nexoraBrand shadow-md"
                style={{
                  left: `calc(${(activePoint.x / svgMetrics.width) * 100}% - 6px)`,
                  top: `calc(${(activePoint.y / svgMetrics.height) * 100}% - 6px)`,
                  zIndex: 10
                }}
              />
            </>
          )}

          {/* Floating tooltip */}
          {activePoint && (
            <div
              className="absolute bg-inkBlue/95 text-brandCyan text-[10px] font-mono font-bold px-2 py-1 rounded shadow-lg shadow-brandCyan/10 border border-brandCyan/30 pointer-events-none transition-all duration-75 whitespace-nowrap"
              style={{
                left: `clamp(0px, calc(${(activePoint.x / svgMetrics.width) * 100}% - 40px), calc(100% - 80px))`,
                top: `calc(${(activePoint.y / svgMetrics.height) * 100}% - 38px)`,
                zIndex: 20
              }}
            >
              ${activePoint.value.toFixed(2)}
            </div>
          )}
        </div>

        {/* X-Axis labels row */}
        <div className="flex justify-between text-xs font-bold text-mutedGrey dark:text-slate-400 select-none px-1">
          {chartBars.map((d, i) => {
            const isWeekday = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(d.label.toLowerCase());
            return (
              <span key={`${d.label}-${i}`}>
                {isWeekday ? (t('common.days.' + d.label.toLowerCase()) || d.label) : d.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
