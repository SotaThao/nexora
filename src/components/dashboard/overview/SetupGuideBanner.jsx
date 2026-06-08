import React from 'react'
import { Store, Sparkles, ArrowRight, Settings } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

/**
 * SetupGuideBanner prompts new merchants to complete their store profile.
 * 
 * @param {object} props
 * @param {Function} props.onStartSetup - Callback to launch setup flow
 */
export default function SetupGuideBanner({ onStartSetup }) {
  const { currentLanguage, t } = useTranslation()

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-nexoraBrand/10 via-white to-nexoraBrandSoft border border-nexoraBrand/20 p-6 md:p-8 shadow-sm">
      <div className="absolute -right-10 -top-10 opacity-10">
        <Store className="h-48 w-48 text-nexoraBrand" />
      </div>
      
      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-nexoraBrand/10 px-3 py-1 mb-4">
          <Sparkles className="h-4 w-4 text-nexoraBrand" />
          <span className="text-[10px] font-black uppercase tracking-widest text-nexoraBrand">
            {t('components.dashboard.overview.SetupGuideBanner.text_1_3b1b52')}
          </span>
        </div>
        
        <h2 className="text-xl md:text-2xl font-black text-nexoraText tracking-tight mb-2">
          {t('components.dashboard.overview.SetupGuideBanner.text_2_b7f957')}
        </h2>
        
        <p className="text-sm text-nexoraMuted mb-6 leading-relaxed">
          {t('components.dashboard.overview.SetupGuideBanner.text_3_8c3924')}
        </p>

        <button
          onClick={onStartSetup}
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-nexoraBrand px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-nexoraBrand/25 active:scale-95"
        >
          <Settings className="h-4 w-4 transition-transform group-hover:rotate-90" />
          <span>
            {t('components.dashboard.overview.SetupGuideBanner.text_4_d47bae')}
          </span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  )
}
