import React from 'react'
import { CheckCircle, Star } from 'lucide-react'

export default function SuccessPayment({
  t,
  selectedStaffMembers,
  activeTipAmount,
  selectedWalletObj,
  setStep,
}) {
  return (
    <div className="text-center space-y-6 animate-fadeIn py-4 flex flex-col items-center">
      <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <CheckCircle className="h-8 w-8 text-white" />
      </div>

      <h3 className="font-extrabold text-2xl text-nexoraText tracking-tight">
        {t('customer.tips_summary_title')}
      </h3>

      <div className="w-full bg-nexoraCanvas border border-nexoraBorder rounded-2xl p-5 space-y-4 text-left shadow-sm">
        <div className="space-y-3">
          {selectedStaffMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover border border-nexoraBorder shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-nexoraElectric to-nexoraViolet text-sm font-extrabold text-white shrink-0">
                  {member.nickname?.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-nexoraText truncate">{member.fullName}</p>
                <p className="text-[11px] text-nexoraSubtle font-semibold truncate">{member.position}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-nexoraBorder/60" />

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-nexoraSubtle uppercase tracking-wider">
            {t('components.customer_flow.steps.TipAmount.totalTip')}
          </span>
          <span className="text-2xl font-black text-nexoraBrand">
            ${Number(activeTipAmount).toFixed(2)}
          </span>
        </div>

        {selectedWalletObj && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-nexoraSubtle uppercase tracking-wider">
              {t('customer.tips_summary_via')}
            </span>
            <span className="flex items-center gap-2 text-xs font-extrabold text-nexoraText min-w-0">
              {selectedWalletObj.logo ? (
                <span className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${selectedWalletObj.color}`}>
                  {selectedWalletObj.logo}
                </span>
              ) : null}
              <span className="truncate">
                {selectedWalletObj.label || selectedWalletObj.name || selectedWalletObj.key || '-'}
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
        ))}
      </div>

      <div className="w-full space-y-3">
        <button
          type="button"
          onClick={() => setStep('leave_review')}
          className="w-full py-3.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 active:scale-[0.98] transition-all text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-nexoraElectric/25"
        >
          {t('customer.tips_summary_review_cta')}
        </button>
        <button
          type="button"
          onClick={() => setStep('final_done')}
          className="w-full text-xs font-bold text-nexoraSubtle hover:text-nexoraText transition"
        >
          {t('customer.tips_summary_skip')}
        </button>
      </div>
    </div>
  )
}
