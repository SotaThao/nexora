// StaffBottomNav — fixed bottom navigation for mobile (<1024px).
// Mirrors the reference app's tabs: Home, Link & Tip, Tips, Pay, Profile.
import { useTranslation } from '../../../contexts/LanguageContext'
import { STAFF_BOTTOM_NAV_ITEMS } from '../constants'

export default function StaffBottomNav({ activeScreen, onNavigate }) {
  const { t } = useTranslation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-nexoraBorder bg-nexoraSurface shadow-[0_-4px_20px_rgba(11,18,32,0.06)] pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {STAFF_BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeScreen === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold transition ${
                isActive ? 'text-nexoraBrand' : 'text-nexoraMuted hover:text-nexoraText'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-nexoraBrand' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className="truncate px-0.5">{t(item.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
