// StaffBottomNav — fixed bottom navigation for mobile (<1024px).
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { STAFF_BOTTOM_NAV_ITEMS, STAFF_WORK_ORDERS_SCREEN, isStaffBottomNavItemActive } from '../constants'

export default function StaffBottomNav({ activeScreen, onNavigate }) {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  function renderItem(item) {
    const Icon = item.icon
    const isActive = isStaffBottomNavItemActive(activeScreen, tabParam, item)
    if (item.id === STAFF_WORK_ORDERS_SCREEN) {
      return (
        <div key={item.id} className="flex min-w-0 flex-1 justify-center">
          <button
            type="button"
            onClick={() => onNavigate(item.screen, item.params)}
            aria-current={isActive ? 'page' : undefined}
            className="relative flex h-16 w-16 shrink-0 -translate-y-3 flex-col items-center justify-center gap-0.5 rounded-full bg-nexoraBrand text-white shadow-lg ring-4 ring-white transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nexoraBrand"
          >
            <Icon className="h-5 w-5 -translate-y-[5px]" strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
            <span className="max-w-14 -translate-y-[5px] text-center text-[10px] font-semibold leading-3">
              {t(item.labelKey)}
            </span>
          </button>
        </div>
      )
    }
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
          className={`max-w-full px-0.5 text-center text-[10px] min-[375px]:text-[11px] sm:text-xs leading-tight font-semibold transition-colors duration-200 ${
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
      data-mobile-bottom-nav=""
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
