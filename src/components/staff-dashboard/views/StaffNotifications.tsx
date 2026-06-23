// StaffNotifications — notification feed + push preferences.
import { useNavigate } from 'react-router-dom'
import { Bell, Check, Star, Users, Wallet, XCircle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '../../../data/hooks/useNotifications'
import type { NotificationRecord } from '../../../types/domain'
import { SkeletonLayout } from '../../ui/skeleton'
import ToggleSwitch from '../../ui/ToggleSwitch'
import { STAFF_NOTIFICATIONS_SKELETON } from '../skeletons/staffDashboardSkeletons'
import {
  useAcceptStaffLinkRequest,
  useRejectStaffLinkRequest,
  useStaffLinkRequest,
} from '../../../data/hooks/useStaffSelf'

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

function getStaffLinkRequestId(notification: NotificationRecord) {
  if (notification.referenceId) return notification.referenceId
  const match = String(notification.actionUrl || '').match(/\/staff\/link-requests\/([^/?#]+)/i)
  return match?.[1] || null
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

function StaffLinkRequestNotification({
  notification,
  onRead,
}: {
  notification: NotificationRecord
  onRead: (id: string) => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const linkId = getStaffLinkRequestId(notification)
  const detailQuery = useStaffLinkRequest(linkId)
  const acceptMutation = useAcceptStaffLinkRequest()
  const rejectMutation = useRejectStaffLinkRequest()
  const detail = detailQuery.data
  const isPending = acceptMutation.isPending || rejectMutation.isPending
  const businessName = detail?.businessName || notification.title || t('staff_dashboard.notifications.link_request_business_fallback')

  const handleAccept = () => {
    if (!linkId) return
    acceptMutation.mutate(linkId, {
      onSuccess: () => {
        onRead(notification.id)
        showToast(t('staff_dashboard.notifications.link_request_accepted'), 'success')
      },
      onError: () => showToast(t('staff_dashboard.notifications.link_request_accept_failed'), 'error'),
    })
  }

  const handleReject = () => {
    if (!linkId) return
    rejectMutation.mutate(linkId, {
      onSuccess: () => {
        onRead(notification.id)
        showToast(t('staff_dashboard.notifications.link_request_rejected'), 'success')
      },
      onError: () => showToast(t('staff_dashboard.notifications.link_request_reject_failed'), 'error'),
    })
  }

  return (
    <div className={notificationRowClass(notification.read)}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nexoraBrand text-white ${notification.read ? 'opacity-60' : ''}`}>
        <Bell className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className={`text-sm ${notification.read ? 'font-bold text-nexoraMuted' : 'font-extrabold text-nexoraText'}`}>
          {t('staff_dashboard.notifications.link_request_title')}
        </div>
        <p className="mt-0.5 text-xs leading-normal text-nexoraMuted">
          {detailQuery.isLoading
            ? t('common.loading')
            : t('staff_dashboard.notifications.link_request_message', { businessName })}
        </p>
        {detail?.businessRole && (
          <p className="mt-1 text-[11px] font-bold text-nexoraSubtle">
            {t('staff_dashboard.notifications.link_request_role', { role: detail.businessRole })}
          </p>
        )}
        {linkId ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAccept}
              disabled={isPending || detail?.status === 'Active'}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-extrabold text-white transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {t('staff_dashboard.notifications.accept_link_request')}
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={isPending || detail?.status === 'Rejected'}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-nexoraDanger/20 bg-nexoraDanger/10 px-4 text-xs font-extrabold text-nexoraDanger transition hover:bg-nexoraDanger/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              {t('staff_dashboard.notifications.reject_link_request')}
            </button>
          </div>
        ) : (
          <p className="mt-2 text-xs font-bold text-nexoraDanger">
            {t('staff_dashboard.notifications.link_request_missing_id')}
          </p>
        )}
      </div>
      {!notification.read && <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-nexoraBrand" />}
    </div>
  )
}

export default function StaffNotifications() {
  const { t } = useTranslation()
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
    if (n.type === 'StaffLinkRequest') {
      return (
        <StaffLinkRequestNotification
          key={n.id}
          notification={n}
          onRead={handleMarkRead}
        />
      )
    }

    const Icon = notificationIcon(n.type)
    const title = n.title?.trim() || t('staff_dashboard.notifications.generic_title')
    const message = (n.message || n.body || '').trim()
    const hasAction = Boolean(resolveStaffNotificationActionUrl(n.actionUrl))

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
              <ToggleSwitch
                checked={!!account.pushPreferences?.[key]}
                onChange={() => setPushPreference(key, !account.pushPreferences?.[key])}
                size="md"
                activeColor="bg-emerald-500"
                inactiveColor="bg-nexoraBorder"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
