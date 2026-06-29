import React from 'react'
import { CheckCircle } from 'lucide-react'

export default function DirectPaymentSuccess({
  t,
  businessName,
  activeAmount,
  selectedWalletObj,
  successDescKey = 'direct_payment.success_desc',
}) {
  const recipient = businessName || t('direct_payment.default_business')
  const formattedAmount = activeAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div className="flex animate-fadeIn flex-col items-center space-y-6 py-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20">
        <CheckCircle className="h-8 w-8 text-white" />
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-extrabold tracking-tight text-nexoraText">
          {t('direct_payment.success_title')}
        </h3>
        <p className="text-xs leading-relaxed text-nexoraMuted">
          {t(successDescKey, {
            amount: formattedAmount,
            business: recipient,
            name: recipient,
          })}
        </p>
      </div>

      <div className="w-full space-y-4 rounded-2xl border border-nexoraBorder bg-nexoraCanvas p-5 text-left shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-nexoraSubtle">
            {t('direct_payment.total_payment')}
          </span>
          <span className="text-2xl font-black text-nexoraBrand">
            ${formattedAmount}
          </span>
        </div>

        {selectedWalletObj ? (
          <div className="flex items-center justify-between gap-3 border-t border-nexoraBorder/60 pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-nexoraSubtle">
              {t('customer.tips_summary_via')}
            </span>
            <span className="flex min-w-0 items-center gap-2 text-xs font-extrabold text-nexoraText">
              {selectedWalletObj.logo ? (
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${selectedWalletObj.color}`}>
                  {selectedWalletObj.logo}
                </span>
              ) : null}
              <span className="truncate">{selectedWalletObj.name}</span>
            </span>
          </div>
        ) : null}
      </div>

      <p className="text-[11px] leading-relaxed text-nexoraMuted">
        {t('direct_payment.success_footer')}
      </p>
    </div>
  )
}
