import React, { useState, useRef } from 'react';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { useDashboardAnalytics, useDashboardTipsChart } from '../data/hooks/useDashboard';
import { useMerchantPaymentStats } from '../data/hooks/useMerchantPayments';
import { useTipsData } from './tips/hooks/useTipsData';
import PaymentsPayoutsHeader from './dashboard/PaymentsPayoutsHeader';
import TipsOverviewTab from './tips/tabs/TipsOverviewTab';
import TipsSavingsTab from './tips/tabs/TipsSavingsTab';
import TipsPayoutsTab from './tips/tabs/TipsPayoutsTab';

const WEEKLY_CHART_RANGE = '7 Days';

export default function TipsView({
  transactions = [],
  staff = [],
  metrics,
  activeTab: propActiveTab,
  processingFee: propProcessingFee,
  setProcessingFee: propSetProcessingFee
}) {
  const activeTab = propActiveTab !== undefined ? propActiveTab : 'overview';

  const [hoverIndex, setHoverIndex] = useState<any | null>(null);
  const [monthlyVolume, setMonthlyVolume] = useState(5000);
  const [localProcessingFee, setLocalProcessingFee] = useState(3.0);
  const processingFee = propProcessingFee !== undefined ? propProcessingFee : localProcessingFee;
  const setProcessingFee = propSetProcessingFee !== undefined ? propSetProcessingFee : setLocalProcessingFee;
  const chartRef = useRef(null);
  const { chartStartDate, chartEndDate } = useChartDateRange(transactions);
  const { data: analytics } = useDashboardAnalytics();
  const { data: paymentStats } = useMerchantPaymentStats();
  const { data: tipsChartData = [] } = useDashboardTipsChart({
    startDate: chartStartDate,
    endDate: chartEndDate,
  });

  const tipsData = useTipsData({
    transactions,
    metrics,
    tipsChartData,
    chartStartDate,
    chartEndDate,
    chartRange: WEEKLY_CHART_RANGE,
    tipRevenue: analytics?.tipRevenue,
    byPaymentMethod: paymentStats?.byPaymentMethod,
  });

  const activePoint = hoverIndex !== null && tipsData.svgMetrics
    ? tipsData.svgMetrics.points[hoverIndex]
    : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Unified Payments & Payouts header (title + submenu tabs) */}
      <PaymentsPayoutsHeader />

      {activeTab === 'overview' && (
        <TipsOverviewTab
          totalVolume={tipsData.totalVolume}
          directTips={tipsData.directTips}
          cardTips={tipsData.cardTips}
          cryptoTips={tipsData.cryptoTips}
          svgMetrics={tipsData.svgMetrics}
          yTicks={tipsData.yTicks}
          chartBars={tipsData.chartBars}
          chartRef={chartRef}
          hoverIndex={hoverIndex}
          setHoverIndex={setHoverIndex}
          activePoint={activePoint}
          donutSegments={tipsData.donutSegments}
          donutTotal={tipsData.donutTotal}
        />
      )}

      {activeTab === 'savings' && (
        <TipsSavingsTab
          directTips={tipsData.directTips}
          processingFee={processingFee}
          setProcessingFee={setProcessingFee}
          monthlyVolume={monthlyVolume}
          setMonthlyVolume={setMonthlyVolume}
          transactions={transactions}
        />
      )}

      {activeTab === 'payouts' && (
        <TipsPayoutsTab staff={staff} />
      )}

    </div>
  );
}
