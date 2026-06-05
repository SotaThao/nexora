import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { formatUSD } from '../../../utils/tipsFormatters.jsx';

export default function TipsPayoutsTab({ staffPayouts }) {
  const { t } = useTranslation();

  return (
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
  );
}
