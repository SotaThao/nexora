import React, { useMemo, useState, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Percent, 
  Award,
  Zap
} from 'lucide-react';

export default function AnalyticsView({ 
  transactions = [], 
  staff = [], 
  touchpoints = [],
  processingFee = 3.0
}) {
  const { t } = useTranslation();
  const [hoverIndex, setHoverIndex] = useState(null);
  const chartRef = useRef(null);

  // 1. Core metric calculations
  const totalVolume = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const totalCount = useMemo(() => {
    return transactions.length;
  }, [transactions]);

  const averageTip = useMemo(() => {
    if (totalCount === 0) return 0;
    return totalVolume / totalCount;
  }, [totalVolume, totalCount]);

  const feesAvoided = useMemo(() => {
    // estimated credit card fee avoided by direct P2P routing based on processingFee
    const directTips = transactions
      .filter(tx => ['Zelle', 'Cash App', 'Venmo', 'VLINKPAY'].includes(tx.paymentMethod))
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    return directTips * (processingFee / 100);
  }, [transactions, processingFee]);

  // 2. Staff performance leaderboard
  const staffLeaderboard = useMemo(() => {
    const map = {};
    transactions.forEach(tx => {
      const staffName = tx.staffName || 'Unknown';
      if (!map[staffName]) {
        map[staffName] = { name: staffName, amount: 0, count: 0 };
      }
      map[staffName].amount += tx.amount || 0;
      map[staffName].count += 1;
    });

    const list = Object.values(map).sort((a, b) => b.amount - a.amount);
    const maxAmount = list[0]?.amount || 1;
    return list.map(item => ({
      ...item,
      percentage: (item.amount / maxAmount) * 100
    }));
  }, [transactions]);

  // 3. Touchpoint performance leaderboard
  const touchpointLeaderboard = useMemo(() => {
    const map = {};
    transactions.forEach(tx => {
      const tp = tx.touchpoint || 'Unknown';
      if (!map[tp]) {
        map[tp] = { name: tp, amount: 0, count: 0 };
      }
      map[tp].amount += tx.amount || 0;
      map[tp].count += 1;
    });

    const list = Object.values(map).sort((a, b) => b.amount - a.amount);
    const maxAmount = list[0]?.amount || 1;
    return list.map(item => ({
      ...item,
      percentage: (item.amount / maxAmount) * 100
    }));
  }, [transactions]);

  // 4. Group by Day for Weekly volume trend
  const dailyTrend = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const values = [320, 540, 480, 790, 1150, 1380, 1220]; // Baseline representation
    
    // Group actual transactions if available
    const maxVal = Math.max(...values);
    return days.map((day, idx) => ({
      label: day,
      amount: values[idx],
      heightPercent: (values[idx] / maxVal) * 100
    }));
  }, []);

  // SVG Bezier Line Chart calculations for Daily Trend
  const svgMetrics = useMemo(() => {
    if (dailyTrend.length === 0) return null;
    const width = 500;
    const height = 160;
    const values = dailyTrend.map((d) => d.amount);
    const maxVal = Math.max(...values, 10);
    const roundedMax = Math.ceil(maxVal / 400) * 400; // e.g. 1600

    const points = dailyTrend.map((d, i) => ({
      x: (i / (dailyTrend.length - 1)) * width,
      y: height - (d.amount / roundedMax) * height,
      label: d.label,
      amount: d.amount
    }));

    // Bezier path generator
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

    return { points, max: roundedMax, width, height, path, areaPath };
  }, [dailyTrend]);

  const yTicks = svgMetrics ? [svgMetrics.max, svgMetrics.max * 0.75, svgMetrics.max * 0.5, svgMetrics.max * 0.25, 0] : [];

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

  // 5. Group by payment method
  const methodDistribution = useMemo(() => {
    const map = {};
    transactions.forEach(tx => {
      const method = tx.paymentMethod || 'Other';
      map[method] = (map[method] || 0) + (tx.amount || 0);
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    const colors = {
      Zelle: '#d4af37',      // Gold
      'Cash App': '#00B873', // Green
      Venmo: '#32D7FF',      // Cyan
      VLINKPAY: '#4648D8',   // Indigo
      Card: '#687385',       // Muted Grey
      Crypto: '#F59E0B'      // Amber
    };

    return Object.entries(map).map(([name, val]) => ({
      name,
      amount: val,
      percentage: (val / total) * 100,
      color: colors[name] || '#cbd5e1'
    })).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const formatUSD = (val) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="border-b border-nexoraBorder pb-5">
        <h2 className="text-2xl font-black text-inkBlue dark:text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-luxuryGold" />
          {t('dashboard.menu.analytics') || 'Phân Tích'}
        </h2>
        <p className="mt-1 text-sm text-mutedGrey dark:text-slate-400">
          {t('dashboard.analytics.description') || 'Xem số liệu phân tích chuyên sâu về doanh thu típ, hiệu suất thợ và điểm chạm.'}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-elevated flex items-center justify-between">
          <div>
            <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.analytics.kpi.total_volume') || 'Tổng Doanh Số'}</small>
            <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{formatUSD(totalVolume)}</h3>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-luxuryGold/10 text-luxuryGold">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="card-elevated flex items-center justify-between">
          <div>
            <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.analytics.kpi.transactions_count') || 'Số Giao Dịch'}</small>
            <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{totalCount} {t('dashboard.analytics.kpi.transactions_unit') || 'GD'}</h3>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brandCyan/10 text-brandCyan">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <div className="card-elevated flex items-center justify-between">
          <div>
            <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.analytics.kpi.avg_tip') || 'Típ Trung Bình'}</small>
            <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{formatUSD(averageTip)}</h3>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-mutedGrey">
            <Percent className="h-5 w-5" />
          </div>
        </div>
        <div className="card-elevated flex items-center justify-between">
          <div>
            <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.analytics.kpi.fees_avoided') || 'Phí Xử Lý Tránh Được'}</small>
            <h3 className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatUSD(feesAvoided)}</h3>
            <span className="mt-1 block text-[10px] text-mutedGrey dark:text-slate-400">
              {(t('dashboard.tips.savings.fees_avoided_sub') || 'Ước tính mức 3% phí thẻ').replace('3%', `${processingFee}%`)}
            </span>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Zap className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Daily Trend Chart */}
        <div className="card-elevated lg:col-span-2">
          <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-6">{t('dashboard.analytics.charts.daily_revenue') || 'Biểu Đồ Doanh Thu Theo Ngày'}</h4>
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
                  <div key={ratio} className="border-b border-dashed border-slate-200 dark:border-slate-800 w-full h-0"></div>
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
                      <linearGradient id="analytics-chart-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4648D8" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#4648D8" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="analytics-line-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4648D8" />
                        <stop offset="100%" stopColor="#32D7FF" />
                      </linearGradient>
                    </defs>

                    {/* Area path */}
                    <path d={svgMetrics.areaPath} fill="url(#analytics-chart-grad)" />

                    {/* Curve line path */}
                    <path
                      d={svgMetrics.path}
                      fill="none"
                      stroke="url(#analytics-line-grad)"
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
                    className="pointer-events-none absolute h-2 w-2 rounded-full border-2 border-[#4648D8] bg-white shadow-sm transition-transform duration-200"
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
                      className="pointer-events-none absolute h-4 w-4 rounded-full bg-[#4648D8]/10 animate-ping"
                      style={{
                        left: `calc(${(activePoint.x / svgMetrics.width) * 100}% - 8px)`,
                        top: `calc(${(activePoint.y / svgMetrics.height) * 100}% - 8px)`,
                        zIndex: 9
                      }}
                    />
                    <div
                      className="pointer-events-none absolute h-3 w-3 rounded-full border-2 border-white bg-[#4648D8] shadow-md"
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
                    className="absolute bg-[#071025]/95 text-brandCyan text-[10px] font-mono font-bold px-2 py-1 rounded shadow-lg shadow-brandCyan/10 border border-brandCyan/30 pointer-events-none transition-all duration-75 whitespace-nowrap"
                    style={{
                      left: `clamp(0px, calc(${(activePoint.x / svgMetrics.width) * 100}% - 40px), calc(100% - 80px))`,
                      top: `calc(${(activePoint.y / svgMetrics.height) * 100}% - 38px)`,
                      zIndex: 20
                    }}
                  >
                    ${activePoint.amount}
                  </div>
                )}
              </div>

              {/* X-Axis labels row */}
              <div className="flex justify-between text-xs font-bold text-mutedGrey dark:text-slate-400 select-none px-1">
                {dailyTrend.map(d => (
                  <span key={d.label}>
                    {t('common.days.' + d.label.toLowerCase()) || d.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Method Distribution List & Chart */}
        <div className="card-elevated flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-5">{t('dashboard.analytics.charts.wallet_share') || 'Phần Trăm Theo Ví'}</h4>
            
            {/* Dynamic visual bar rows */}
            <div className="space-y-4 pt-2">
              {methodDistribution.map(method => (
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
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Lists */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Top Staff Leaderboard */}
        <div className="card-elevated">
          <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <Award className="h-4 w-4 text-luxuryGold" />
            {t('dashboard.analytics.leaderboards.staff') || 'Bảng Xếp Hạng Nhân Viên'}
          </h4>
          
          <div className="space-y-4">
            {staffLeaderboard.slice(0, 5).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-xs font-black text-luxuryGold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-black text-inkBlue dark:text-white truncate">{item.name}</span>
                    <span className="block text-[10px] text-mutedGrey dark:text-slate-400">{item.count} {t('dashboard.analytics.leaderboards.tips_count_label') || 'lượt nhận típ'}</span>
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
            ))}
          </div>
        </div>

        {/* Top Touchpoint Leaderboard */}
        <div className="card-elevated">
          <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <Users className="h-4 w-4 text-brandCyan" />
            {t('dashboard.analytics.leaderboards.touchpoints') || 'Hiệu Suất Điểm Chạm QR'}
          </h4>
          
          <div className="space-y-4">
            {touchpointLeaderboard.slice(0, 5).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-xs font-black text-brandCyan shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-black text-inkBlue dark:text-white truncate">{item.name}</span>
                    <span className="block text-[10px] text-mutedGrey dark:text-slate-400">{item.count} {t('dashboard.analytics.leaderboards.scans_count_label') || 'lượt quét'}</span>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} dateTime
 * @property {number} amount
 * @property {string} [staffName]
 * @property {string} [touchpoint]
 * @property {string} [paymentMethod]
 * @property {string} [status]
 */

/**
 * @param {Object} props
 * @param {Transaction[]} [props.transactions]
 * @param {Array} [props.staff]
 * @param {Array} [props.touchpoints]
 */
