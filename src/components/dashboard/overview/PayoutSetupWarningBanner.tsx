import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Settings } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useMerchantPaymentMethods } from '../../../data/hooks/useMerchantPaymentMethods'
import { AuthContext } from '../../../auth/AuthContext'

export default function PayoutSetupWarningBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const auth = useContext(AuthContext)
  
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'

  // Only run this query if the user is an owner, to avoid 403s for staff
  const { data: paymentMethods = [], isLoading } = useMerchantPaymentMethods({ 
    enabled: isOwner 
  })

  // If not owner, or still loading, or already has an active payment method, don't show the warning
  const hasActivePaymentMethod = paymentMethods.some(pm => pm.isActive && pm.accountInfo)

  if (!isOwner || isLoading || hasActivePaymentMethod) {
    return null
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-indigo-50/50 border border-indigo-100 p-6 shadow-sm mb-6">
      <div className="absolute -right-6 -top-6 opacity-[0.03]">
        <Settings className="h-48 w-48 text-indigo-900" />
      </div>
      
      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/80 px-3 py-1 mb-4">
          <AlertCircle className="h-3.5 w-3.5 text-indigo-700" />
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">
            {t('dashboard.action_required') || 'ACTION REQUIRED'}
          </span>
        </div>
        
        <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">
          {t('dashboard.setup_payout_method_title') || 'Set Up Your Payout Method'}
        </h2>
        
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {t('dashboard.setup_payout_method_desc') || 'Please set up your payout method to receive TIPS.'}
        </p>

        <button
          type="button"
          onClick={() => navigate('/dashboard/settings?tab=payout')}
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95"
        >
          <Settings className="h-4 w-4 transition-transform group-hover:rotate-90" />
          <span>
            {t('dashboard.setup_payout_btn') || 'SET UP PAYOUT METHODS'}
          </span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  )
}
