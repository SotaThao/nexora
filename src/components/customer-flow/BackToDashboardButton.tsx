import React from 'react'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useBackToDashboard } from './useBackToDashboard'

export function BackToDashboardHeaderButton() {
  const { t } = useTranslation()
  const { canBackToDashboard, handleBackToDashboard } = useBackToDashboard()

  if (!canBackToDashboard) return null

  return (
    <button
      type="button"
      onClick={handleBackToDashboard}
      className="absolute top-4 left-4 z-50 inline-flex items-center gap-1.5 rounded-full border border-nexoraBorder bg-white/80 px-3 py-1.5 text-xs font-bold text-nexoraText shadow-sm backdrop-blur-md transition hover:bg-white hover:text-nexoraBrand"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      <span>{t('customer.back_to_dashboard_btn')}</span>
    </button>
  )
}

export default function BackToDashboardButton({
  variant = 'primary',
  className = '',
}) {
  const { t } = useTranslation()
  const { canBackToDashboard, handleBackToDashboard } = useBackToDashboard()

  if (!canBackToDashboard) return null

  if (variant === 'text') {
    return (
      <button
        type="button"
        onClick={handleBackToDashboard}
        className={`text-xs font-bold text-nexoraSubtle hover:text-nexoraText transition ${className}`}
      >
        {t('customer.back_to_dashboard_btn')}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleBackToDashboard}
      className={`w-full py-3.5 bg-gradient-to-r from-nexoraBrand to-indigo-600 hover:opacity-95 active:scale-[0.98] transition-all text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 inline-flex items-center justify-center gap-2 ${className}`}
    >
      <LayoutDashboard className="h-4 w-4" />
      <span>{t('customer.back_to_dashboard_btn')}</span>
    </button>
  )
}
