import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { 
  DollarSign, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  Search, 
  FileText, 
  Calculator,
  Percent,
  CheckCircle,
  HelpCircle,
  Users
} from 'lucide-react';

export default function TipsView({ transactions = [], staff = [] }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview'); // overview, savings, transactions, payouts
  const [searchQuery, setSearchQuery] = useState('');
  const [hoverIndex, setHoverIndex] = useState(null);
  const chartRef = useRef(null);
  
  // Savings Calculator states
  const [monthlyVolume, setMonthlyVolume] = useState(5000);
  const [processingFee, setProcessingFee] = useState(3.0);

  // 1. Calculations
  const totalVolume = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const directTips = useMemo(() => {
    return transactions
      .filter(tx => ['Zelle', 'Cash App', 'Venmo', 'VLINKPAY'].includes(tx.paymentMethod))
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const cardTips = useMemo(() => {
    return transactions
      .filter(tx => tx.paymentMethod === 'Card')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const cryptoTips = useMemo(() => {
    return transactions
      .filter(tx => tx.paymentMethod === 'Crypto')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const averageTip = useMemo(() => {
    if (transactions.length === 0) return 0;
    return totalVolume / transactions.length;
  }, [transactions, totalVolume]);

  const pendingCount = useMemo(() => {
    return transactions.filter(tx => tx.status === 'Pending').length;
  }, [transactions]);

  // Aggregated Payouts per Staff
  const staffPayouts = useMemo(() => {
    const grouped = {};
    transactions.forEach(tx => {
      const staffId = tx.staffId || 'unknown';
      if (!grouped[staffId]) {
        grouped[staffId] = {
          id: staffId,
          staffName: tx.staffName || 'Staff Member',
          method: tx.paymentMethod || 'Zelle',
          totalAmount: 0,
          status: tx.status === 'Success' ? 'Paid Directly' : 'Pending',
          lastDate: tx.dateTime ? tx.dateTime.split(' ')[0] : 'N/A'
        };
      }
      grouped[staffId].totalAmount += tx.amount || 0;
      if (tx.status !== 'Success') {
        grouped[staffId].status = 'Pending';
      }
    });
    return Object.values(grouped);
  }, [transactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const q = searchQuery.toLowerCase();
      return (
        tx.id.toLowerCase().includes(q) ||
        (tx.staffName || '').toLowerCase().includes(q) ||
        (tx.touchpoint || '').toLowerCase().includes(q) ||
        (tx.paymentMethod || '').toLowerCase().includes(q)
      );
    });
  }, [transactions, searchQuery]);

  // SVG Chart Computations
  const chartBars = useMemo(() => {
    // Mock week summary or compute from last 7 days.
    // For simplicity and nice layout, we group by weekday
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const values = [450, 620, 820, 550, 920, 1100, 980];
    const maxVal = Math.max(...values);
    return days.map((day, idx) => ({
      label: day,
      value: values[idx],
      heightPercent: (values[idx] / maxVal) * 100
    }));
  }, []);

  // SVG Bezier Line Chart calculations for Tips Trend
  const svgMetrics = useMemo(() => {
    if (chartBars.length === 0) return null;
    const width = 500;
    const height = 160;
    const values = chartBars.map((d) => d.value);
    const maxVal = Math.max(...values, 10);
    const roundedMax = Math.ceil(maxVal / 400) * 400; // e.g. 1200

    const points = chartBars.map((d, i) => ({
      x: (i / (chartBars.length - 1)) * width,
      y: height - (d.value / roundedMax) * height,
      label: d.label,
      value: d.value
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
  }, [chartBars]);

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

  const donutSegments = useMemo(() => {
    const methods = { Zelle: 0, 'Cash App': 0, Venmo: 0, VLINKPAY: 0, Card: 0, Crypto: 0 };
    transactions.forEach(tx => {
      if (methods[tx.paymentMethod] !== undefined) {
        methods[tx.paymentMethod] += tx.amount || 0;
      }
    });
    const total = Object.values(methods).reduce((a, b) => a + b, 0) || 1;
    let accumulatedAngle = 0;
    
    const colors = {
      Zelle: '#d4af37',      // Gold
      'Cash App': '#00B873', // Success Green
      Venmo: '#32D7FF',      // Shimmering Cyan
      VLINKPAY: '#4648D8',   // Indigo
      Card: '#687385',       // Muted Grey
      Crypto: '#F59E0B'      // Orange/Amber
    };

    return Object.entries(methods)
      .filter(([, val]) => val > 0)
      .map(([name, val]) => {
        const percentage = (val / total) * 100;
        const angle = (val / total) * 360;
        const startAngle = accumulatedAngle;
        accumulatedAngle += angle;
        return { name, value: val, percentage, startAngle, endAngle: accumulatedAngle, color: colors[name] || '#cbd5e1' };
      });
  }, [transactions]);

  // Formatter helper
  const formatUSD = (val) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 pb-12">
      {/* Tab Header & Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-nexoraBorder pb-5">
        <div>
          <h2 className="text-2xl font-black text-inkBlue dark:text-white tracking-tight">
            {t('dashboard.menu.tips') || 'Tiền Típ'}
          </h2>
          <p className="mt-1 text-sm text-mutedGrey dark:text-slate-400">
            {t('dashboard.tips.description') || 'Quản lý doanh thu típ, thống kê tiết kiệm phí và giao dịch trực tiếp.'}
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-nexoraSurfaceMuted dark:bg-luxuryCoal p-1 rounded-xl border border-nexoraBorder dark:border-luxuryGold/10">
          {[
            { id: 'overview', label: t('dashboard.tips.tabs.overview') || 'Tổng quan' },
            { id: 'savings', label: t('dashboard.tips.tabs.savings') || 'Tiết kiệm phí' },
            { id: 'transactions', label: t('dashboard.tips.tabs.transactions') || 'Giao dịch típ' },
            { id: 'payouts', label: t('dashboard.tips.tabs.payouts') || 'Ví nhận thợ' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 rounded-lg px-4 text-xs font-bold transition-all min-w-[44px] ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-luxuryBlack text-luxuryGold shadow-sm font-black'
                  : 'text-mutedGrey hover:text-inkBlue dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render sub-view */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overview Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card-elevated flex items-center justify-between">
              <div>
                <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.tips.kpi.total_revenue') || 'Tổng Doanh Thu Típ'}</small>
                <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{formatUSD(totalVolume)}</h3>
              </div>
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-luxuryGold/10 text-luxuryGold">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="card-elevated flex items-center justify-between">
              <div>
                <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.tips.kpi.direct_p2p') || 'Típ Trực Tiếp (P2P)'}</small>
                <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{formatUSD(directTips)}</h3>
              </div>
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-brandCyan/10 text-brandCyan">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
            <div className="card-elevated flex items-center justify-between">
              <div>
                <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.tips.kpi.card_tips') || 'Típ Qua Thẻ'}</small>
                <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{formatUSD(cardTips)}</h3>
              </div>
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-mutedGrey">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="card-elevated flex items-center justify-between">
              <div>
                <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.tips.kpi.crypto_tips') || 'Típ Crypto'}</small>
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
              <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-6">{t('dashboard.tips.charts.weekly_title') || 'Biểu Đồ Tiền Típ Tuần Này'}</h4>
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
                        ${activePoint.value.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* X-Axis labels row */}
                  <div className="flex justify-between text-xs font-bold text-mutedGrey dark:text-slate-400 select-none px-1">
                    {chartBars.map(d => (
                      <span key={d.label}>
                        {t('common.days.' + d.label.toLowerCase()) || d.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Split */}
            <div className="card-elevated lg:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-6">{t('dashboard.tips.charts.method_split') || 'Tỷ Lệ Phương Thức Típ'}</h4>
                
                {/* Custom SVG Donut Chart */}
                <div className="relative flex justify-center py-4">
                  <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
                    <circle cx="80" cy="80" r="60" fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
                    {donutSegments.map((seg, i) => {
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
                    <span className="text-xs font-bold text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.tips.kpi.total_tips_circle') || 'Tổng Típ'}</span>
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
      )}

      {activeTab === 'savings' && (
        <div className="space-y-6">
          {/* Savings Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card-elevated">
              <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.tips.savings.direct_routed') || 'Típ Trực Tiếp Routed'}</small>
              <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{formatUSD(directTips)}</h3>
              <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-brandCyan">
                <TrendingUp className="h-3 w-3" /> {t('dashboard.tips.savings.direct_routed_sub') || 'Tránh cổng thẻ'}
              </span>
            </div>
            <div className="card-elevated">
              <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.tips.savings.fees_avoided') || 'Phí Xử Lý Tránh Được'}</small>
              <h3 className="mt-1 text-2xl font-black text-luxuryGold">{formatUSD(directTips * 0.03)}</h3>
              <span className="mt-1.5 block text-[11px] font-bold text-mutedGrey dark:text-slate-400">{t('dashboard.tips.savings.fees_avoided_sub') || 'Ước tính mức 3% phí thẻ'}</span>
            </div>
            <div className="card-elevated">
              <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.tips.savings.active_payouts') || 'Số Thợ Nhận Trực Tiếp'}</small>
              <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">
                {new Set(transactions.map(t => t.staffId)).size}
              </h3>
              <span className="mt-1.5 block text-[11px] font-bold text-mutedGrey dark:text-slate-400">{t('dashboard.tips.savings.active_payouts_sub') || 'Nhận trực tiếp tức thời'}</span>
            </div>
            <div className="card-elevated">
              <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">{t('dashboard.tips.savings.duration_label') || 'Thời Gian Nhận Típ'}</small>
              <h3 className="mt-1 text-2xl font-black text-brandCyan">{t('dashboard.tips.savings.duration_value') || 'Tức Thời'}</h3>
              <span className="mt-1.5 block text-[11px] font-bold text-mutedGrey dark:text-slate-400">{t('dashboard.tips.savings.duration_sub') || 'Không giữ tiền, không phí ẩn'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left: Savings Calculator */}
            <div className="card-elevated lg:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-luxuryGold" />
                  {t('dashboard.tips.savings.calculator_title') || 'Tính Phí Tiết Kiệm Ước Tính'}
                </h4>
                
                <div className="space-y-4 mt-6">
                  <div>
                    <label className="text-xs font-bold text-mutedGrey dark:text-slate-400">{t('dashboard.tips.savings.monthly_volume') || 'Doanh số típ tháng ($)'}</label>
                    <input 
                      type="number"
                      value={monthlyVolume}
                      onChange={(e) => setMonthlyVolume(Math.max(0, parseInt(e.target.value) || 0))}
                      style={{ fontSize: '16px' }} // Standard input size prevent auto-zoom on iOS
                      className="mt-1.5 h-11 w-full rounded-lg border border-nexoraBorder dark:border-luxuryGold/20 bg-white dark:bg-luxuryBlack px-3 text-sm text-inkBlue dark:text-white outline-none focus:border-luxuryGold min-h-[44px]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-mutedGrey dark:text-slate-400">
                      <span>{t('dashboard.tips.savings.card_fee_avg') || 'Mức phí quẹt thẻ trung bình (%)'}</span>
                      <span>{processingFee}%</span>
                    </div>
                    <input 
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={processingFee}
                      onChange={(e) => setProcessingFee(parseFloat(e.target.value))}
                      className="mt-2.5 w-full accent-luxuryGold h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Calculator Output */}
              <div className="mt-6 rounded-lg bg-gradient-to-r from-nexoraBrand/10 to-brandCyan/10 p-4 border border-nexoraBrand/20">
                <span className="text-[10px] font-black text-nexoraBrand dark:text-luxuryGold uppercase tracking-widest">{t('dashboard.tips.savings.est_savings') || 'Ước tính số tiền tiết kiệm:'}</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-inkBlue dark:text-white">{formatUSD(monthlyVolume * (processingFee / 100))}{t('dashboard.tips.savings.per_month') || '/tháng'}</span>
                </div>
                <span className="mt-1.5 block text-xs font-bold text-mutedGrey dark:text-slate-400">
                  {t('dashboard.tips.savings.est_savings_annual_prefix') || 'Tiết kiệm khoảng'} <strong className="text-brandCyan">{formatUSD(monthlyVolume * (processingFee / 100) * 12)}</strong> {t('dashboard.tips.savings.est_savings_annual_suffix') || 'mỗi năm.'}
                </span>
              </div>
            </div>

            {/* Right: Recent Direct Transactions Table */}
            <div className="card-elevated lg:col-span-3">
              <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-5">
                {t('dashboard.tips.savings.recent_payouts') || 'Giao Dịch Trực Tiếp Gần Đây'}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-nexoraBorder dark:border-white/5 text-mutedGrey dark:text-slate-400 uppercase tracking-widest text-[10px]">
                      <th className="py-3 px-2">{t('dashboard.tips.savings.col_time') || 'Thời gian'}</th>
                      <th className="py-3 px-2">{t('dashboard.tips.savings.col_staff') || 'Nhân viên'}</th>
                      <th className="py-3 px-2">{t('dashboard.tips.savings.col_amount') || 'Số tiền'}</th>
                      <th className="py-3 px-2">{t('dashboard.tips.savings.col_method') || 'Ví gửi'}</th>
                      <th className="py-3 px-2">{t('dashboard.tips.savings.col_status') || 'Trạng thái'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map(tx => (
                      <tr key={tx.id} className="border-b border-nexoraBorder/50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="py-3.5 px-2 font-medium text-mutedGrey dark:text-slate-400">{tx.dateTime.split(' ')[1]}</td>
                        <td className="py-3.5 px-2 font-bold text-inkBlue dark:text-white">{tx.staffName}</td>
                        <td className="py-3.5 px-2 font-black text-luxuryGold">{formatUSD(tx.amount)}</td>
                        <td className="py-3.5 px-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 dark:bg-white/5 text-mutedGrey dark:text-slate-400">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brandCyan">
                            <CheckCircle className="h-3 w-3" /> {t('dashboard.tips.savings.status_success') || 'Thành công'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="card-elevated">
          {/* Table Header Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider">
              {t('dashboard.tips.ledger.title') || 'Nhật Ký Típ Doanh Nghiệp'}
            </h4>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedGrey dark:text-slate-500" />
              <input 
                type="text"
                placeholder={t('dashboard.tips.ledger.search_placeholder') || 'Tìm thợ, khách hàng, trạm...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '16px' }}
                className="h-10 w-full rounded-lg border border-nexoraBorder dark:border-luxuryGold/20 bg-nexoraSurfaceMuted dark:bg-luxuryBlack pl-10 pr-4 text-xs font-bold text-inkBlue dark:text-white outline-none focus:border-luxuryGold min-h-[44px]"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-nexoraBorder dark:border-white/5 text-mutedGrey dark:text-slate-400 uppercase tracking-widest text-[10px]">
                  <th className="py-3 px-3">{t('dashboard.tips.ledger.col_id') || 'Mã GD'}</th>
                  <th className="py-3 px-3">{t('dashboard.tips.ledger.col_time') || 'Ngày & Giờ'}</th>
                  <th className="py-3 px-3">{t('dashboard.tips.ledger.col_staff') || 'Nhân viên'}</th>
                  <th className="py-3 px-3">{t('dashboard.tips.ledger.col_tp') || 'Điểm chạm'}</th>
                  <th className="py-3 px-3">{t('dashboard.tips.ledger.col_amount') || 'Số tiền'}</th>
                  <th className="py-3 px-3">{t('dashboard.tips.ledger.col_method') || 'Hình thức'}</th>
                  <th className="py-3 px-3">{t('dashboard.tips.ledger.col_status') || 'Trạng thái'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map(tx => (
                    <tr key={tx.id} className="border-b border-nexoraBorder/50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="py-3.5 px-3 font-mono font-bold text-mutedGrey dark:text-slate-400">{tx.id}</td>
                      <td className="py-3.5 px-3 text-mutedGrey dark:text-slate-400">{tx.dateTime}</td>
                      <td className="py-3.5 px-3 font-bold text-inkBlue dark:text-white">{tx.staffName}</td>
                      <td className="py-3.5 px-3 text-mutedGrey dark:text-slate-400">{tx.touchpoint}</td>
                      <td className="py-3.5 px-3 font-black text-luxuryGold">{formatUSD(tx.amount)}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 dark:bg-white/5 text-mutedGrey dark:text-slate-400">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'Success'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          <CheckCircle className="h-3 w-3" /> {tx.status === 'Success' ? (t('dashboard.tips.ledger.status_success') || 'Hoàn thành') : (t('dashboard.tips.ledger.status_pending') || 'Đang chờ')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-mutedGrey dark:text-slate-400 font-bold">
                      {t('dashboard.tips.ledger.empty') || 'Không tìm thấy giao dịch nào phù hợp.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="card-elevated">
          <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-6">
            {t('dashboard.tips.payouts.title') || 'Hồ Sơ Thanh Toán Tích Lũy Thợ'}
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-nexoraBorder dark:border-white/5 text-mutedGrey dark:text-slate-400 uppercase tracking-widest text-[10px]">
                  <th className="py-3 px-3">{t('dashboard.tips.payouts.col_staff') || 'Tên thợ'}</th>
                  <th className="py-3 px-3">{t('dashboard.tips.payouts.col_method') || 'Cổng nhận chính'}</th>
                  <th className="py-3 px-3">{t('dashboard.tips.payouts.col_amount') || 'Tích lũy đã nhận'}</th>
                  <th className="py-3 px-3">{t('dashboard.tips.payouts.col_status') || 'Trạng thái giải ngân'}</th>
                  <th className="py-3 px-3">{t('dashboard.tips.payouts.col_activity') || 'Hoạt động cuối'}</th>
                </tr>
              </thead>
              <tbody>
                {staffPayouts.map(payout => (
                  <tr key={payout.id} className="border-b border-nexoraBorder/50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="py-3.5 px-3 font-bold text-inkBlue dark:text-white flex items-center gap-2">
                      <div className="h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black text-luxuryGold">
                        {payout.staffName.charAt(0)}
                      </div>
                      {payout.staffName}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 dark:bg-white/5 text-mutedGrey dark:text-slate-400">
                        {payout.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-black text-luxuryGold">{formatUSD(payout.totalAmount)}</td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-3 w-3" /> {t('dashboard.tips.payouts.status_direct') || 'Trả trực tiếp (P2P)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-mutedGrey dark:text-slate-400">{payout.lastDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


