// StaffBottomNav — fixed bottom navigation for mobile (<1024px).
// Mirrors the reference app's tabs: Home, My QR, Tips, Pay, Profile.
import { useTranslation } from '../../../contexts/LanguageContext'
import { STAFF_MENU_ITEMS } from '../constants'

export default function StaffBottomNav({ activeScreen, onNavigate }) {
  const { t } = useTranslation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-6 border-t border-nexoraBorder bg-nexoraSurface pb-[env(safe-area-inset-bottom)] lg:hidden">
      {STAFF_MENU_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeScreen === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-bold transition ${
              isActive ? 'text-nexoraBrand' : 'text-nexoraMuted hover:text-nexoraText'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'text-nexoraBrand' : ''}`} />
            <span className="truncate">{t(item.labelKey)}</span>
          </button>
        )
      })}
    </nav>
  )
}
