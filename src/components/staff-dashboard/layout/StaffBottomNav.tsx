// StaffBottomNav — fixed bottom navigation for mobile (<1024px).
// Mirrors the reference app tabs: Home, My QR, Tips, Reviews, Profile.
import { Home, QrCode, CircleDollarSign, Star, User } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

const NAV_ITEMS = [
  { id: 'home',    icon: Home,             image: '/assets/menu/dashboard.png',  labelKey: 'staff_dashboard.nav.tab_home' },
  { id: 'qr',      icon: QrCode,           image: '/assets/menu/touchpoint.png', labelKey: 'staff_dashboard.nav.tab_qr' },
  { id: 'tips',    icon: CircleDollarSign, image: '/assets/menu/tips.png',       labelKey: 'staff_dashboard.nav.tips' },
  { id: 'reviews', icon: Star,             image: '/assets/menu/reviews.png',    labelKey: 'staff_dashboard.nav.reviews' },
  { id: 'profile', icon: User,             image: '/assets/menu/setting.png',    labelKey: 'staff_dashboard.nav.profile' },
]

export default function StaffBottomNav({ activeScreen, onNavigate }) {
  const { t } = useTranslation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-nexoraBorder bg-white/95 backdrop-blur-md shadow-[0_-8px_28px_rgba(11,18,32,0.08)] pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeScreen === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-bold transition ${
                isActive ? 'text-nexoraBrand' : 'text-nexoraSubtle hover:text-nexoraText'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  className={`h-[22px] w-[22px] object-contain transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-70'
                  }`}
                  aria-hidden="true"
                />
              ) : (
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={isActive ? 2.5 : 1.9}
                  fill={isActive && item.id === 'home' ? 'currentColor' : 'none'}
                />
              )}
              <span className="truncate px-0.5">{t(item.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
