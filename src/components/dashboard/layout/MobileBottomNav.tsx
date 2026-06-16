import { Home, QrCode, CircleDollarSign, Star, User } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'overview',    label: 'Home',    Icon: Home },
  { id: 'touchpoints', label: 'My QR',   Icon: QrCode },
  { id: 'tips',        label: 'Tips',    Icon: CircleDollarSign },
  { id: 'reviews',     label: 'Reviews', Icon: Star },
  { id: 'settings',   label: 'Profile', Icon: User },
]

export default function MobileBottomNav({ activeMenu, onNavigate }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white lg:hidden"
      style={{
        paddingBottom: 'var(--app-safe-area-bottom)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeMenu === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full focus:outline-none active:scale-95 transition-transform"
            >
              <Icon
                className={`h-5 w-5 transition-colors duration-200 ${
                  isActive
                    ? 'text-nexoraBrand'
                    : 'text-gray-400'
                }`}
                strokeWidth={isActive ? 2.5 : 1.8}
                fill={isActive && (id === 'overview') ? 'currentColor' : 'none'}
              />
              <span
                className={`text-[10px] font-bold transition-colors duration-200 ${
                  isActive ? 'text-nexoraBrand' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
