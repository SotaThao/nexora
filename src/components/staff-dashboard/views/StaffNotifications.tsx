// StaffNotifications — notification feed + push preferences.
import { useState } from 'react'
import { Bell, Star, Users, Wallet } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsPage,
  useUnreadCount,
} from '../../../data/hooks/useNotifications'
import type { NotificationRecord } from '../../../types/domain'
import { SkeletonLayout } from '../../ui/skeleton'
import { STAFF_NOTIFICATIONS_SKELETON } from '../skeletons/staffDashboardSkeletons'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'
const PAGE_SIZE = 20

const TYPE_ICON: Record<string, typeof Bell> = {
  TipReceived: Wallet,
  BusinessReview: Star,
  ReviewReply: Star,
  StaffLinkRequest: Users,
  StaffInviteAccepted: Users,
}

function notificationIcon(type: string) {
  return TYPE_ICON[type] || Bell
}

function Toggle({ on, onChange }) {
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

const PREF_KEYS = ['tipConfirmations', 'reviews', 'businessInvites']

function formatCreatedAt(iso: string | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function StaffNotifications() {
  const { t } = useTranslation()
  const { account, setPushPreference } = useStaffAccount()
  const [pageNumber, setPageNumber] = useState(0)
  const {
    data: notificationsPage = null,
    isPending,
    isFetching,
  } = useNotificationsPage({ pageNumber, pageSize: PAGE_SIZE })
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

  if (isPending && !notificationsPage) {
    return <SkeletonLayout blocks={STAFF_NOTIFICATIONS_SKELETON} />
  }

  const notifications = notificationsPage?.items ?? []
  const totalPages = notificationsPage?.totalPages ?? 0
  const canGoPrev = notificationsPage?.hasPreviousPage ?? pageNumber > 0
  const canGoNext = notificationsPage?.hasNextPage ?? (totalPages > 0 && pageNumber < totalPages - 1)
  const displayPage = pageNumber + 1

  const renderNotification = (n: NotificationRecord) => {
    const Icon = notificationIcon(n.type)
    const title = n.title?.trim() || t('staff_dashboard.notifications.generic_title')
    const message = (n.message || n.body || '').trim()

    return (
      <button
        key={n.id}
        type="button"
        onClick={() => !n.read && handleMarkRead(n.id)}
        disabled={n.read || markReadMutation.isPending}
        className={`flex w-full items-start gap-3 py-3 text-left transition ${n.read ? '' : 'rounded-lg bg-nexoraBrandSoft/30'}`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${n.type === 'BusinessReview' || n.type === 'ReviewReply' ? 'bg-amber-500' : 'bg-nexoraBrand'} ${n.read ? 'opacity-60' : ''}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className={`text-sm ${n.read ? 'font-bold text-nexoraMuted' : 'font-extrabold text-nexoraText'}`}>{title}</div>
          {message ? (
            <p className="mt-0.5 text-xs leading-normal text-nexoraMuted">{message}</p>
          ) : null}
          {n.createdAt ? (
            <p className="mt-1 text-[10px] text-nexoraSubtle">{formatCreatedAt(n.createdAt)}</p>
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
          <>
            <div className={`divide-y divide-nexoraBorder ${isFetching ? 'opacity-70' : ''}`}>
              {notifications.map(renderNotification)}
            </div>
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-nexoraBorder pt-3">
                <button
                  type="button"
                  onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
                  disabled={!canGoPrev || isFetching}
                  className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs font-bold text-nexoraText transition hover:bg-nexoraCanvas disabled:opacity-40"
                >
                  {t('common.back')}
                </button>
                <span className="text-xs text-nexoraMuted">
                  {t('staff_dashboard.tips.page_of', { page: displayPage, total: totalPages })}
                </span>
                <button
                  type="button"
                  onClick={() => setPageNumber((p) => p + 1)}
                  disabled={!canGoNext || isFetching}
                  className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs font-bold text-nexoraText transition hover:bg-nexoraCanvas disabled:opacity-40"
                >
                  {t('common.next')}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className={panel}>
        <h3 className="mb-3 text-base font-extrabold text-nexoraText">{t('staff_dashboard.notifications.push_prefs')}</h3>
        <div className="divide-y divide-nexoraBorder">
          {PREF_KEYS.map((key) => (
            <div key={key} className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm font-bold text-nexoraText">{t(`staff_dashboard.notifications.pref.${key}`)}</span>
              <Toggle on={!!account.pushPreferences?.[key]} onChange={(v) => setPushPreference(key, v)} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
