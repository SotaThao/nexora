import React from 'react';
import { X, Share2 } from 'lucide-react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { formatUSD, renderStatusBadge, getPaymentMethodLogo } from '../../../utils/tipsFormatters.jsx';
import { logger } from '../../../utils/logger';

export default function TransactionDetailModal({ selectedTx, onClose }) {
  const { t, currentLanguage } = useTranslation();
  const { showToast } = useNotification();

  if (!selectedTx) return null;

  return (
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
            onClick={onClose}
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
            {renderStatusBadge(selectedTx.status, currentLanguage)}
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
              <button
                onClick={async () => {
                  const shareUrl = `${window.location.origin}${window.location.pathname}?flow=customer&tech=staff/${encodeURIComponent(selectedTx.staffId)}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: 'Tip ' + selectedTx.staffName, url: shareUrl });
                    } catch (err) {
                      logger.error(err);
                    }
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    showToast(
                      currentLanguage === 'vi' ? 'Đã sao chép liên kết nhận típ!' : 'Tipping link copied to clipboard!',
                      'success'
                    );
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
  );
}
