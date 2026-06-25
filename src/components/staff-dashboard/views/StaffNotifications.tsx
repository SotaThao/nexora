// StaffNotifications — notification feed + push preferences.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Star, Users, Wallet } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '../../../data/hooks/useNotifications'
import type { NotificationRecord } from '../../../types/domain'
import { SkeletonLayout } from '../../ui/skeleton'
import { STAFF_NOTIFICATIONS_SKELETON } from '../skeletons/staffDashboardSkeletons'
import { formatNotificationDateTime } from '../../dashboard/utils'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm sm:p-5'
const notificationRowBase = 'flex w-full items-start gap-3 px-3 py-3 text-left transition'
const listRowBase = 'px-3 py-3'

function notificationRowClass(read: boolean, hasAction = false) {
  if (read) {
    return `${notificationRowBase}${hasAction ? ' cursor-pointer rounded-xl hover:bg-nexoraCanvas/60' : ''}`
  }

  return `${notificationRowBase} rounded-xl bg-nexoraBrandSoft/30${hasAction ? ' cursor-pointer hover:bg-nexoraBrandSoft/40' : ''}`
}

const TYPE_ICON: Record<string, typeof Bell> = {
  TipReceived: Wallet,
  BusinessReview: Star,
  ReviewReply: Star,
  StaffLinkRequest: Users,
  StaffLinkApproved: Users,
  StaffInviteAccepted: Users,
}

function notificationIcon(type: string) {
  return TYPE_ICON[type] || Bell
}

const STAFF_ACTION_URL_ALIASES: Record<string, string> = {
  '/staff/businesses': '/staff',
}

function resolveStaffNotificationActionUrl(actionUrl: string | null | undefined): string | null {
  if (!actionUrl?.trim()) return null
  const trimmed = actionUrl.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const queryOrHashIndex = trimmed.search(/[?#]/)
  const pathPart = queryOrHashIndex === -1 ? trimmed : trimmed.slice(0, queryOrHashIndex)
  const suffix = queryOrHashIndex === -1 ? '' : trimmed.slice(queryOrHashIndex)
  const resolvedPath = STAFF_ACTION_URL_ALIASES[pathPart] || pathPart
  return `${resolvedPath}${suffix}`
}

function Toggle({ on, onChange }: { on: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-emerald-500' : 'bg-nexoraBorder'}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

const PREF_KEYS = ['tipConfirmations', 'reviews', 'businessInvites'] as const

export default function StaffNotifications() {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  const { account, setPushPreference } = useStaffAccount()
  const { data: notifications = [], isPending } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadCount()
  const markReadMutation = useMarkNotificationRead()
  const markAllReadMutation = useMarkAllNotificationsRead()

  const handleMarkRead = (id: string) => {
    if (markReadMutation.isPending) return
    markReadMutation.mutate(id)
  }

  const handleMarkAllRead = () => {
    if (markAllReadMutation.isPending) return
    markAllReadMutation.mutate()
  }

  const handleNotificationClick = (notification: NotificationRecord) => {
    if (!notification.read) handleMarkRead(notification.id)

    // Salon link requests are actioned (Accept/Decline) on the Salon Link & Tips page.
    if (notification.type === 'StaffLinkRequest') {
      navigate('/staff/qr')
      return
    }

    const target = resolveStaffNotificationActionUrl(notification.actionUrl)
    if (!target) return

    if (/^https?:\/\//i.test(target)) {
      window.location.assign(target)
      return
    }

    navigate(target)
  }

  if (isPending) {
    return <SkeletonLayout blocks={STAFF_NOTIFICATIONS_SKELETON} />
  }

  const renderNotification = (n: NotificationRecord) => {
    const Icon = notificationIcon(n.type)
    const title = n.title?.trim() || t('staff_dashboard.notifications.generic_title')
    const message = (n.message || n.body || '').trim()
    const hasAction =
      n.type === 'StaffLinkRequest' || Boolean(resolveStaffNotificationActionUrl(n.actionUrl))

    return (
      <button
        key={n.id}
        type="button"
        onClick={() => handleNotificationClick(n)}
        className={notificationRowClass(n.read, hasAction)}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${n.type === 'BusinessReview' || n.type === 'ReviewReply' ? 'bg-amber-500' : 'bg-nexoraBrand'} ${n.read ? 'opacity-60' : ''}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className={`text-sm ${n.read ? 'font-bold text-nexoraMuted' : 'font-extrabold text-nexoraText'}`}>{title}</div>
          {message ? (
            <p className="mt-0.5 text-xs leading-normal text-nexoraMuted">{message}</p>
          ) : null}
          {(n.createdAt || n.time) ? (
            <p className="mt-1 text-[10px] text-nexoraSubtle">
              {formatNotificationDateTime(n.createdAt || n.time, currentLanguage)}
            </p>
          ) : null}
        </div>
        {!n.read && <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-nexoraBrand" />}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <section className={panel}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-nexoraText">{t('staff_dashboard.titles.notifications')}</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="shrink-0 text-xs font-bold text-nexoraBrand transition hover:opacity-80 disabled:opacity-50"
            >
              {t('staff_dashboard.notifications.mark_all_read')}
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="py-6 text-center text-xs text-nexoraSubtle">{t('staff_dashboard.notifications.empty')}</p>
        ) : (
          <div className="space-y-1">
            {notifications.map(renderNotification)}
          </div>
        )}
      </section>

      <section className={panel}>
        <h3 className="mb-3 text-base font-extrabold text-nexoraText">{t('staff_dashboard.notifications.push_prefs')}</h3>
        <div className="space-y-1">
          {PREF_KEYS.map((key) => (
            <div key={key} className={`flex items-center justify-between gap-3 ${listRowBase}`}>
              <span className="text-sm font-bold text-nexoraText">{t(`staff_dashboard.notifications.pref.${key}`)}</span>
              <Toggle on={!!account.pushPreferences?.[key]} onChange={(v) => setPushPreference(key, v)} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
