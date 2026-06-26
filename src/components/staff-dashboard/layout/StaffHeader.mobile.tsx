// StaffHeader — top bar: menu, brand, notifications bell, profile.
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Bell, Menu, Star, UserCheck, Wallet } from 'lucide-react'
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

export default function StaffHeader({ activeScreen, onNavigate, onOpenMobileMenu }) {
  const { t, currentLanguage } = useTranslation()
  const { staffMember, account } = useStaffAccount()
  const { data: unreadCount = 0 } = useUnreadCount()
  const displayName = account.defaultDisplayName || staffMember.fullName || 'Staff'
  const isNotificationsActive = activeScreen === 'notifications'

  const notificationBell = (compact = false) => (
    <button
      type="button"
      onClick={() => onNavigate('notifications')}
      aria-label={t('staff_dashboard.titles.notifications')}
      aria-current={isNotificationsActive ? 'page' : undefined}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-nexoraCanvas ${
        isNotificationsActive
          ? 'border border-nexoraBrand ring-2 ring-nexoraBrand/30'
          : compact
            ? ''
            : 'border border-nexoraBorder'
      }`}
    >
      <img src="/assets/menu/notification.png" alt="" className="h-5 w-5 object-contain" aria-hidden="true" />
      {unreadCount > 0 && (
        <span
          className={
            compact
              ? 'absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white'
              : 'absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-white'
          }
        >
          {!compact && (unreadCount > 99 ? '99+' : unreadCount)}
        </span>
      )}
    </button>
  )

  const [isNotiOpen, setIsNotiOpen] = useState(false)
  const notiMobileRef = useRef<HTMLDivElement>(null)
  const notiDesktopRef = useRef<HTMLDivElement>(null)

  const { data: notifications, isLoading: isNotificationsLoading } = useNotifications({ enabled: isNotiOpen })
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: markAllRead, isPending: isMarkAllPending } = useMarkAllNotificationsRead()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const inMobile = notiMobileRef.current?.contains(target)
      const inDesktop = notiDesktopRef.current?.contains(target)
      if (!inMobile && !inDesktop) setIsNotiOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = (item) => {
    if (!item.read) markRead(item.id)
    setIsNotiOpen(false)
    onNavigate(resolveStaffNotificationScreen(item.type))
  }

  return (
    <header className="sticky top-0 z-20 border-b border-nexoraBorder bg-nexoraSurface">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-nexoraText transition hover:bg-nexoraCanvas"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-9 w-9 shrink-0 object-contain" />
        </div>

        <div className="flex items-center justify-end gap-2">
          <LanguageSwitcher />
          <HeaderEcosystem />
          <div ref={notiMobileRef} className="relative">
            <button
              type="button"
              onClick={() => setIsNotiOpen((v) => !v)}
              aria-label={t('staff_dashboard.titles.notifications')}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-nexoraCanvas ${
                isNotiOpen ? 'ring-2 ring-nexoraBrand/30' : ''
              }`}
            >
              <img src="/assets/menu/notification.png" alt="" className="h-5 w-5 object-contain" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
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
          <HeaderEcosystem />

          <div ref={notiDesktopRef} className="relative">
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
