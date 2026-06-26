// StaffHeader — top bar: brand (mobile), language switch, notifications bell, profile dropdown.
import { useState, useRef, useEffect } from 'react'
import { AlertTriangle, Bell, LogOut, Menu, Settings, ShieldCheck, Star, UserCheck, Wallet } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '../../../data/hooks/useNotifications'
import { formatNotificationDateTime } from '../../dashboard/utils'
import { resolveStaffNotificationScreen } from '../constants'
import LanguageSwitcher from '../../ui/LanguageSwitcher'
import HeaderEcosystem from '../../dashboard/layout/HeaderEcosystem'

export default function StaffHeader({ activeScreen, onNavigate, onOpenMobileMenu, onLogout }) {
  const { t, currentLanguage } = useTranslation()
  const { staffMember, account } = useStaffAccount()
  const { data: unreadCount = 0 } = useUnreadCount()
  const displayName = account.defaultDisplayName || staffMember.fullName || 'Staff'

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotiOpen, setIsNotiOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const notiRef = useRef<HTMLDivElement>(null)

  const { data: notifications, isLoading: isNotificationsLoading } = useNotifications({ enabled: isNotiOpen })
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: markAllRead, isPending: isMarkAllPending } = useMarkAllNotificationsRead()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false)
      }
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setIsNotiOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProfileNav = (tab: string) => {
    onNavigate('profile', { tab })
    setIsProfileOpen(false)
  }

  const handleNotificationClick = (item) => {
    if (!item.read) markRead(item.id)
    setIsNotiOpen(false)
    onNavigate(resolveStaffNotificationScreen(item.type))
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
        <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-9 w-9 shrink-0 object-contain" />
      </div>

      {/* Screen title (desktop) */}
      <div className="hidden min-w-0 lg:block">
        <h1 className="truncate text-lg font-extrabold text-nexoraText">{t(`staff_dashboard.titles.${activeScreen}`)}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <LanguageSwitcher />

        <HeaderEcosystem />

        {/* Notifications bell + dropdown */}
        <div ref={notiRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotiOpen((v) => !v)}
            aria-label={t('staff_dashboard.titles.notifications')}
            className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition hover:bg-nexoraCanvas ${
              isNotiOpen ? 'border-nexoraBrand ring-2 ring-nexoraBrand/30' : 'border-nexoraBorder'
            }`}
          >
            <img src="/assets/menu/notification.png" alt="" className="h-5 w-5 object-contain" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isNotiOpen && (
            <div className="absolute right-0 top-12 z-50 flex max-h-[460px] w-80 flex-col overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-nexoraBorder bg-nexoraSurfaceMuted px-4 py-3">
                <span className="text-xs font-black uppercase tracking-wider text-nexoraText">
                  {t('staff_dashboard.titles.notifications')} ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    disabled={isMarkAllPending}
                    className="text-[10px] font-bold text-nexoraBrand hover:underline disabled:opacity-50"
                  >
                    {t('staff_dashboard.notifications.mark_all_read')}
                  </button>
                )}
              </div>

              <div className="max-h-[380px] flex-grow divide-y divide-nexoraBorder overflow-y-auto">
                {isNotificationsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Bell className="mb-2 h-8 w-8 animate-pulse text-nexoraBorder" />
                    <p className="text-xs font-semibold text-nexoraSubtle">{t('common.loading')}</p>
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  notifications.map((item) => {
                    const typeLower = (item.type || '').toLowerCase().replace(/[\s_-]+/g, '')
                    const IconComponent = ({
                      tip_success: Wallet, tipsuccess: Wallet,
                      feedback_alert: AlertTriangle, feedbackalert: AlertTriangle,
                      review_good: Star, reviewgood: Star,
                      staff_accepted_invite: UserCheck, staffacceptedinvite: UserCheck,
                      stafflinkrequest: UserCheck, staff_link_request: UserCheck,
                    } as Record<string, typeof Bell>)[typeLower] ?? Bell
                    const iconColor = ({
                      tip_success: 'bg-emerald-500 text-white', tipsuccess: 'bg-emerald-500 text-white',
                      feedback_alert: 'bg-amber-500 text-white', feedbackalert: 'bg-amber-500 text-white',
                      review_good: 'bg-yellow-400 text-white', reviewgood: 'bg-yellow-400 text-white',
                    } as Record<string, string>)[typeLower] ?? 'bg-nexoraBrand text-white'
                    const isUnread = !item.read
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNotificationClick(item)}
                        className={`relative flex w-full items-start gap-3 border-b border-nexoraBorder/50 p-3.5 text-left transition-colors last:border-0 hover:bg-nexoraCanvas ${
                          isUnread ? 'bg-nexoraBrandSoft/40' : 'bg-white'
                        }`}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColor} ${!isUnread ? 'opacity-60' : ''}`}>
                          <IconComponent className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-grow">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`truncate text-xs ${isUnread ? 'font-extrabold text-nexoraText' : 'font-bold text-nexoraMuted'}`}>
                              {item.title}
                            </span>
                            <span className="shrink-0 text-[10px] font-medium text-nexoraSubtle">
                              {formatNotificationDateTime(item.createdAt || item.time, currentLanguage)}
                            </span>
                          </div>
                          <p className={`mt-1 break-words text-[11px] leading-normal ${isUnread ? 'font-semibold text-nexoraText' : 'font-medium text-nexoraMuted'}`}>
                            {item.message}
                          </p>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Bell className="mb-2 h-8 w-8 text-nexoraBorder" />
                    <p className="text-xs font-semibold text-nexoraSubtle">{t('staff_dashboard.notifications.empty')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
              <div className="border-b border-nexoraBorder px-4 py-3">
                <div className="truncate text-sm font-bold text-nexoraText">
                  {account.fullName || staffMember.fullName || displayName}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-nexoraMuted">
                  {t('staff_dashboard.staff_id')}: {account.staffCode || staffMember.id}
                </div>
              </div>

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
                  disabled
                  aria-disabled="true"
                  className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-nexoraMuted opacity-60"
                >
                  <ShieldCheck className="h-4 w-4 text-nexoraMuted" />
                  <span>{t('staff_dashboard.nav.profile_kyc')}</span>
                </button>
              </div>

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
