// StaffNotifications: notification feed + push preferences.
import { Bell, Check, Star, Wallet, XCircle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useMarkNotificationRead, useNotifications } from '../../../data/hooks/useNotifications'
import {
  useAcceptStaffLinkRequest,
  useRejectStaffLinkRequest,
  useStaffLinkRequest,
} from '../../../data/hooks/useStaffSelf'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

const TYPE_ICON = { tip: Wallet, review: Star }

function getStaffLinkRequestId(notification) {
  if (notification.referenceId) return notification.referenceId
  const match = String(notification.actionUrl || '').match(/\/staff\/link-requests\/([^/?#]+)/i)
  return match?.[1] || null
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

function StaffLinkRequestNotification({ notification, onRead }) {
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
    <div className={`flex w-full items-start gap-3 py-3 text-left transition ${notification.read ? '' : 'rounded-lg bg-nexoraBrandSoft/30'}`}>
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
  const {
    notifications: localNotifications = [],
    account,
    markNotificationRead: markLocalNotificationRead,
    setPushPreference,
  } = useStaffAccount()
  const { data: apiNotifications = [] } = useNotifications()
  const markServerNotificationRead = useMarkNotificationRead()
  const notifications = apiNotifications.length ? apiNotifications : localNotifications

  const markNotificationRead = (id) => {
    if (apiNotifications.some((notification) => notification.id === id)) {
      markServerNotificationRead.mutate(id)
      return
    }
    markLocalNotificationRead?.(id)
  }

  return (
    <div className="space-y-4">
      <section className={panel}>
        <h3 className="mb-3 text-base font-extrabold text-nexoraText">{t('staff_dashboard.titles.notifications')}</h3>
        {notifications.length === 0 ? (
          <p className="py-6 text-center text-xs text-nexoraSubtle">{t('staff_dashboard.notifications.empty')}</p>
        ) : (
          <div className="divide-y divide-nexoraBorder">
            {notifications.map((n) => {
              if (n.type === 'StaffLinkRequest') {
                return (
                  <StaffLinkRequestNotification
                    key={n.id}
                    notification={n}
                    onRead={markNotificationRead}
                  />
                )
              }

              const Icon = TYPE_ICON[n.type] || Bell
              const title = n.title || (n.type === 'review'
                ? t('staff_dashboard.notifications.review_title', { rating: n.rating })
                : t('staff_dashboard.notifications.tip_title'))
              const message = n.message || n.body || (n.type === 'review'
                ? n.comment
                : t('staff_dashboard.notifications.tip_message', { amount: n.amount, method: n.method }))

              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markNotificationRead(n.id)}
                  className={`flex w-full items-start gap-3 py-3 text-left transition ${n.read ? '' : 'rounded-lg bg-nexoraBrandSoft/30'}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${n.type === 'review' ? 'bg-amber-500' : 'bg-nexoraBrand'} ${n.read ? 'opacity-60' : ''}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className={`text-sm ${n.read ? 'font-bold text-nexoraMuted' : 'font-extrabold text-nexoraText'}`}>{title}</div>
                    <p className="mt-0.5 text-xs leading-normal text-nexoraMuted">{message}</p>
                  </div>
                  {!n.read && <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-nexoraBrand" />}
                </button>
              )
            })}
          </div>
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
