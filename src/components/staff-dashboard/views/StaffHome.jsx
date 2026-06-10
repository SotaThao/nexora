// StaffHome — KPI overview, quick actions, pending confirmations, linked businesses.
import { Calendar, ChevronRight, Clock, DollarSign, Gift, Star } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { STAFF_QUICK_ACTIONS } from '../constants'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface shadow-sm'

function getGreetingKey() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

function formatTimeAgo(dateTime = '') {
  if (!dateTime) return ''
  const parsed = new Date(dateTime)
  if (Number.isNaN(parsed.getTime())) return ''
  const diffMs = Date.now() - parsed.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatCurrency(amount) {
  return `$${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function StarRating({ rating }) {
  const value = Number(rating) || 0
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-nexoraBorder text-nexoraBorder'}`}
        />
      ))}
    </div>
  )
}

function KpiCard({ icon: Icon, iconBg, label, value, sub, subClass, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${panel} flex flex-col gap-2 p-4 text-left transition hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-nexoraSubtle" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-nexoraSubtle">{label}</div>
        <div className="mt-1 text-2xl font-extrabold leading-tight text-nexoraText">{value}</div>
        {sub ? (
          <div className={`mt-0.5 text-[11px] font-bold ${subClass}`}>{sub}</div>
        ) : null}
      </div>
    </button>
  )
}

function CustomerAvatar({ name = '?' }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-purple-200 text-sm font-bold text-purple-700">
      {initial}
    </div>
  )
}

export default function StaffHome() {
  const { t } = useTranslation()
  const { onNavigate } = useOutletContext()
  const { kpis, pendingTips, confirmTip, linkedBusinesses, account, staffMember } = useStaffAccount()

  const displayName = account.defaultDisplayName || staffMember.fullName?.split(' ')[0] || 'Staff'
  const greetingKey = getGreetingKey()
  const previewPending = pendingTips.slice(0, 3)

  const handleQuickAction = (id) => {
    if (id === 'refer') {
      onNavigate('profile')
      return
    }
    onNavigate(id)
  }

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <section>
        <h2 className="text-2xl font-extrabold tracking-tight text-nexoraText">
          {t(`staff_dashboard.home.greeting_${greetingKey}`, { name: displayName })}
        </h2>
        <p className="mt-1 text-sm text-nexoraMuted">{t('staff_dashboard.home.performance_subtitle')}</p>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3">
        <KpiCard
          icon={DollarSign}
          iconBg="bg-emerald-100 text-emerald-600"
          label={t('staff_dashboard.home.today_tips')}
          value={formatCurrency(kpis.todayTips)}
          sub={t('staff_dashboard.home.tips_plus', { count: kpis.todayCount })}
          subClass="text-emerald-600"
          onClick={() => onNavigate('tips')}
        />
        <KpiCard
          icon={Calendar}
          iconBg="bg-violet-100 text-violet-600"
          label={t('staff_dashboard.home.this_month')}
          value={formatCurrency(kpis.monthTips)}
          sub={t('staff_dashboard.home.tips_plus', { count: kpis.monthCount })}
          subClass="text-violet-600"
          onClick={() => onNavigate('tips')}
        />
        <KpiCard
          icon={Clock}
          iconBg="bg-amber-100 text-amber-600"
          label={t('staff_dashboard.home.pending')}
          value={formatCurrency(kpis.pendingAmount)}
          sub={t('staff_dashboard.home.awaiting_confirm', { count: kpis.pendingCount })}
          subClass="text-amber-600"
          onClick={() => onNavigate('tips')}
        />
        <KpiCard
          icon={Star}
          iconBg="bg-blue-100 text-blue-600"
          label={t('staff_dashboard.home.rating')}
          value={kpis.rating || '—'}
          sub={<StarRating rating={kpis.rating} />}
          subClass=""
          onClick={() => onNavigate('reviews')}
        />
      </section>

      {/* Quick actions */}
      <section className={`${panel} px-2 py-4`}>
        <div className="grid grid-cols-5 gap-1">
          {STAFF_QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleQuickAction(action.id)}
                className="flex flex-col items-center gap-2 px-1 py-1 transition hover:opacity-80"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${action.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-center text-[10px] font-semibold leading-tight text-nexoraText">
                  {t(action.labelKey)}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Pending confirmations */}
      <section className={`${panel} p-4`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-nexoraText">{t('staff_dashboard.home.pending_confirmations')}</h3>
          {pendingTips.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('tips')}
              className="text-xs font-bold text-nexoraBrand transition hover:text-nexoraBrandDark"
            >
              {t('staff_dashboard.home.view_all')}
            </button>
          )}
        </div>
        {previewPending.length === 0 ? (
          <p className="py-6 text-center text-xs text-nexoraSubtle">{t('staff_dashboard.home.no_pending')}</p>
        ) : (
          <div className="divide-y divide-nexoraBorder">
            {previewPending.map((tip) => {
              const customerName = tip.customerName || tip.touchpoint || t('staff_dashboard.home.anonymous_customer')
              const timeAgo = formatTimeAgo(tip.dateTime)
              return (
                <div key={tip.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <CustomerAvatar name={customerName} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-nexoraText">{customerName}</div>
                    {tip.paymentMethod ? (
                      <div className="mt-0.5 truncate text-xs text-nexoraMuted">
                        {t('staff_dashboard.home.via_method', { method: tip.paymentMethod })}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-sm font-bold text-nexoraBrand">{formatCurrency(tip.amount)}</span>
                    {timeAgo ? <span className="text-[11px] text-nexoraMuted">{timeAgo}</span> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => confirmTip(tip.id)}
                    className="shrink-0 rounded-full border-2 border-nexoraBrand px-4 py-1.5 text-xs font-bold text-nexoraBrand transition hover:bg-nexoraBrandSoft"
                  >
                    {t('staff_dashboard.home.confirm')}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Linked businesses */}
      <section className={`${panel} p-4`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-nexoraText">{t('staff_dashboard.home.your_linked_businesses')}</h3>
          <button
            type="button"
            onClick={() => onNavigate('qr')}
            className="text-xs font-bold text-nexoraBrand transition hover:text-nexoraBrandDark"
          >
            {t('staff_dashboard.home.manage')}
          </button>
        </div>
        <div className="divide-y divide-nexoraBorder">
          {linkedBusinesses.map((biz) => (
            <button
              key={biz.businessStaffLinkId}
              type="button"
              onClick={() => onNavigate('qr')}
              className="flex w-full items-center gap-3 py-3 text-left transition hover:opacity-80 first:pt-0 last:pb-0"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nexoraText text-sm font-black text-white">
                {biz.businessName?.charAt(0) || 'B'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-nexoraText">{biz.businessName}</div>
                <div className="truncate text-xs text-nexoraMuted">
                  {t('staff_dashboard.home.display_name')}: {biz.displayName}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${
                  biz.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-nexoraCanvas text-nexoraMuted'
                }`}
              >
                {biz.status === 'Active' ? t('staff_dashboard.status.active') : t('staff_dashboard.status.inactive')}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-nexoraSubtle" />
            </button>
          ))}
        </div>
      </section>

      {/* Referral banner */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-nexoraViolet via-nexoraBrand to-nexoraElectric p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-white">{t('staff_dashboard.home.refer_title')}</div>
            <div className="mt-0.5 text-xs font-medium text-white/80">{t('staff_dashboard.home.refer_subtitle')}</div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-nexoraBrand transition hover:bg-white/90"
          >
            {t('staff_dashboard.home.invite_now')}
          </button>
        </div>
      </section>
    </div>
  )
}
