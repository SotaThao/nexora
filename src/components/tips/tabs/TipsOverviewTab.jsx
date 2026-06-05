import React from 'react';
import { DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { formatUSD } from '../../../utils/tipsFormatters.jsx';
import TipsTrendChart from '../../dashboard/charts/TipsTrendChart';

export default function TipsOverviewTab({
  totalVolume,
  directTips,
  cardTips,
  cryptoTips,
  chartRange,
  handleChartRangeChange,
  chartStartDate,
  chartEndDate,
  setChartStartDate,
  setChartEndDate,
  svgMetrics,
  yTicks,
  chartBars,
  chartRef,
  hoverIndex,
  setHoverIndex,
  activePoint,
  donutSegments,
}) {
  const { t, currentLanguage } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-elevated flex items-center justify-between">
          <div>
            <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">
              {t('dashboard.tips.kpi.total_revenue') || 'Tổng Doanh Thu Típ'}
            </small>
            <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{formatUSD(totalVolume)}</h3>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-luxuryGold/10 text-luxuryGold">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="card-elevated flex items-center justify-between">
          <div>
            <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">
              {t('dashboard.tips.kpi.direct_p2p') || 'Típ Trực Tiếp (P2P)'}
            </small>
            <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{formatUSD(directTips)}</h3>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brandCyan/10 text-brandCyan">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
        <div className="card-elevated flex items-center justify-between">
          <div>
            <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">
              {t('dashboard.tips.kpi.card_tips') || 'Típ Qua Thẻ'}
            </small>
            <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{formatUSD(cardTips)}</h3>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-mutedGrey">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="card-elevated flex items-center justify-between">
          <div>
            <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">
              {t('dashboard.tips.kpi.crypto_tips') || 'Típ Crypto'}
            </small>
            <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{formatUSD(cryptoTips)}</h3>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-500">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Week Summary Chart */}
        <div className="card-elevated lg:col-span-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider">
              {chartRange === '7 Days'
                ? (t('dashboard.tips.charts.weekly_title') || 'Biểu Đồ Tiền Típ Tuần Này')
                : (currentLanguage === 'vi' ? 'Tiền Típ Theo Thời Gian' : 'Tips Over Time Trend')}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 justify-end">
              {['7 Days', '30 Days', '90 Days', '180 Days', '365 Days', 'Custom'].map((item) => {
                const rangeLabel = (itm) => ({
                  '7 Days': t('dashboard.chart.7_days'),
                  '30 Days': t('dashboard.chart.30_days'),
                  '90 Days': t('dashboard.chart.90_days'),
                  '180 Days': t('dashboard.chart.180_days'),
                  '365 Days': t('dashboard.chart.365_days')
                }[itm] || itm);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleChartRangeChange(item)}
                    className={`min-h-8 rounded-lg px-3 text-[11px] font-bold transition cursor-pointer ${
                      chartRange === item
                        ? 'bg-nexoraBrand text-white shadow-sm'
                        : 'bg-nexoraSurfaceMuted dark:bg-luxuryCoal text-mutedGrey dark:text-slate-400 hover:text-inkBlue dark:hover:text-white hover:bg-slate-200'
                    }`}
                  >
                    {item === 'Custom'
                      ? (currentLanguage === 'vi' ? 'Tự chọn' : 'Custom')
                      : rangeLabel(item)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {chartRange === 'Custom' && (
            <div className="flex flex-wrap items-center justify-end gap-3 mb-6 border-t border-dashed border-nexoraRule dark:border-slate-800 pt-3">
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-bold uppercase text-mutedGrey dark:text-slate-400 tracking-wider">
                  {currentLanguage === 'vi' ? 'Từ ngày' : 'From'}
                </label>
                <input
                  type="date"
                  value={chartStartDate}
                  onChange={(e) => setChartStartDate(e.target.value)}
                  max={chartEndDate}
                  className="h-8 rounded border border-nexoraBorder dark:border-slate-700 px-2.5 text-xs font-semibold outline-none focus:border-nexoraBrand text-inkBlue dark:text-white bg-white dark:bg-luxuryBlack cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-bold uppercase text-mutedGrey dark:text-slate-400 tracking-wider">
                  {currentLanguage === 'vi' ? 'Đến ngày' : 'To'}
                </label>
                <input
                  type="date"
                  value={chartEndDate}
                  onChange={(e) => setChartEndDate(e.target.value)}
                  min={chartStartDate}
                  className="h-8 rounded border border-nexoraBorder dark:border-slate-700 px-2.5 text-xs font-semibold outline-none focus:border-nexoraBrand text-inkBlue dark:text-white bg-white dark:bg-luxuryBlack cursor-pointer"
                />
              </div>
            </div>
          )}

          <TipsTrendChart
            svgMetrics={svgMetrics}
            yTicks={yTicks}
            chartBars={chartBars}
            chartRef={chartRef}
            hoverIndex={hoverIndex}
            setHoverIndex={setHoverIndex}
            activePoint={activePoint}
          />
        </div>

        {/* Payment Method Split */}
        <div className="card-elevated lg:col-span-2 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-6">
              {t('dashboard.tips.charts.method_split') || 'Tỷ Lệ Phương Thức Típ'}
            </h4>

            {/* Custom SVG Donut Chart */}
            <div className="relative flex justify-center py-4">
              <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
                {donutSegments.map((seg) => {
                  const radius = 60;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((seg.startAngle / 360) * circumference);
                  return (
                    <circle
                      key={seg.name}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="18"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-mutedGrey dark:text-slate-400 uppercase tracking-widest">
                  {t('dashboard.tips.kpi.total_tips_circle') || 'Tổng Típ'}
                </span>
                <span className="text-lg font-black text-inkBlue dark:text-white mt-0.5">{formatUSD(totalVolume)}</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs font-bold">
            {donutSegments.map(seg => (
              <div key={seg.name} className="flex items-center gap-1.5 text-mutedGrey dark:text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                <span>{seg.name}: {seg.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
