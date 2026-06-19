import { Home, Users, CircleDollarSign, QrCode, UserCircle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

const NAV_ITEMS = [
  { id: 'overview',    labelKey: 'nav_home',    Icon: Home,             image: '/assets/menu/dashboard.png' },
  { id: 'staff',       labelKey: 'nav_staff',   Icon: Users,            image: '/assets/menu/staff.png' },
  { id: 'tips',        labelKey: 'nav_tips',    Icon: CircleDollarSign, image: '/assets/menu/tips.png' },
  { id: 'touchpoints', labelKey: 'nav_qr',      Icon: QrCode,           image: '/assets/menu/touchpoint.png' },
  { id: 'settings',    labelKey: 'nav_profile', Icon: UserCircle,       image: '/assets/menu/setting.png' },
]

export default function MobileBottomNav({ activeMenu, onNavigate }) {
  const { t } = useTranslation()
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-nexoraBorder bg-white/95 backdrop-blur-md lg:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -8px 28px rgba(15,23,42,0.08)',
      }}
    >
      <div className="flex items-center justify-around h-[68px] px-2">
        {NAV_ITEMS.map(({ id, labelKey, Icon, image }) => {
          const isActive = activeMenu === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full focus:outline-none active:scale-95 transition-transform"
            >
              {image ? (
                <img
                  src={image}
                  alt=""
                  className={`h-[22px] w-[22px] object-contain transition-opacity duration-200 ${
                    isActive ? 'opacity-100' : 'opacity-70'
                  }`}
                  aria-hidden="true"
                />
              ) : (
                <Icon
                  className={`h-[22px] w-[22px] transition-colors duration-200 ${
                    isActive ? 'text-nexoraBrand' : 'text-nexoraSubtle'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.9}
                  fill={isActive && id === 'overview' ? 'currentColor' : 'none'}
                />
              )}
              <span
                className={`text-[11px] font-bold transition-colors duration-200 ${
                  isActive ? 'text-nexoraBrand' : 'text-nexoraSubtle'
                }`}
              >
                {t(`dashboard.owner_home.${labelKey}`)}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
