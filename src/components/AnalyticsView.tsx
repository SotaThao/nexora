import React, { useMemo, useState, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { computeChartYScale } from './dashboard/overview/chartUtils';
import { mapTipsChartToSeries } from './dashboard/overview/overviewChartUtils';
import { useDashboardAnalytics, useDashboardTipsChart } from '../data/hooks/useDashboard';
import Tooltip from './ui/Tooltip';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Percent,
  Award,
  Zap,
} from 'lucide-react';

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  Zelle: '#d4af37',
  'Cash App': '#00B873',
  Venmo: '#32D7FF',
  VLINKPAY: '#4648D8',
  Card: '#687385',
  Crypto: '#F59E0B',
  'Direct P2P': '#4648D8',
};

function recentChartRange() {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

export default function AnalyticsView() {
  const { t, currentLanguage } = useTranslation();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartRange = useMemo(() => recentChartRange(), []);

  const { data: analytics, isLoading, isFetching } = useDashboardAnalytics();
  const { data: tipsChartData = [] } = useDashboardTipsChart(chartRange);

  const overview = analytics?.overview ?? {
    totalVolume: 0,
    totalTransactionCount: 0,
    feeSaved: 0,
    averageTipAmount: 0,
  };

  const staffLeaderboard = useMemo(() => {
    const list = (analytics?.leaderboard ?? [])
      .slice()
      .sort((a, b) => b.tipTotal - a.tipTotal)
      .map((item) => ({
        name: item.staffProfileId || item.displayName,
        displayName: item.displayName,
        amount: item.tipTotal,
        count: item.tipCount,
      }));

    const maxAmount = list[0]?.amount || 1;
    return list.map((item) => ({
      ...item,
      percentage: (item.amount / maxAmount) * 100,
    }));
  }, [analytics?.leaderboard]);

  const touchpointLeaderboard = useMemo(() => {
    const list = (analytics?.touchPoints ?? [])
      .slice()
      .sort((a, b) => b.tipTotal - a.tipTotal)
      .map((item) => ({
        name: item.touchPointId || item.name,
        displayName: item.name,
        amount: item.tipTotal,
        count: item.tipCount,
        scans: item.scanCount,
        conversionRate: item.scanCount > 0 ? item.ctr : null,
      }));

    const maxAmount = list[0]?.amount || 1;
    return list.map((item) => ({
      ...item,
      percentage: (item.amount / maxAmount) * 100,
    }));
  }, [analytics?.touchPoints]);

  const dailyTrend = useMemo(() => {
    const series = mapTipsChartToSeries(tipsChartData, currentLanguage);
    const maxVal = Math.max(...series.map((point) => point.value), 0, 1);
    return series.map((point) => ({
      label: point.label,
      amount: point.value,
      heightPercent: (point.value / maxVal) * 100,
    }));
  }, [tipsChartData, currentLanguage]);

  const svgMetrics = useMemo(() => {
    if (dailyTrend.length === 0) return null;
    const width = 500;
    const height = 160;
    const values = dailyTrend.map((d) => d.amount);
    const maxVal = Math.max(...values, 0);
    const { max: roundedMax, ticks } = computeChartYScale(maxVal);

    const points = dailyTrend.map((d, i) => ({
      x: dailyTrend.length > 1 ? (i / (dailyTrend.length - 1)) * width : width / 2,
      y: height - (d.amount / roundedMax) * height,
      label: d.label,
      amount: d.amount,
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp1y = p0.y;
      const cp2x = p0.x + (2 * (p1.x - p0.x)) / 3;
      const cp2y = p1.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    const areaPath = `${path} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return { points, max: roundedMax, ticks, width, height, path, areaPath };
  }, [dailyTrend]);

  const yTicks = svgMetrics?.ticks ?? [];

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

  const activePoint = hoverIndex !== null && svgMetrics ? svgMetrics.points[hoverIndex] : null;

  const methodDistribution = useMemo(() => {
    const methods = [...(analytics?.tipsMethods ?? [])];

    if (methods.length === 0 && (analytics?.directPayout?.totalAmount ?? 0) > 0) {
      methods.push({
        method: 'Direct P2P',
        amount: analytics.directPayout.totalAmount,
        count: analytics.directPayout.totalCount,
      });
    }

    const total = methods.reduce((sum, item) => sum + item.amount, 0) || 1;

    return methods
      .map((item) => ({
        name: item.method,
        amount: item.amount,
        percentage: (item.amount / total) * 100,
        color: PAYMENT_METHOD_COLORS[item.method] || '#cbd5e1',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [analytics?.tipsMethods, analytics?.directPayout]);

  const formatUSD = (val) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center pb-12">
        <span className="text-sm font-semibold text-mutedGrey dark:text-slate-400">
          {t('common.loading')}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="border-b border-nexoraBorder pb-3 sm:pb-5">
        <h2 className="hidden text-2xl font-black text-inkBlue dark:text-white tracking-tight sm:flex sm:items-center sm:gap-2">
          <BarChart3 className="h-6 w-6 text-luxuryGold" />
          {t('dashboard.menu.analytics')}
        </h2>
        <p className="mt-0 text-sm text-mutedGrey dark:text-slate-400 sm:mt-1">
          {t('dashboard.analytics.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-elevated flex items-center justify-between">
          <div>
            <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.analytics.kpi.total_volume')}</small>
            <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{formatUSD(overview.totalVolume)}</h3>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-luxuryGold/10 text-luxuryGold sm:h-10 sm:w-10">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
        <div className="card-elevated flex items-center justify-between gap-2 p-3 sm:p-6">
          <div className="min-w-0">
            <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.analytics.kpi.transactions_count')}</small>
            <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{overview.totalTransactionCount} {t('dashboard.analytics.kpi.transactions_unit')}</h3>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brandCyan/10 text-brandCyan sm:h-10 sm:w-10">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
        <div className="card-elevated flex items-center justify-between gap-2 p-3 sm:p-6">
          <div className="min-w-0">
            <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.analytics.kpi.avg_tip')}</small>
            <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{formatUSD(overview.averageTipAmount)}</h3>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-mutedGrey dark:bg-white/5 sm:h-10 sm:w-10">
            <Percent className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
        <div className="card-elevated flex items-center justify-between gap-2 p-3 sm:p-6">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.analytics.kpi.fees_avoided')}</small>
              <Tooltip
                content={t('dashboard.analytics.kpi.fees_avoided_tooltip_api')}
                ariaLabel={t('dashboard.analytics.kpi.fees_avoided_tooltip_api')}
              />
            </div>
            <h3 className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatUSD(overview.feeSaved)}</h3>
            <span className="mt-1 block text-[10px] text-mutedGrey dark:text-slate-400">
              {t('dashboard.analytics.kpi.fees_avoided_sub')}
            </span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 sm:h-10 sm:w-10">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card-elevated lg:col-span-2">
          <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-6">{t('dashboard.analytics.charts.daily_revenue')}</h4>
          <div className="h-56 flex items-end gap-4 pt-4 relative">
            <div className="h-40 flex flex-col justify-between text-right text-[10px] font-mono font-semibold text-mutedGrey dark:text-slate-400 select-none w-10 shrink-0 mb-6 pb-0.5">
              {yTicks.map((tick, i) => (
                <span key={i}>${tick}</span>
              ))}
            </div>

            <div className="flex-1 h-full flex flex-col justify-end relative">
              <div className="absolute left-0 right-0 bottom-6 h-40 flex flex-col justify-between pointer-events-none opacity-40 dark:opacity-20 pb-0.5">
                {[0.25, 0.5, 0.75, 1].map((ratio) => (
                  <div key={ratio} className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-0"></div>
                ))}
              </div>

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
                      <linearGradient id="analytics-chart-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4648D8" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#4648D8" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="analytics-line-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4648D8" />
                        <stop offset="100%" stopColor="#32D7FF" />
                      </linearGradient>
                    </defs>

                    <path d={svgMetrics.areaPath} fill="url(#analytics-chart-grad)" />
                    <path
                      d={svgMetrics.path}
                      fill="none"
                      stroke="url(#analytics-line-grad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

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

                {svgMetrics && svgMetrics.points.map((pt, i) => (
                  <div
                    key={i}
                    className="pointer-events-none absolute h-2 w-2 rounded-full border-2 border-nexoraBrand bg-white shadow-sm transition-transform duration-200"
                    style={{
                      left: `calc(${(pt.x / svgMetrics.width) * 100}% - 4px)`,
                      top: `calc(${(pt.y / svgMetrics.height) * 100}% - 4px)`,
                      zIndex: 8,
                      transform: activePoint && activePoint.label === pt.label ? 'scale(1.2)' : 'none',
                    }}
                  />
                ))}

                {activePoint && (
                  <>
                    <div
                      className="pointer-events-none absolute h-4 w-4 rounded-full bg-nexoraBrand/10 animate-ping"
                      style={{
                        left: `calc(${(activePoint.x / svgMetrics.width) * 100}% - 8px)`,
                        top: `calc(${(activePoint.y / svgMetrics.height) * 100}% - 8px)`,
                        zIndex: 9,
                      }}
                    />
                    <div
                      className="pointer-events-none absolute h-3 w-3 rounded-full border-2 border-white bg-nexoraBrand shadow-md"
                      style={{
                        left: `calc(${(activePoint.x / svgMetrics.width) * 100}% - 6px)`,
                        top: `calc(${(activePoint.y / svgMetrics.height) * 100}% - 6px)`,
                        zIndex: 10,
                      }}
                    />
                  </>
                )}

                {activePoint && (
                  <div
                    className="absolute bg-inkBlue/95 text-brandCyan text-[10px] font-mono font-bold px-2 py-1 rounded shadow-lg shadow-brandCyan/10 border border-brandCyan/30 pointer-events-none transition-all duration-75 whitespace-nowrap"
                    style={{
                      left: `clamp(0px, calc(${(activePoint.x / svgMetrics.width) * 100}% - 40px), calc(100% - 80px))`,
                      top: `calc(${(activePoint.y / svgMetrics.height) * 100}% - 38px)`,
                      zIndex: 20,
                    }}
                  >
                    ${activePoint.amount}
                  </div>
                )}
              </div>

              <div className="flex justify-between text-xs font-bold text-mutedGrey dark:text-slate-400 select-none px-1">
                {dailyTrend.map((d) => (
                  <span key={d.label}>{d.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card-elevated flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-5">{t('dashboard.analytics.charts.wallet_share')}</h4>

            <div className="space-y-4 pt-2">
              {methodDistribution.length === 0 ? (
                <p className="py-4 text-center text-xs text-mutedGrey dark:text-slate-400">
                  {t('dashboard.analytics.charts.no_wallet_data')}
                </p>
              ) : (
                methodDistribution.map((method) => (
                  <div key={method.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-inkBlue dark:text-white flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: method.color }} />
                        {method.name}
                      </span>
                      <span className="text-mutedGrey dark:text-slate-400">
                        {formatUSD(method.amount)} ({method.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${method.percentage}%`, backgroundColor: method.color }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card-elevated">
          <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <Award className="h-4 w-4 text-luxuryGold" />
            {t('dashboard.analytics.leaderboards.staff')}
          </h4>

          <div className="space-y-4">
            {staffLeaderboard.length === 0 ? (
              <p className="py-4 text-center text-xs text-mutedGrey dark:text-slate-400">
                {t('dashboard.analytics.leaderboards.empty')}
              </p>
            ) : (
              staffLeaderboard.slice(0, 5).map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-xs font-black text-luxuryGold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-black text-inkBlue dark:text-white truncate">{item.displayName}</span>
                      <span className="block text-[10px] text-mutedGrey dark:text-slate-400">{item.count} {t('dashboard.analytics.leaderboards.tips_count_label')}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-xs font-black text-luxuryGold">{formatUSD(item.amount)}</span>
                    <div className="w-16 h-1 bg-slate-100 dark:bg-white/5 rounded-full mt-1 overflow-hidden ml-auto">
                      <div
                        className="h-full bg-brandCyan rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-elevated">
          <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <Users className="h-4 w-4 text-brandCyan" />
            {t('dashboard.analytics.leaderboards.touchpoints')}
          </h4>

          <div className="space-y-4">
            {touchpointLeaderboard.length === 0 ? (
              <p className="py-4 text-center text-xs text-mutedGrey dark:text-slate-400">
                {t('dashboard.analytics.leaderboards.empty')}
              </p>
            ) : (
              touchpointLeaderboard.slice(0, 5).map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-xs font-black text-brandCyan shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-black text-inkBlue dark:text-white truncate">{item.displayName}</span>
                    
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-xs font-black text-emerald-600 dark:text-emerald-400">{formatUSD(item.amount)}</span>
                    <div className="w-16 h-1 bg-slate-100 dark:bg-white/5 rounded-full mt-1 overflow-hidden ml-auto">
                      <div
                        className="h-full bg-luxuryGold rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
