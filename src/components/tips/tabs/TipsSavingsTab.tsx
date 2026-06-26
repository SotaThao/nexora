import React, { useState } from 'react';
import { TrendingUp, Calculator, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { formatUSD, getPaymentMethodLogo } from '../../../utils/tipsFormatters';
import { formatTransactionDateTime } from '../../dashboard/utils';
import { isDirectP2pMethod } from '../../../data/paymentMethodTypes';

export default function TipsSavingsTab({
  directTips,
  processingFee,
  setProcessingFee,
  monthlyVolume,
  setMonthlyVolume,
  transactions,
}) {
  const { t, currentLanguage } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate all-time direct tips for savings calculator
  const directCompletedTips = transactions.filter(
    tx =>
      isDirectP2pMethod(tx.paymentMethod ?? '') &&
      (tx.status === 'Success' || tx.status === 'Completed')
  );

  const allTimeDirectTips = directCompletedTips.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalPages = Math.ceil(directCompletedTips.length / itemsPerPage) || 1;
  const paginatedTips = directCompletedTips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Savings Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-elevated">
          <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">
            {t('dashboard.tips.savings.direct_routed')}
          </small>
          <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">{formatUSD(allTimeDirectTips)}</h3>
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-brandCyan">
            <TrendingUp className="h-3 w-3" /> {t('dashboard.tips.savings.direct_routed_sub')}
          </span>
        </div>
        <div className="card-elevated">
          <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">
            {t('dashboard.tips.savings.fees_avoided')}
          </small>
          <h3 className="mt-1 text-2xl font-black text-luxuryGold">{formatUSD(allTimeDirectTips * (processingFee / 100))}</h3>
          <span className="mt-1.5 block text-[11px] font-bold text-mutedGrey dark:text-slate-400">
            {(t('dashboard.tips.savings.fees_avoided_sub')).replace('3%', `${processingFee}%`)}
          </span>
        </div>
        <div className="card-elevated">
          <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">
            {t('dashboard.tips.savings.active_payouts')}
          </small>
          <h3 className="mt-1 text-2xl font-black text-inkBlue dark:text-white">
            {new Set(transactions.map(tx => tx.staffProfileId)).size}
          </h3>
          <span className="mt-1.5 block text-[11px] font-bold text-mutedGrey dark:text-slate-400">
            {t('dashboard.tips.savings.active_payouts_sub')}
          </span>
        </div>
        <div className="card-elevated">
          <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">
            {t('dashboard.tips.savings.duration_label')}
          </small>
          <h3 className="mt-1 text-2xl font-black text-brandCyan">
            {t('dashboard.tips.savings.duration_value')}
          </h3>
          <span className="mt-1.5 block text-[11px] font-bold text-mutedGrey dark:text-slate-400">
            {t('dashboard.tips.savings.duration_sub')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: Savings Calculator */}
        <div className="card-elevated lg:col-span-2 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-luxuryGold" />
              {t('dashboard.tips.savings.calculator_title')}
            </h4>

            <div className="space-y-4 mt-6">
              <div>
                <label className="text-xs font-bold text-mutedGrey dark:text-slate-400">
                  {t('dashboard.tips.savings.monthly_volume')}
                </label>
                <input
                  type="number"
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ fontSize: '16px' }}
                  className="mt-1.5 h-11 w-full rounded-lg border border-nexoraBorder dark:border-luxuryGold/20 bg-white dark:bg-luxuryBlack px-3 text-sm text-inkBlue dark:text-white outline-none focus:border-luxuryGold min-h-[44px]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-mutedGrey dark:text-slate-400">
                  <span>{t('dashboard.tips.savings.card_fee_avg')}</span>
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
            <span className="text-[10px] font-black text-nexoraBrand dark:text-luxuryGold uppercase tracking-widest">
              {t('dashboard.tips.savings.est_savings')}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-inkBlue dark:text-white">
                {formatUSD(monthlyVolume * (processingFee / 100))}{t('dashboard.tips.savings.per_month')}
              </span>
            </div>
            <span className="mt-1.5 block text-xs font-bold text-mutedGrey dark:text-slate-400">
              {t('dashboard.tips.savings.est_savings_annual_prefix')}{' '}
              <strong className="text-brandCyan">{formatUSD(monthlyVolume * (processingFee / 100) * 12)}</strong>{' '}
              {t('dashboard.tips.savings.est_savings_annual_suffix')}
            </span>
          </div>
        </div>

        {/* Right: Recent Direct Transactions Table */}
        <div className="card-elevated lg:col-span-3">
          <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-5">
            {t('dashboard.tips.savings.recent_payouts')}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-nexoraBorder dark:border-white/5 text-mutedGrey dark:text-slate-400 uppercase tracking-widest text-[10px]">
                  <th className="py-3 px-2">{t('dashboard.tips.savings.col_time')}</th>
                  <th className="py-3 px-2">{t('dashboard.tips.savings.col_staff')}</th>
                  <th className="py-3 px-2">{t('dashboard.tips.savings.col_amount')}</th>
                  <th className="py-3 px-2">{t('dashboard.tips.savings.col_method')}</th>
                  <th className="py-3 px-2">{t('dashboard.tips.savings.col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTips.length > 0 ? (
                  paginatedTips.map(tx => (
                    <tr key={tx.id} className="border-b border-nexoraBorder/50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="py-3.5 px-2 font-medium text-mutedGrey dark:text-slate-400 whitespace-nowrap">
                        {formatTransactionDateTime(tx.dateTime, currentLanguage)}
                      </td>
                      <td className="py-3.5 px-2 font-bold text-inkBlue dark:text-white">
                        {tx.isMultiStaff || (Array.isArray(tx.tipItems) && tx.tipItems.length > 1)
                          ? t('dashboard.tips.savings.multi_tips')
                          : tx.staffName}
                      </td>
                      <td className="py-3.5 px-2 font-black text-inkBlue dark:text-white">{formatUSD(tx.amount)}</td>
                      <td className="py-3.5 px-2 font-semibold text-inkBlue dark:text-white">
                        <div className="flex items-center gap-1.5">
                          {getPaymentMethodLogo(tx.paymentMethod)}
                          <span>{tx.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brandCyan">
                          <CheckCircle className="h-3 w-3" /> {t('dashboard.tips.savings.status_completed') || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-mutedGrey">
                      {t('common.no_results') || 'No direct payouts found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-nexoraBorder/50 dark:border-white/5 pt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-nexoraBorder dark:border-white/10 px-3 py-1.5 text-xs font-bold text-inkBlue dark:text-white transition-colors hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-white/5"
              >
                {t('common.previous') || 'Previous'}
              </button>
              <span className="text-xs font-medium text-mutedGrey dark:text-slate-400">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-nexoraBorder dark:border-white/10 px-3 py-1.5 text-xs font-bold text-inkBlue dark:text-white transition-colors hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-white/5"
              >
                {t('common.next') || 'Next'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
