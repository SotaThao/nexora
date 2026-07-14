import React from 'react'
import { Heart } from 'lucide-react'
import BackToDashboardButton from '../BackToDashboardButton'
import { useBackToDashboard } from '../useBackToDashboard'
import { getNexoraHomeUrl } from '../../../utils/nexoraHomeUrl'

export default function FinalDone({ t, handleReset, rating = 5 }) {
  const { canBackToDashboard } = useBackToDashboard()
  const isPrivateFeedback = rating < 4

  const handleBackHome = () => {
    window.location.assign(getNexoraHomeUrl())
  }

  return (
    <div className="text-center space-y-6 animate-fadeIn py-4 flex flex-col items-center">
      <div className="h-16 w-16 bg-nexoraBrand/10 text-nexoraBrand rounded-full flex items-center justify-center animate-bounce">
        <Heart className="h-8 w-8 fill-current text-red-500 animate-pulse" />
      </div>

      <div className="space-y-2">
        <h3 className="font-extrabold text-xl text-nexoraText">{t('customer.final_success_title')}</h3>
        <p className="text-sm text-nexoraMuted leading-relaxed">
          {isPrivateFeedback ? t('customer.rating_bad_text') : t('customer.final_thanks_desc')}
        </p>
      </div>

      <div className="w-full mt-4 space-y-3">
        <BackToDashboardButton />
        {handleReset ? (
          <button
            type="button"
            onClick={handleReset}
            className={`w-full py-3.5 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center ${
              canBackToDashboard
                ? 'bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted text-nexoraText'
                : 'bg-gradient-to-r from-nexoraBrand to-indigo-600 hover:opacity-95 active:scale-[0.98] text-white shadow-lg shadow-indigo-600/25'
            }`}
          >
            {t('customer.send_new_btn')}
          </button>
        ) : null}
        
      </div>
    </div>
  )
}
