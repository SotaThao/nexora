import React from 'react'
import { Check } from 'lucide-react'

export default function SuccessPayment({
  t,
  selectedStaffMembers,
  activeTipAmount,
  setStep,
}) {
  return (
    <div className="text-center space-y-6 animate-fadeIn py-4 flex flex-col items-center">
      <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-2">
        <Check className="h-10 w-10 text-white stroke-[4]" />
      </div>

      <div className="space-y-3">
        <h3 className="font-extrabold text-2xl text-nexoraText tracking-tight">
          {t('customer.payment_success_title')}
        </h3>
        <p className="text-sm text-nexoraMuted font-medium px-4 leading-relaxed">
          {(() => {
            const namesStr = selectedStaffMembers.map(s => s.fullName.split(' ')[0]).join(', ')
            const descTemplate = t('customer.payment_success_desc', {
              name: namesStr
            })
            const parts = descTemplate.split('{amount}')
            if (parts.length === 2) {
              return (
                <>
                  {parts[0]}
                  <span className="font-bold text-nexoraText">${Number(activeTipAmount).toFixed(2)}</span>
                  {parts[1]}
                </>
              )
            }
            return descTemplate
          })()}
        </p>
        <p className="text-xs text-nexoraSubtle font-semibold tracking-wide pt-1 uppercase">
          {t('customer.tip_success_sub')}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setStep('leave_review')}
        className="w-full mt-4 py-3.5 bg-gradient-to-r from-nexoraBrand to-indigo-600 hover:opacity-95 active:scale-[0.98] transition-all text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center"
      >
        {t('customer.done')}
      </button>
    </div>
  )
}
