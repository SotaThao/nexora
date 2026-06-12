import React from 'react'
import { Heart } from 'lucide-react'

export default function FinalDone({ t, handleReset }) {
  return (
    <div className="text-center space-y-6 animate-fadeIn py-4 flex flex-col items-center">
      <div className="h-16 w-16 bg-nexoraBrand/10 text-nexoraBrand rounded-full flex items-center justify-center animate-bounce">
        <Heart className="h-8 w-8 fill-current text-red-500 animate-pulse" />
      </div>

      <div className="space-y-2">
        <h3 className="font-extrabold text-xl text-nexoraText">{t('customer.final_success_title')}</h3>
        <p className="text-sm text-nexoraMuted leading-relaxed">
          Thank you for your support! Have a great day!
        </p>
      </div>

      <button
        type="button"
        onClick={handleReset}
        className="w-full mt-4 py-3.5 bg-gradient-to-r from-nexoraBrand to-indigo-600 hover:opacity-95 active:scale-[0.98] transition-all text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center"
      >
        {t('customer.send_new_btn')}
      </button>
    </div>
  )
}
