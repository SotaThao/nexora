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
  const headerClass = compact
    ? 'text-[10px] font-semibold text-white/50'
    : 'text-[11px] font-semibold text-white/50'
  const planNameClass = compact
    ? 'mt-0.5 text-sm font-bold text-white'
    : 'mt-0.5 text-base font-bold text-white'
  const detailClass = compact
    ? 'mt-0.5 text-[10px] text-white/55'
    : 'mt-0.5 text-xs text-white/55'
  const buttonClass = compact
    ? 'mt-3 w-full rounded-xl border border-white/20 py-2 text-center text-xs font-bold text-white transition hover:bg-white/5 hover:border-white/30'
    : 'mt-4 w-full rounded-xl border border-white/20 py-2.5 text-center text-sm font-bold text-white transition hover:bg-white/5 hover:border-white/30'
  const iconWrapClass = compact ? 'h-9 w-9' : 'h-10 w-10'
  const crownClass = compact ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <div className={`rounded-xl border border-white/15 bg-white/5 shrink-0 ${compact ? 'p-3.5' : 'p-4'}`}>
      <div className="flex gap-3">
        <div className={`flex ${iconWrapClass} shrink-0 items-center justify-center rounded-xl bg-white/[0.06]`}>
          <Crown className={`${crownClass} text-luxuryGold`} strokeWidth={2} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className={headerClass}>{t('dashboard.sidebar.current_plan_header')}</div>
          {subscriptionCopy.planLabel ? (
            <>
              <div className={planNameClass}>{subscriptionCopy.planLabel}</div>
              {subscriptionCopy.detailLabel ? (
                <div className={detailClass}>{subscriptionCopy.detailLabel}</div>
              ) : null}
            </>
          ) : (
            <div className={`${detailClass} font-semibold text-rose-400`}>
              {t('dashboard.sidebar.no_plan')}
            </div>
          )}
        </div>
      </div>
      <button type="button" onClick={onManagePlan} className={buttonClass}>
        {t('dashboard.sidebar.manage_plan')}
      </button>
    </div>
  )
}
