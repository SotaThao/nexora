import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import MenuIcon from './MenuIcon'

const HOMEPAGE_MENU_ITEM = { image: '/assets/menu/home.png' }

type HomepageLinkProps = {
  variant?: 'auth' | 'menu'
  className?: string
  onNavigate?: () => void
}

export default function HomepageLink({
  variant = 'auth',
  className = '',
  onNavigate,
}: HomepageLinkProps) {
  const { t } = useTranslation()

  if (variant === 'menu') {
    return (
      <Link
        to="/"
        onClick={onNavigate}
        className={`flex h-12 w-full items-center gap-3 rounded-lg px-4 text-left text-sm font-bold text-white/85 transition hover:bg-white/5 hover:text-white ${className}`}
      >
        <MenuIcon item={HOMEPAGE_MENU_ITEM} active={false} />
        <span className="truncate">{t('dashboard.menu.home')}</span>
      </Link>
    )
  }

  return (
    <div
      className={`absolute top-[max(1rem,var(--app-safe-area-top))] left-[max(1rem,var(--app-safe-area-left))] z-50 ${className}`}
    >
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 rounded-full border border-nexoraBorder bg-white/80 px-3 py-1.5 text-xs font-bold text-nexoraSubtle shadow-sm backdrop-blur-md transition hover:text-nexoraBrand"
      >
        <Home className="h-3.5 w-3.5" />
        {t('common.back_to_homepage')}
      </Link>
    </div>
  )
}
