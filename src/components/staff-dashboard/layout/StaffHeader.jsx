// StaffHeader — top bar: brand (mobile), language switch, notifications bell, profile.
import { Bell } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'

export default function StaffHeader({ activeScreen, onNavigate }) {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const { staffMember, account, unreadCount } = useStaffAccount()
  const displayName = account.defaultDisplayName || staffMember.fullName || 'Staff'

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-nexoraBorder bg-nexoraSurface px-4 sm:px-5">
      {/* Brand (mobile only — sidebar shows it on desktop) */}
      <div className="flex min-w-0 items-center gap-3 lg:hidden">
        <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-9 w-9 shrink-0 object-contain" />
        <span className="truncate text-sm font-extrabold">{t('staff_dashboard.brand.title')}</span>
      </div>

      {/* Screen title (desktop) */}
      <div className="hidden min-w-0 lg:block">
        <h1 className="truncate text-lg font-extrabold text-nexoraText">{t(`staff_dashboard.titles.${activeScreen}`)}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Language switch */}
        <div className="flex items-center gap-1 rounded-lg border border-nexoraBorder bg-nexoraSurfaceMuted px-2.5 py-1">
          <button
            type="button"
            onClick={() => setLanguage('vi')}
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${currentLanguage === 'vi' ? 'bg-nexoraBrand text-white' : 'text-nexoraMuted hover:text-nexoraText'}`}
          >
            VI
          </button>
          <span className="text-[10px] text-nexoraBorder">|</span>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${currentLanguage === 'en' ? 'bg-nexoraBrand text-white' : 'text-nexoraMuted hover:text-nexoraText'}`}
          >
            EN
          </button>
        </div>

        {/* Notifications bell */}
        <button
          type="button"
          onClick={() => onNavigate('notifications')}
          aria-label={t('staff_dashboard.titles.notifications')}
          className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-nexoraBorder transition hover:bg-nexoraCanvas ${
            activeScreen === 'notifications' ? 'text-nexoraBrand' : 'text-nexoraText'
          }`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile avatar */}
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
    </header>
  )
}
