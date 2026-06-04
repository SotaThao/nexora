import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Users,
  X,
  CreditCard,
  Coins,
  Share2,
  XCircle,
  AlertCircle,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { WalletLogos } from './dashboard/constants';
import { useNotification } from '../contexts/NotificationContext';
import CustomSelect from './CustomSelect';
import TransactionFilter from './TransactionFilter';
import { logger } from '../utils/logger';

export default function TipsView({ 
  transactions = [], 
  staff = [],
  activeTab: propActiveTab,
  onTabChange,
  processingFee: propProcessingFee,
  setProcessingFee: propSetProcessingFee
}) {
  const { t, currentLanguage } = useTranslation();
  const { showToast } = useNotification();
  const [localActiveTab, setLocalActiveTab] = useState('overview'); // overview, savings, transactions, payouts
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = onTabChange !== undefined ? onTabChange : setLocalActiveTab;
  const [searchQuery, setSearchQuery] = useState('');
  const [hoverIndex, setHoverIndex] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);

  // Helper for subtracting days in UTC format
  const subtractDays = (dateStr, days) => {
    const d = new Date(dateStr + 'T00:00:00Z');
    if (isNaN(d.getTime())) return dateStr;
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString().split('T')[0];
  };

  // Derive the reference end date from the transactions array
  const refEndDate = useMemo(() => {
    if (!transactions || transactions.length === 0) return '2026-05-26';
    let maxDate = '1970-01-01';
    transactions.forEach(tx => {
      if (tx.dateTime) {
        const dateStr = tx.dateTime.split(' ')[0];
        if (dateStr > maxDate && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          maxDate = dateStr;
        }
      }
    });
    return maxDate === '1970-01-01' ? '2026-05-26' : maxDate;
  }, [transactions]);

  // Chart Date Filter States
  const [chartRange, setChartRange] = useState('7 Days');
  const [chartStartDate, setChartStartDate] = useState(() => subtractDays(refEndDate, 6));
  const [chartEndDate, setChartEndDate] = useState(refEndDate);

  useEffect(() => {
    if (chartRange === '7 Days') {
      setChartStartDate(subtractDays(refEndDate, 6));
      setChartEndDate(refEndDate);
    } else if (chartRange === '30 Days') {
      setChartStartDate(subtractDays(refEndDate, 29));
      setChartEndDate(refEndDate);
    } else if (chartRange === '90 Days') {
      setChartStartDate(subtractDays(refEndDate, 89));
      setChartEndDate(refEndDate);
    } else if (chartRange === '180 Days') {
      setChartStartDate(subtractDays(refEndDate, 179));
      setChartEndDate(refEndDate);
    } else if (chartRange === '365 Days') {
      setChartStartDate(subtractDays(refEndDate, 364));
      setChartEndDate(refEndDate);
    }
  }, [refEndDate, chartRange]);

  const handleChartRangeChange = (newRange) => {
    setChartRange(newRange);
    if (newRange === '7 Days') {
      setChartStartDate(subtractDays(refEndDate, 6));
      setChartEndDate(refEndDate);
    } else if (newRange === '30 Days') {
      setChartStartDate(subtractDays(refEndDate, 29));
      setChartEndDate(refEndDate);
    } else if (newRange === '90 Days') {
      setChartStartDate(subtractDays(refEndDate, 89));
      setChartEndDate(refEndDate);
    } else if (newRange === '180 Days') {
      setChartStartDate(subtractDays(refEndDate, 179));
      setChartEndDate(refEndDate);
    } else if (newRange === '365 Days') {
      setChartStartDate(subtractDays(refEndDate, 364));
      setChartEndDate(refEndDate);
    }
  };
  
  // Filter States
  const [dateRangePreset, setDateRangePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [selectedTouchpoint, setSelectedTouchpoint] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const resetFilters = () => {
    setDateRangePreset('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSelectedStaff('all');
    setSelectedTouchpoint('all');
    setSelectedPayment('all');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  // Options memoization
  const staffOptions = useMemo(() => {
    return [
      { value: 'all', label: t('dashboard.activity_log.all_staff') || 'All Staff' },
      ...(staff || []).map(member => ({ value: member.nickname, label: member.nickname }))
    ];
  }, [staff, t]);

  const touchpointOptions = useMemo(() => {
    const uniqueFromTx = Array.from(new Set(transactions.map(tx => tx.touchpoint)));
    return [
      { value: 'all', label: t('dashboard.activity_log.all_touchpoints') || 'All Touch Points' },
      ...uniqueFromTx.filter(Boolean).map(name => ({ value: name, label: name }))
    ];
  }, [transactions, t]);

  const paymentOptions = [
    { value: 'all', label: t('dashboard.activity_log.all_payments') || 'All Payment Methods' },
    { value: 'Venmo', label: 'Venmo' },
    { value: 'Cash App', label: 'Cash App' },
    { value: 'Zelle', label: 'Zelle' },
    { value: 'VLINKPAY', label: 'VLINKPAY' }
  ];

  const statusOptions = [
    { value: 'all', label: t('dashboard.activity_log.all_statuses') || 'All Statuses' },
    { value: 'Success', label: 'Success' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Failed', label: 'Failed' }
  ];

  const datePresetOptions = [
    { value: 'all', label: t('dashboard.activity_log.preset_all') || 'All Time' },
    { value: 'today', label: t('dashboard.activity_log.preset_today') || 'Today' },
    { value: 'yesterday', label: t('dashboard.activity_log.preset_yesterday') || 'Yesterday' },
    { value: '7days', label: t('dashboard.activity_log.preset_7days') || 'Last 7 Days' },
    { value: '30days', label: t('dashboard.activity_log.preset_30days') || 'Last 30 Days' },
    { value: 'custom', label: t('dashboard.activity_log.preset_custom') || 'Custom Range' }
  ];
  const chartRef = useRef(null);
  
  // Savings Calculator states
  const [monthlyVolume, setMonthlyVolume] = useState(5000);
  const [localProcessingFee, setLocalProcessingFee] = useState(3.0);
  const processingFee = propProcessingFee !== undefined ? propProcessingFee : localProcessingFee;
  const setProcessingFee = propSetProcessingFee !== undefined ? propSetProcessingFee : setLocalProcessingFee;

  // 1. Calculations
  const filteredTxsForOverview = useMemo(() => {
    return transactions.filter(tx => {
      const date = tx.dateTime.split(' ')[0];
      return date >= chartStartDate && date <= chartEndDate;
    });
  }, [transactions, chartStartDate, chartEndDate]);

  const totalVolume = useMemo(() => {
    return filteredTxsForOverview.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [filteredTxsForOverview]);

  const directTips = useMemo(() => {
    return filteredTxsForOverview
      .filter(tx => ['Zelle', 'Cash App', 'Venmo', 'VLINKPAY'].includes(tx.paymentMethod))
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [filteredTxsForOverview]);

  const cardTips = useMemo(() => {
    return filteredTxsForOverview
      .filter(tx => tx.paymentMethod === 'Card')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [filteredTxsForOverview]);

  const cryptoTips = useMemo(() => {
    return filteredTxsForOverview
      .filter(tx => tx.paymentMethod === 'Crypto')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [filteredTxsForOverview]);

  const averageTip = useMemo(() => {
    if (filteredTxsForOverview.length === 0) return 0;
    return totalVolume / filteredTxsForOverview.length;
  }, [filteredTxsForOverview, totalVolume]);

  const pendingCount = useMemo(() => {
    return filteredTxsForOverview.filter(tx => tx.status === 'Pending').length;
  }, [filteredTxsForOverview]);

  const tippedStaffCount = useMemo(() => {
    return new Set(filteredTxsForOverview.map(tx => tx.staffId).filter(Boolean)).size;
  }, [filteredTxsForOverview]);

  // Aggregated Payouts per Staff
  const staffPayouts = useMemo(() => {
    const grouped = {};
    filteredTxsForOverview.forEach(tx => {
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
  }, [filteredTxsForOverview]);

  const totalVolumeInRange = useMemo(() => {
    return filteredTxsForOverview.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [filteredTxsForOverview]);

  // SVG Chart Computations
  const chartBars = useMemo(() => {
    const txList = filteredTxsForOverview.filter(tx => tx.status === 'Success');

    if (txList.length > 0) {
      if (chartRange === '7 Days') {
        const dates = [];
        let curr = new Date(chartStartDate + 'T00:00:00');
        const end = new Date(chartEndDate + 'T00:00:00');
        while (curr <= end) {
          dates.push(curr.toISOString().split('T')[0]);
          curr.setDate(curr.getDate() + 1);
        }

        return dates.map(dateStr => {
          const dateObj = new Date(dateStr + 'T00:00:00');
          const dayIndex = dateObj.getDay();
          const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          const label = t(`common.days.${daysOfWeek[dayIndex]}`);
          const value = txList
            .filter(tx => tx.dateTime.startsWith(dateStr))
            .reduce((sum, tx) => sum + tx.amount, 0);
          return { label, value };
        });
      } else {
        const start = new Date(chartStartDate + 'T00:00:00');
        const end = new Date(chartEndDate + 'T00:00:00');
        const totalTime = end - start;
        const pointsCount = 5;

        const chartPoints = [];
        for (let i = 0; i < pointsCount; i++) {
          const intervalStart = new Date(start.getTime() + (totalTime / pointsCount) * i);
          const intervalEnd = new Date(start.getTime() + (totalTime / pointsCount) * (i + 1));

          const value = txList
            .filter(tx => {
              const txDate = new Date(tx.dateTime.replace(' ', 'T') + ':00');
              return txDate >= intervalStart && txDate < intervalEnd;
            })
            .reduce((sum, tx) => sum + tx.amount, 0);

          let label = '';
          if (chartRange === '30 Days') {
            label = i === pointsCount - 1
              ? (currentLanguage === 'vi' ? 'Hôm nay' : 'Today')
              : `${currentLanguage === 'vi' ? 'Tuần' : 'Week'} ${i + 1}`;
          } else {
            const monthNames = currentLanguage === 'vi'
              ? ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12']
              : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            label = `${monthNames[intervalStart.getMonth()]} ${intervalStart.getDate()}`;
          }
          chartPoints.push({ label, value });
        }
        return chartPoints;
      }
    } else {
      // Fallback visual mock data scaled to totalVolumeInRange or a baseline
      const total = totalVolumeInRange > 0 ? totalVolumeInRange : 932.0;
      if (chartRange === '7 Days') {
        const percentages = [0.12, 0.16, 0.22, 0.14, 0.18, 0.15, 0.03];
        const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        return days.map((day, index) => ({
          label: t(`common.days.${day}`),
          value: total * percentages[index]
        }));
      } else if (chartRange === '30 Days') {
        const percentages = [0.18, 0.23, 0.20, 0.25, 0.14];
        return percentages.map((pct, index) => ({
          label: index === percentages.length - 1
            ? (currentLanguage === 'vi' ? 'Hôm nay' : 'Today')
            : `${currentLanguage === 'vi' ? 'Tuần' : 'Week'} ${index + 1}`,
          value: total * pct
        }));
      } else {
        const percentages = [0.15, 0.22, 0.18, 0.25, 0.20];
        const start = new Date(chartStartDate + 'T00:00:00');
        const end = new Date(chartEndDate + 'T00:00:00');
        const totalTime = end - start;

        return percentages.map((pct, index) => {
          const pDate = new Date(start.getTime() + (totalTime / (percentages.length - 1)) * index);
          const monthNames = currentLanguage === 'vi'
            ? ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const label = `${monthNames[pDate.getMonth()]} ${pDate.getDate()}`;
          return { label, value: total * pct };
        });
      }
    }
  }, [filteredTxsForOverview, chartStartDate, chartEndDate, chartRange, t, currentLanguage, totalVolumeInRange]);

  // Filtered Transactions for Transactions Tab
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Date filter
      if (dateRangePreset !== 'all') {
        const txDateStr = tx.dateTime.split(' ')[0];

        if (dateRangePreset === 'today') {
          const todayStr = new Date().toISOString().split('T')[0];
          if (txDateStr !== todayStr) return false;
        } else if (dateRangePreset === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (txDateStr !== yesterdayStr) return false;
        } else if (dateRangePreset === '7days') {
          const limit = new Date();
          limit.setDate(limit.getDate() - 7);
          const limitStr = limit.toISOString().split('T')[0];
          if (txDateStr < limitStr) return false;
        } else if (dateRangePreset === '30days') {
          const limit = new Date();
          limit.setDate(limit.getDate() - 30);
          const limitStr = limit.toISOString().split('T')[0];
          if (txDateStr < limitStr) return false;
        } else if (dateRangePreset === 'custom') {
          if (startDate && txDateStr < startDate) return false;
          if (endDate && txDateStr > endDate) return false;
        }
      }

      // 2. Amount filter
      if (minAmount && tx.amount < parseFloat(minAmount)) return false;
      if (maxAmount && tx.amount > parseFloat(maxAmount)) return false;

      // 3. Staff filter
      if (selectedStaff !== 'all' && tx.staffName !== selectedStaff) return false;

      // 4. Touchpoint filter
      if (selectedTouchpoint !== 'all' && tx.touchpoint !== selectedTouchpoint) return false;

      // 5. Payment method filter
      if (selectedPayment !== 'all' && tx.paymentMethod.toLowerCase() !== selectedPayment.toLowerCase()) return false;

      // 6. Status filter
      if (selectedStatus !== 'all' && tx.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;

      // 7. Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = tx.id.toLowerCase().includes(q);
        const matchStaff = (tx.staffName || '').toLowerCase().includes(q);
        const matchTouchpoint = (tx.touchpoint || '').toLowerCase().includes(q);
        const matchPayment = (tx.paymentMethod || '').toLowerCase().includes(q);
        if (!matchId && !matchStaff && !matchTouchpoint && !matchPayment) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, dateRangePreset, startDate, endDate, minAmount, maxAmount, selectedStaff, selectedTouchpoint, selectedPayment, selectedStatus, searchQuery]);

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

  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'success' || s === 'succeeded' || s === 'hoàn thành' || s === 'thành công') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20">
          <CheckCircle className="h-3 w-3" />
          {currentLanguage === 'vi' ? 'Thành công' : 'Success'}
        </span>
      );
    }
    if (s === 'pending' || s === 'processing' || s === 'đang chờ') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-500/20">
          <Clock className="h-3 w-3" />
          {currentLanguage === 'vi' ? 'Đang chờ' : 'Pending'}
        </span>
      );
    }
    if (s === 'failed' || s === 'thất bại' || s === 'lỗi') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-500/20">
          <XCircle className="h-3 w-3" />
          {currentLanguage === 'vi' ? 'Thất bại' : 'Failed'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-100/50 dark:border-white/10">
        <AlertCircle className="h-3 w-3" />
        {status}
      </span>
    );
  };

  // Helper for Payment Method logos
  const getPaymentMethodLogo = (method) => {
    const norm = (method || '').toLowerCase().replace(/\s+/g, '')
    if (norm === 'card') {
      return <CreditCard className="h-[18px] w-[18px] text-slate-500" />
    }
    if (norm === 'crypto') {
      return <Coins className="h-[18px] w-[18px] text-amber-500" />
    }
    const logo = WalletLogos[norm]
    if (logo) return logo
    return <CreditCard className="h-[18px] w-[18px] text-slate-500" />
  }

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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider">
                  {chartRange === '7 Days' 
                    ? (t('dashboard.tips.charts.weekly_title') || 'Biểu Đồ Tiền Típ Tuần Này') 
                    : (currentLanguage === 'vi' ? 'Tiền Típ Theo Thời Gian' : 'Tips Over Time Trend')}
                </h4>
                <div className="flex flex-wrap items-center gap-1.5 justify-end">
                  {['7 Days', '30 Days', '90 Days', '180 Days', '365 Days', 'Custom'].map((item) => {
                    const rangeLabel = (itm) => {
                      return {
                        '7 Days': t('dashboard.chart.7_days'),
                        '30 Days': t('dashboard.chart.30_days'),
                        '90 Days': t('dashboard.chart.90_days'),
                        '180 Days': t('dashboard.chart.180_days'),
                        '365 Days': t('dashboard.chart.365_days')
                      }[itm] || itm;
                    };
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
              <h3 className="mt-1 text-2xl font-black text-luxuryGold">{formatUSD(directTips * (processingFee / 100))}</h3>
              <span className="mt-1.5 block text-[11px] font-bold text-mutedGrey dark:text-slate-400">
                {(t('dashboard.tips.savings.fees_avoided_sub') || 'Ước tính mức 3% phí thẻ').replace('3%', `${processingFee}%`)}
              </span>
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
                        <td className="py-3.5 px-2 font-semibold text-inkBlue dark:text-white">
                          <div className="flex items-center gap-1.5">
                            {getPaymentMethodLogo(tx.paymentMethod)}
                            <span>{tx.paymentMethod}</span>
                          </div>
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
        <>
          <TransactionFilter
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dateRangePreset={dateRangePreset}
            setDateRangePreset={setDateRangePreset}
            minAmount={minAmount}
            setMinAmount={setMinAmount}
            maxAmount={maxAmount}
            setMaxAmount={setMaxAmount}
            selectedStaff={selectedStaff}
            setSelectedStaff={setSelectedStaff}
            selectedTouchpoint={selectedTouchpoint}
            setSelectedTouchpoint={setSelectedTouchpoint}
            selectedPayment={selectedPayment}
            setSelectedPayment={setSelectedPayment}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            resetFilters={resetFilters}
            staffOptions={staffOptions}
            touchpointOptions={touchpointOptions}
          />

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                <tr>
                  <th className="px-4 py-3">{t('dashboard.tips.ledger.col_id') || 'Mã GD'}</th>
                  <th className="px-4 py-3">{t('dashboard.tips.ledger.col_time') || 'Ngày & Giờ'}</th>
                  <th className="px-4 py-3">{t('dashboard.tips.ledger.col_amount') || 'Số tiền'}</th>
                  <th className="px-4 py-3">{t('dashboard.tips.ledger.col_staff') || 'Nhân viên'}</th>
                  <th className="px-4 py-3">{t('dashboard.tips.ledger.col_tp') || 'Điểm chạm'}</th>
                  <th className="px-4 py-3">{t('dashboard.tips.ledger.col_method') || 'Hình thức'}</th>
                  <th className="px-4 py-3">{t('dashboard.tips.ledger.col_status') || 'Trạng thái'}</th>
                  <th className="px-4 py-3 text-right">{currentLanguage === 'vi' ? 'Chi tiết' : 'Details'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map(tx => (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="border-t border-nexoraRule hover:bg-slate-50 transition-colors cursor-pointer select-none"
                    >
                      <td className="px-4 py-3 font-bold text-nexoraText">{tx.id}</td>
                      <td className="px-4 py-3 text-nexoraMuted">{tx.dateTime}</td>
                      <td className="px-4 py-3 font-extrabold text-nexoraText">{formatUSD(tx.amount)}</td>
                      <td className="px-4 py-3">{tx.staffName}</td>
                      <td className="px-4 py-3">{tx.touchpoint}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getPaymentMethodLogo(tx.paymentMethod)}
                          <span>{tx.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {renderStatusBadge(tx.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTx(tx)
                          }}
                          className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          {currentLanguage === 'vi' ? 'Chi tiết' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-nexoraMuted font-medium">
                      {t('dashboard.tips.ledger.empty') || 'Không tìm thấy giao dịch nào phù hợp.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
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

      {/* Detailed Transaction modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-luxuryBlack rounded-2xl border border-nexoraBorder dark:border-white/10 shadow-2xl p-6 relative overflow-hidden transition-all duration-300 transform scale-100 text-inkBlue dark:text-white text-left">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-nexoraBorder dark:border-white/10 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-mutedGrey dark:text-slate-400 tracking-wider">
                  {t('dashboard.activity_log.modal_title') || 'Transaction Details'}
                </span>
                <h4 className="text-sm font-extrabold text-inkBlue dark:text-white mt-0.5">{selectedTx.id}</h4>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-mutedGrey dark:text-slate-400 hover:text-inkBlue dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5">
              {/* Hero Amount & Status */}
              <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-bold text-mutedGrey dark:text-slate-400 uppercase tracking-wider">
                  {t('dashboard.activity_log.col_amount') || 'Amount'}
                </span>
                <h3 className="text-3xl font-black text-inkBlue dark:text-white mt-1">
                  {formatUSD(selectedTx.amount)}
                </h3>
                {renderStatusBadge(selectedTx.status)}
              </div>

              {/* Data Table / Details Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs border-t border-nexoraBorder dark:border-white/10 pt-4">
                <div>
                  <span className="text-[10px] font-bold text-mutedGrey dark:text-slate-400 block">
                    {t('dashboard.activity_log.col_time') || 'Date & Time'}
                  </span>
                  <span className="font-semibold text-inkBlue dark:text-white block mt-0.5">{selectedTx.dateTime}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-mutedGrey dark:text-slate-400 block">
                    {t('dashboard.activity_log.col_payment') || 'Payment Method'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-inkBlue dark:text-white">
                    {getPaymentMethodLogo(selectedTx.paymentMethod)}
                    <span className="font-semibold">{selectedTx.paymentMethod}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-mutedGrey dark:text-slate-400 block">
                    {t('dashboard.activity_log.col_staff') || 'Staff Name'}
                  </span>
                  <span className="font-semibold text-inkBlue dark:text-white block mt-0.5">{selectedTx.staffName}</span>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                    ID: {selectedTx.staffId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-mutedGrey dark:text-slate-400 block">
                    {t('dashboard.activity_log.col_tp') || 'Touch Point'}
                  </span>
                  <span className="font-semibold text-inkBlue dark:text-white block mt-0.5">{selectedTx.touchpoint}</span>
                </div>
              </div>

              {/* Tipping QR utility footer */}
              <div className="flex gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?flow=customer&tech=staff/${encodeURIComponent(selectedTx.staffId)}`)}`}
                  alt="Staff Tipping QR"
                  className="h-20 w-20 object-contain bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0"
                />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase text-mutedGrey dark:text-slate-400 tracking-widest">
                    {currentLanguage === 'vi' ? 'MÃ QR NHẬN TÍP' : 'TIPPING QR CODE'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    {currentLanguage === 'vi' ? 'Quét để chuyển khoản tiền típ cho nhân viên này' : 'Scan to tip this staff member'}
                  </span>
                  {/* Share Link Button */}
                  <button
                    onClick={async () => {
                      const shareUrl = `${window.location.origin}${window.location.pathname}?flow=customer&tech=staff/${encodeURIComponent(selectedTx.staffId)}`;
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: 'Tip ' + selectedTx.staffName,
                            url: shareUrl
                          });
                        } catch (err) {
                          logger.error(err);
                        }
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        showToast(currentLanguage === 'vi' ? 'Đã sao chép liên kết nhận típ!' : 'Tipping link copied to clipboard!', 'success');
                      }
                    }}
                    className="mt-2.5 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 transition-colors w-max cursor-pointer"
                  >
                    <Share2 className="h-3 w-3" />
                    {currentLanguage === 'vi' ? 'Chia sẻ liên kết' : 'Share Link'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


