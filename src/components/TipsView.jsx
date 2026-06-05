import React, { useState, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { useChartDateRange } from '../hooks/useChartDateRange';
import { useTipsData } from './tips/hooks/useTipsData';
import { useTipsFilters } from './tips/hooks/useTipsFilters';
import TipsOverviewTab from './tips/tabs/TipsOverviewTab';
import TipsSavingsTab from './tips/tabs/TipsSavingsTab';
import TipsTransactionsTab from './tips/tabs/TipsTransactionsTab';
import TipsPayoutsTab from './tips/tabs/TipsPayoutsTab';
import TransactionDetailModal from './dashboard/modals/TransactionDetailModal';

export default function TipsView({
  transactions = [],
  staff = [],
  activeTab: propActiveTab,
  onTabChange,
  processingFee: propProcessingFee,
  setProcessingFee: propSetProcessingFee
}) {
  const { t, currentLanguage } = useTranslation();
  const [localActiveTab, setLocalActiveTab] = useState('overview');
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = onTabChange !== undefined ? onTabChange : setLocalActiveTab;

  const [hoverIndex, setHoverIndex] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [monthlyVolume, setMonthlyVolume] = useState(5000);
  const [localProcessingFee, setLocalProcessingFee] = useState(3.0);
  const processingFee = propProcessingFee !== undefined ? propProcessingFee : localProcessingFee;
  const setProcessingFee = propSetProcessingFee !== undefined ? propSetProcessingFee : setLocalProcessingFee;
  const chartRef = useRef(null);

  const { chartRange, chartStartDate, chartEndDate, setChartStartDate, setChartEndDate, handleChartRangeChange } =
    useChartDateRange(transactions);

  const tipsData = useTipsData({ transactions, chartStartDate, chartEndDate, chartRange });
  const filters = useTipsFilters({ transactions, staff });

  const activePoint = hoverIndex !== null && tipsData.svgMetrics
    ? tipsData.svgMetrics.points[hoverIndex]
    : null;

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

      {activeTab === 'transactions' && (
        <TipsTransactionsTab
          filteredTransactions={filters.filteredTransactions}
          setSelectedTx={setSelectedTx}
          searchQuery={filters.searchQuery}
          setSearchQuery={filters.setSearchQuery}
          dateRangePreset={filters.dateRangePreset}
          setDateRangePreset={filters.setDateRangePreset}
          minAmount={filters.minAmount}
          setMinAmount={filters.setMinAmount}
          maxAmount={filters.maxAmount}
          setMaxAmount={filters.setMaxAmount}
          selectedStaff={filters.selectedStaff}
          setSelectedStaff={filters.setSelectedStaff}
          selectedTouchpoint={filters.selectedTouchpoint}
          setSelectedTouchpoint={filters.setSelectedTouchpoint}
          selectedPayment={filters.selectedPayment}
          setSelectedPayment={filters.setSelectedPayment}
          selectedStatus={filters.selectedStatus}
          setSelectedStatus={filters.setSelectedStatus}
          startDate={filters.startDate}
          setStartDate={filters.setStartDate}
          endDate={filters.endDate}
          setEndDate={filters.setEndDate}
          resetFilters={filters.resetFilters}
          staffOptions={filters.staffOptions}
          touchpointOptions={filters.touchpointOptions}
        />
      )}

      {activeTab === 'payouts' && (
        <TipsPayoutsTab staffPayouts={tipsData.staffPayouts} />
      )}

      {selectedTx && (
        <TransactionDetailModal
          selectedTx={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
