import { Home, Users, CircleDollarSign, QrCode } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

const NAV_ITEMS = [
  { id: 'overview',    labelKey: 'nav_home',    Icon: Home },
  { id: 'staff',       labelKey: 'nav_staff',   Icon: Users },
  { id: 'tips',        labelKey: 'nav_tips',    Icon: CircleDollarSign },
  { id: 'touchpoints', labelKey: 'nav_qr',      Icon: QrCode },
]

export default function MobileBottomNav({ activeMenu, onNavigate }) {
  const { t } = useTranslation()

  function renderItem({ id, labelKey, Icon }) {
    const isActive = activeMenu === id
    return (
      <button
        key={id}
        type="button"
        onClick={() => onNavigate(id)}
        className="flex flex-1 min-w-0 flex-col items-center justify-center gap-1 h-full focus:outline-none active:scale-95 transition-transform"
      >
        <Icon
          className={`h-5 w-5 transition-colors duration-200 ${
            isActive ? 'text-nexoraBrandDark' : 'text-nexoraSubtle'
          }`}
          strokeWidth={isActive ? 2.4 : 2}
        />
        <span
          className={`text-[11px] font-bold transition-colors duration-200 ${
            isActive ? 'text-nexoraBrand' : 'text-nexoraSubtle'
          }`}
        >
          {t(`dashboard.owner_home.${labelKey}`)}
        </span>
      </button>
    )
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-nexoraBorder bg-white/95 backdrop-blur-md lg:hidden"
      style={{
        paddingBottom: 'var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -8px 28px rgba(15,23,42,0.08)',
      }}
    >
      <div className="flex items-center h-[68px] px-2">
        {NAV_ITEMS.map(renderItem)}
      </div>
    </nav>
  )
}
