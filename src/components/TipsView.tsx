import React, { useState, useRef } from 'react';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { useTipsData } from './tips/hooks/useTipsData';
import PaymentsPayoutsHeader from './dashboard/PaymentsPayoutsHeader';
import TipsOverviewTab from './tips/tabs/TipsOverviewTab';
import TipsSavingsTab from './tips/tabs/TipsSavingsTab';
import TipsPayoutsTab from './tips/tabs/TipsPayoutsTab';

export default function TipsView({
  transactions = [],
  staff = [],
  metrics,
  tipsChartData,
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

  const { chartRange, chartStartDate, chartEndDate, setChartStartDate, setChartEndDate, handleChartRangeChange } =
    useChartDateRange(transactions);

  const tipsData = useTipsData({ transactions, metrics, tipsChartData, chartStartDate, chartEndDate, chartRange });

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
          chartRange={chartRange}
          handleChartRangeChange={handleChartRangeChange}
          chartStartDate={chartStartDate}
          chartEndDate={chartEndDate}
          setChartStartDate={setChartStartDate}
          setChartEndDate={setChartEndDate}
          svgMetrics={tipsData.svgMetrics}
          yTicks={tipsData.yTicks}
          chartBars={tipsData.chartBars}
          chartRef={chartRef}
          hoverIndex={hoverIndex}
          setHoverIndex={setHoverIndex}
          activePoint={activePoint}
          donutSegments={tipsData.donutSegments}
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
