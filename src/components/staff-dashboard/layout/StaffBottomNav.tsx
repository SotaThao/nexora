// StaffBottomNav — fixed bottom navigation for mobile (<1024px).
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { STAFF_BOTTOM_NAV_ITEMS, isStaffBottomNavItemActive } from '../constants'

export default function StaffBottomNav({ activeScreen, onNavigate }) {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  function renderItem(item) {
    const Icon = item.icon
    const isActive = isStaffBottomNavItemActive(activeScreen, tabParam, item)
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onNavigate(item.screen, item.params)}
        className="relative flex flex-1 min-w-0 flex-col items-center justify-center gap-1 h-full focus:outline-none active:scale-95 transition-transform"
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon
          className={`h-5 w-5 transition-colors duration-200 ${
            isActive ? 'text-nexoraBrandDark' : 'text-nexoraSubtle'
          }`}
          strokeWidth={isActive ? 2.4 : 2}
        />
        <span
          className={`max-w-full truncate px-0.5 text-[11px] font-bold transition-colors duration-200 ${
            isActive ? 'text-nexoraBrand' : 'text-nexoraSubtle'
          }`}
        >
          {t(item.labelKey)}
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
      <div className="mx-auto flex h-[68px] max-w-lg items-center px-2">
        {STAFF_BOTTOM_NAV_ITEMS.map(renderItem)}
      </div>
    </nav>
  )
}
