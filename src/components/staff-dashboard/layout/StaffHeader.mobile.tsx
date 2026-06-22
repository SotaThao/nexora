// StaffHeader — top bar: menu, brand, notifications bell, profile.
import { Menu } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useUnreadCount } from '../../../data/hooks/useNotifications'
import LanguageSwitcher from '../../ui/LanguageSwitcher'

export default function StaffHeader({ activeScreen, onNavigate, onOpenMobileMenu }) {
  const { t } = useTranslation()
  const { staffMember, account } = useStaffAccount()
  const { data: unreadCount = 0 } = useUnreadCount()
  const displayName = account.defaultDisplayName || staffMember.fullName || 'Staff'

  return (
    <header className="safe-area-top sticky top-0 z-20 border-b border-nexoraBorder bg-nexoraSurface">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-nexoraText transition hover:bg-nexoraCanvas"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-end gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            aria-label={t('staff_dashboard.titles.notifications')}
            className={`relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-nexoraCanvas ${
              activeScreen === 'notifications' ? 'text-nexoraBrand' : 'text-nexoraText'
            }`}
          >
            <img
              src="/assets/menu/notification.png"
              alt=""
              className="h-5 w-5 object-contain"
              aria-hidden="true"
            />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            aria-label={t('staff_dashboard.titles.profile')}
            className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-sm transition hover:opacity-90"
          >
            {account.avatar ? (
              <img src={account.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-sm font-bold text-white">
                {displayName.charAt(0)}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </button>
        </div>
      </div>

      {/* Desktop top bar */}
      <div className="hidden min-h-16 items-center justify-between gap-3 px-5 lg:flex">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold text-nexoraText">{t(`staff_dashboard.titles.${activeScreen}`)}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitcher />

          <button
            type="button"
            onClick={() => onNavigate('notifications')}
            aria-label={t('staff_dashboard.titles.notifications')}
            className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-nexoraBorder transition hover:bg-nexoraCanvas ${
              activeScreen === 'notifications' ? 'text-nexoraBrand' : 'text-nexoraText'
            }`}
          >
            <img
              src="/assets/menu/notification.png"
              alt=""
              className="h-5 w-5 object-contain"
              aria-hidden="true"
            />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            aria-label={t('staff_dashboard.titles.profile')}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-nexoraBorder transition hover:opacity-90"
          >
            {account.avatar ? (
              <img src={account.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-nexoraBrand text-sm font-bold text-white">
                {displayName.charAt(0)}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
