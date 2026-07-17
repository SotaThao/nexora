import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'
import { RadialBar, RadialBarChart, PolarAngleAxis } from 'recharts'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useTaxiqReadinessScore } from '../../../../../data/hooks/useTaxiqReadinessScore'
import { Skeleton } from '../../../../ui/skeleton'
import Tooltip from '../../../../ui/Tooltip'
import type { ReadinessPriorityItem, TaxReadinessScope } from '../../../../../data/repositories/taxiqReadinessScore'
import type { TFunction } from '../../../../../types/contexts'

// Hex mirrors of the nexora* Tailwind tokens — Recharts fills need literal colors, not class names.
const RING_TRACK_COLOR = '#DDE5EF' // nexoraBorder
const RING_COLOR_GOOD = '#10b981' // emerald-500
const RING_COLOR_WARN = '#f59e0b' // amber-500
const RING_COLOR_BAD = '#f43f5e' // rose-500

/**
 * High Priority item `type` -> destination route. No formal BE-provided mapping
 * exists yet; derived from each destination ticket's own route header
 * (US-07/US-08/US-09/US-13). Shared with US-06 Year-End Export Center so both
 * places navigate to the same screen for a given type.
 */
export const READINESS_ITEM_ROUTES: Record<string, string> = {
  MissingW9: '/dashboard/taxiq/payroll',
  PayoutDispute: '/dashboard/taxiq/payroll',
  PayoutCpaReview: '/dashboard/taxiq/payroll',
  GiftCardLiability: '/dashboard/taxiq/equipment',
  MembershipCredit: '/dashboard/taxiq/equipment',
  OverdueTax: '/dashboard/taxiq/reminders',
  SelfReportedMissingReceipt: '/staff/taxiq/income',
  SelfReportedCpaReview: '/staff/taxiq/income',
  BoothRenterNoIncome: '/staff/taxiq/income',
  Contractor1099NoIncome: '/staff/taxiq/income',
  MissingBusinessEntityType: '/dashboard/taxiq',
}

/**
 * High Priority item `type` -> which tab to preselect at the destination route, for
 * destinations with more than one tab. Read by PayoutDisputeCenterView via router state
 * (`{ state: { taxiqTab } }`) — see navigateToReadinessItem below.
 */
export const READINESS_ITEM_TAB_HINTS: Record<string, string> = {
  MissingW9: 'staffTaxProfile',
}

export function navigateToReadinessItem(navigate: (path: string, options?: { state?: unknown }) => void, type: string) {
  const route = READINESS_ITEM_ROUTES[type]
  if (!route) return
  const tab = READINESS_ITEM_TAB_HINTS[type]
  navigate(route, tab ? { state: { taxiqTab: tab } } : undefined)
}

/**
 * High Priority item `type` -> i18n key. The BE only sends an English `description`
 * (plus `descriptionParams` for interpolation) — it does not localize, so the FE
 * always renders through this map and falls back to the raw description if a type
 * isn't recognized yet.
 */
const READINESS_ITEM_I18N_KEYS: Record<string, string> = {
  MissingW9: 'taxiq.readinessItems.missingW9',
  PayoutDispute: 'taxiq.readinessItems.payoutDispute',
  PayoutCpaReview: 'taxiq.readinessItems.payoutCpaReview',
  GiftCardLiability: 'taxiq.readinessItems.giftCardLiability',
  MembershipCredit: 'taxiq.readinessItems.membershipCredit',
  OverdueTax: 'taxiq.readinessItems.overdueTax',
  SelfReportedMissingReceipt: 'taxiq.readinessItems.selfReportedMissingReceipt',
  SelfReportedCpaReview: 'taxiq.readinessItems.selfReportedCpaReview',
  BoothRenterNoIncome: 'taxiq.readinessItems.boothRenterNoIncome',
  Contractor1099NoIncome: 'taxiq.readinessItems.contractor1099NoIncome',
  MissingBusinessEntityType: 'taxiq.readinessItems.missingBusinessEntityType',
}

export function getReadinessItemLabel(item: ReadinessPriorityItem, t: TFunction): string {
  const key = READINESS_ITEM_I18N_KEYS[item.type]
  return key ? t(key, item.descriptionParams) : item.description
}

function ScoreRing({ value, label, tooltip }: { value: number; label: string; tooltip?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  const ringColor = clamped >= 80 ? RING_COLOR_GOOD : clamped >= 50 ? RING_COLOR_WARN : RING_COLOR_BAD
  const chartData = [{ value: clamped, fill: ringColor }]

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[88px] w-[88px]">
        <RadialBarChart
          width={88}
          height={88}
          cx="50%"
          cy="50%"
          innerRadius="72%"
          outerRadius="100%"
          barSize={8}
          data={chartData}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar
            dataKey="value"
            background={{ fill: RING_TRACK_COLOR }}
            cornerRadius={999}
            isAnimationActive
          />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-nexoraText">
          {clamped}%
        </div>
      </div>
      <div className="max-w-[92px] text-center text-[11px] font-semibold text-nexoraMuted">
        <span className="inline-flex items-center gap-1">
          {label}
          {tooltip && <Tooltip content={tooltip} />}
        </span>
      </div>
    </div>
  )
}

function WidgetSkeleton() {
  return (
    <div className="nexora-card p-6">
      <Skeleton width={160} height={16} borderRadius={6} />
      <div className="mt-5 flex justify-center gap-10">
        <Skeleton circle width={72} height={72} />
        <Skeleton circle width={72} height={72} />
      </div>
    </div>
  )
}

export default function TaxReadinessScoreWidget({
  scope,
  taxYearId,
}: {
  scope: TaxReadinessScope
  taxYearId: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useTaxiqReadinessScore(scope, taxYearId)

  if (isLoading) {
    return <WidgetSkeleton />
  }

  if (isError || !data) {
    return (
      <div className="nexora-card p-6 text-xs font-semibold text-nexoraMuted">
        {t('taxiq.readinessScore.errorLoading')}
      </div>
    )
  }

  const primaryScore = scope === 'owner' ? data.ownerCpaScore : data.staffTaxScore
  const primaryLabel = t(
    scope === 'owner' ? 'taxiq.readinessScore.ownerCpaLabel' : 'taxiq.readinessScore.staffTaxLabel',
  )
  const primaryTooltip = t(
    scope === 'owner' ? 'taxiq.readinessScore.tooltips.ownerCpa' : 'taxiq.readinessScore.tooltips.staffTax',
  )

  return (
    <div className="nexora-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold text-nexoraText">
          <span className="inline-flex items-center gap-1">
            {t('taxiq.readinessScore.title')}
            <Tooltip content={t('taxiq.readinessScore.tooltips.title')} />
          </span>
        </h2>
        {data.highPriorityCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-100/50 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertTriangle className="h-3 w-3" />
            {t('taxiq.readinessScore.highPriorityCount', { count: data.highPriorityCount })}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100/50 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            {t('taxiq.readinessScore.allClear')}
          </span>
        )}
      </div>

      <div className="mt-5 flex justify-center gap-10">
        <ScoreRing value={primaryScore} label={primaryLabel} tooltip={primaryTooltip} />
        <ScoreRing
          value={data.cpaReviewScore}
          label={t('taxiq.readinessScore.cpaReviewLabel')}
          tooltip={t('taxiq.readinessScore.tooltips.cpaReview')}
        />
      </div>

      {data.highPriorityItems.length > 0 && (
        <ul className="mt-5 space-y-2">
          {data.highPriorityItems.map((item, index) => {
            const route = READINESS_ITEM_ROUTES[item.type]
            return (
              <li key={`${item.type}-${index}`}>
                <button
                  type="button"
                  disabled={!route}
                  onClick={() => navigateToReadinessItem(navigate, item.type)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-nexoraBorder px-3 py-2 text-left text-xs font-semibold text-nexoraText enabled:hover:bg-nexoraBrandSoft disabled:cursor-default disabled:opacity-70"
                >
                  <span>{getReadinessItemLabel(item, t)}</span>
                  {route && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-nexoraMuted" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
