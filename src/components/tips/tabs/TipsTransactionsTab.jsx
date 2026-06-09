import React from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { formatUSD, renderStatusBadge, getPaymentMethodLogo } from '../../../utils/tipsFormatters.jsx';
import TransactionFilter from '../../TransactionFilter';

export default function TipsTransactionsTab({
  filteredTransactions,
  setSelectedTx,
  searchQuery,
  setSearchQuery,
  dateRangePreset,
  setDateRangePreset,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  selectedStaff,
  setSelectedStaff,
  selectedTouchpoint,
  setSelectedTouchpoint,
  selectedPayment,
  setSelectedPayment,
  selectedStatus,
  setSelectedStatus,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  resetFilters,
  staffOptions,
  touchpointOptions,
}) {
  const { t, currentLanguage } = useTranslation();

  return (
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
              <th className="px-4 py-3">{t('dashboard.tips.ledger.col_id')}</th>
              <th className="px-4 py-3">{t('dashboard.tips.ledger.col_time')}</th>
              <th className="px-4 py-3">{t('dashboard.tips.ledger.col_amount')}</th>
              <th className="px-4 py-3">{t('dashboard.tips.ledger.col_staff')}</th>
              <th className="px-4 py-3">{t('dashboard.tips.ledger.col_tp')}</th>
              <th className="px-4 py-3">{t('dashboard.tips.ledger.col_method')}</th>
              <th className="px-4 py-3">{t('dashboard.tips.ledger.col_status')}</th>
              <th className="px-4 py-3 text-right">{t('components.tips.tabs.TipsTransactionsTab.details')}</th>
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
                    {renderStatusBadge(tx.status, currentLanguage)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTx(tx);
                      }}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      {t('components.tips.tabs.TipsTransactionsTab.details')}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-nexoraMuted font-medium">
                  {t('dashboard.tips.ledger.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
