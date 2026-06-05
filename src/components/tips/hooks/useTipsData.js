import { useMemo } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

export function useTipsData({ transactions, chartStartDate, chartEndDate, chartRange }) {
  const { t, currentLanguage } = useTranslation();

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

  const svgMetrics = useMemo(() => {
    if (chartBars.length === 0) return null;
    const width = 500;
    const height = 160;
    const values = chartBars.map((d) => d.value);
    const maxVal = Math.max(...values, 10);
    const roundedMax = Math.ceil(maxVal / 400) * 400;
    const points = chartBars.map((d, i) => ({
      x: (i / (chartBars.length - 1)) * width,
      y: height - (d.value / roundedMax) * height,
      label: d.label,
      value: d.value
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
    return { points, max: roundedMax, width, height, path, areaPath };
  }, [chartBars]);

  const yTicks = svgMetrics
    ? [svgMetrics.max, svgMetrics.max * 0.75, svgMetrics.max * 0.5, svgMetrics.max * 0.25, 0]
    : [];

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
      Zelle: '#d4af37',
      'Cash App': '#00B873',
      Venmo: '#32D7FF',
      VLINKPAY: '#4648D8',
      Card: '#687385',
      Crypto: '#F59E0B'
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

  return {
    filteredTxsForOverview,
    totalVolume,
    directTips,
    cardTips,
    cryptoTips,
    averageTip,
    pendingCount,
    tippedStaffCount,
    staffPayouts,
    totalVolumeInRange,
    chartBars,
    svgMetrics,
    yTicks,
    donutSegments,
  };
}
