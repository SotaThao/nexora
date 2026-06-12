import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, CreditCard, Coins } from 'lucide-react';
import { WalletLogos } from '../components/dashboard/constants';

export const formatUSD = (val) =>
  `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const renderStatusBadge = (status, currentLanguage) => {
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

export const getPaymentMethodLogo = (method) => {
  const norm = (method || '').toLowerCase().replace(/\s+/g, '');
  if (norm === 'card') {
    return <CreditCard className="h-[18px] w-[18px] text-slate-500" />;
  }
  if (norm === 'crypto') {
    return <Coins className="h-[18px] w-[18px] text-amber-500" />;
  }
  const logo = WalletLogos[norm];
  if (logo) return logo;
  return <CreditCard className="h-[18px] w-[18px] text-slate-500" />;
};
