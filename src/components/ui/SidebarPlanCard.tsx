import { Crown } from 'lucide-react'

interface SubscriptionSidebarCopy {
  planLabel: string | null
  detailLabel: string | null
}

interface SidebarPlanCardProps {
  subscriptionCopy: SubscriptionSidebarCopy
  onManagePlan: () => void
  t: (key: string, params?: Record<string, string>) => string
  compact?: boolean
}

export default function SidebarPlanCard({
  subscriptionCopy,
  onManagePlan,
  t,
  compact = false,
}: SidebarPlanCardProps) {
  const planNameClass = compact ? 'text-xs font-bold text-white' : 'text-sm font-bold text-white'
  const detailClass = compact ? 'text-[10px] text-white/55' : 'text-xs text-white/55'
  const buttonClass = compact
    ? 'shrink-0 rounded-lg border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-white/5 hover:border-white/30'
    : 'shrink-0 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/5 hover:border-white/30'
  const iconWrapClass = compact ? 'h-7 w-7' : 'h-8 w-8'
  const crownClass = compact ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div className={`flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 shrink-0 ${compact ? 'p-2' : 'p-2.5'}`}>
      <div className={`flex ${iconWrapClass} shrink-0 items-center justify-center rounded-lg bg-white/[0.06]`}>
        <Crown className={`${crownClass} text-luxuryGold`} strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 truncate">
        {subscriptionCopy.planLabel ? (
          <>
            <span className={planNameClass}>{subscriptionCopy.planLabel}</span>
            {subscriptionCopy.detailLabel ? (
              <span className={detailClass}>{` · ${subscriptionCopy.detailLabel}`}</span>
            ) : null}
          </>
        ) : (
          <span className={`${detailClass} font-semibold text-rose-400`}>
            {t('dashboard.sidebar.no_plan')}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onManagePlan}
        className={buttonClass}
        title={t('dashboard.sidebar.manage_plan')}
      >
        {t('dashboard.sidebar.manage_plan_short')}
      </button>
    </div>
  )
}
