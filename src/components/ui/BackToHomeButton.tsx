import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../contexts/LanguageContext'

interface BackToHomeButtonProps {
  className?: string
  disabled?: boolean
}

export default function BackToHomeButton({ className = '', disabled = false }: BackToHomeButtonProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => navigate('/')}
      className={`flex items-center gap-1.5 rounded-full border border-nexoraBorder bg-white/80 px-3 py-1.5 text-xs font-bold text-nexoraSubtle shadow-sm backdrop-blur-md transition hover:bg-white hover:text-nexoraText disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {t('common.back_to_home')}
    </button>
  )
}
