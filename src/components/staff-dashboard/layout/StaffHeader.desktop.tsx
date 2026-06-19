// StaffHeader — top bar: brand (mobile), language switch, notifications bell, profile dropdown.
import { useState, useRef, useEffect } from 'react'
import { Menu, Settings, ShieldCheck, LogOut } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useUnreadCount } from '../../../data/hooks/useNotifications'
import LanguageSwitcher from '../../ui/LanguageSwitcher'

export default function StaffHeader({ activeScreen, onNavigate, onOpenMobileMenu, onLogout }) {
  const { t } = useTranslation()
  const { staffMember, account } = useStaffAccount()
  const { data: unreadCount = 0 } = useUnreadCount()
  const displayName = account.defaultDisplayName || staffMember.fullName || 'Staff'

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProfileNav = (tab: string) => {
    onNavigate('profile', { tab })
    setIsProfileOpen(false)
  }

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-nexoraBorder bg-nexoraSurface px-4 sm:px-5">
      {/* Menu trigger (mobile only — sidebar shows nav on desktop) */}
      <div className="flex min-w-0 items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-nexoraBorder bg-white text-nexoraText shadow-nexora-soft transition hover:bg-nexoraSurfaceMuted"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Screen title (desktop) */}
      <div className="hidden min-w-0 lg:block">
        <h1 className="truncate text-lg font-extrabold text-nexoraText">{t(`staff_dashboard.titles.${activeScreen}`)}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Language switch */}
        <LanguageSwitcher />

        {/* Notifications bell */}
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

        {/* Profile avatar + dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen((v) => !v)}
            aria-label={t('staff_dashboard.titles.profile')}
            className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border transition hover:opacity-90 ${
              isProfileOpen ? 'border-nexoraBrand ring-2 ring-nexoraBrand/30' : 'border-nexoraBorder'
            }`}
          >
            {account.avatar ? (
              <img src={account.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-nexoraBrand text-sm font-bold text-white">
                {displayName.charAt(0)}
              </div>
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-nexoraBorder bg-nexoraSurface shadow-lg animate-fadeIn">
              {/* User info */}
              <div className="border-b border-nexoraBorder px-4 py-3">
                <div className="truncate text-sm font-bold text-nexoraText">
                  {account.fullName || staffMember.fullName || displayName}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-nexoraMuted">
                  {t('staff_dashboard.staff_id')}: {account.staffCode || staffMember.id}
                </div>
              </div>

              {/* Menu items */}
              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleProfileNav('account')}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-nexoraText transition hover:bg-nexoraCanvas"
                >
                  <Settings className="h-4 w-4 text-nexoraMuted" />
                  <span>{t('staff_dashboard.nav.profile_account')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProfileNav('kyc')}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-nexoraText transition hover:bg-nexoraCanvas"
                >
                  <ShieldCheck className="h-4 w-4 text-nexoraMuted" />
                  <span>{t('staff_dashboard.nav.profile_kyc')}</span>
                </button>
              </div>

              {/* Sign out */}
              <div className="border-t border-nexoraBorder p-1.5">
                <button
                  type="button"
                  onClick={() => { setIsProfileOpen(false); onLogout?.() }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('staff_dashboard.sign_out')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
