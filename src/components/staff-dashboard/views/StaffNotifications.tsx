// StaffNotifications — notification feed + push preferences.
import { Bell, Wallet, Star } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

const TYPE_ICON = { tip: Wallet, review: Star }

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

export default function StaffNotifications() {
  const { t } = useTranslation()
  const { notifications, account, markNotificationRead, setPushPreference } = useStaffAccount()

  return (
    <div className="space-y-4">
      <section className={panel}>
        <h3 className="mb-3 text-base font-extrabold text-nexoraText">{t('staff_dashboard.titles.notifications')}</h3>
        {notifications.length === 0 ? (
          <p className="py-6 text-center text-xs text-nexoraSubtle">{t('staff_dashboard.notifications.empty')}</p>
        ) : (
          <div className="divide-y divide-nexoraBorder">
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] || Bell
              const title = n.type === 'review'
                ? t('staff_dashboard.notifications.review_title', { rating: n.rating })
                : t('staff_dashboard.notifications.tip_title')
              const message = n.type === 'review'
                ? n.comment
                : t('staff_dashboard.notifications.tip_message', { amount: n.amount, method: n.method })
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
