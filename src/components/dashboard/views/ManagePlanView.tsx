// ManagePlanView — pricing / plan selection page for the dashboard "subscriptions"
// route. Name/Price/Features come from GET /merchant/subscriptions/packages;
// falls back to the i18n copy below while that request is loading (or for the
// fields the API leaves null, e.g. Lite's $0 and Enterprise's custom quote).
// CTAs delegate to the optional onSelectPlan callback. Highlights the merchant's
// current TipPlatform plan from GET /userprofile/me → business.subscriptions.
import { Check, Lock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  SubscriptionBillingCycle,
  type SubscriptionPackage,
} from '../../../data/repositories/subscriptionPayments'
import type { UserSubscription } from '../../../types/domain'
import {
  getSubscriptionPlanRenewLabel,
  isTipPlatformPlanBelowCurrent,
  isTipPlatformPlanCurrent,
  resolveTipPlatformPlanId,
} from '../../../utils/subscriptionDisplay'
import { PACKAGE_MANAGEMENT_TK as PACKAGE_MGMT_TK, TipPlatformUiPlanId } from './packageManagement/constants'
import type { TipPlatformUiPlanIdValue } from './packageManagement/constants'

type PlanId = TipPlatformUiPlanIdValue
export type ManagePlanBillingCycle = 'monthly' | 'yearly'

interface ManagePlanViewProps {
  /** Active TipPlatform subscription from /userprofile/me. */
  currentSubscription?: UserSubscription | null
  /** Invoked with the chosen plan id + billing cycle when a CTA is pressed. */
  onSelectPlan?: (planId: PlanId, billingCycle: SubscriptionBillingCycle) => void
  /** Packages from the API — undefined while loading. */
  packages?: SubscriptionPackage[]
  /** Stretch plan cards to the content column (Package Management). */
  wide?: boolean
  /** Controlled toggle state — pass with `onBillingCycleChange` to share it with a sibling
   * (e.g. the Compare Plans table). Uncontrolled (own state, defaults to monthly) when omitted. */
  billingCycle?: ManagePlanBillingCycle
  onBillingCycleChange?: (cycle: ManagePlanBillingCycle) => void
}

interface PlanConfig {
  id: PlanId
  /** Elevated, violet-framed tier with a ribbon badge (Pro). */
  featured?: boolean
  /** number of feature lines to read from i18n (f1..fN) */
  featureCount: number
}

// Lite is the free, no-account-yet signup tier — not shown here since this view
// is only reached from the authenticated dashboard (merchant already has an
// account) and downgrading an existing paid plan to Lite isn't supported.
const PLAN_CONFIG: PlanConfig[] = [
  // { id: TipPlatformUiPlanId.Lite, free: true, featureCount: 4 }, // Hidden free plan
  { id: TipPlatformUiPlanId.Starter, featureCount: 4 },
  { id: TipPlatformUiPlanId.Pro, featured: true, featureCount: 5 },
  { id: TipPlatformUiPlanId.Enterprise, featureCount: 4 },
]

function ManagePlanView({
  currentSubscription = null,
  onSelectPlan,
  packages,
  wide = false,
  billingCycle: billingCycleProp,
  onBillingCycleChange,
}: ManagePlanViewProps) {
  const { t, currentLanguage } = useTranslation()
  const isVietnamese = currentLanguage === 'vi'
  const renewLabel = getSubscriptionPlanRenewLabel(
    currentSubscription,
    t,
    currentLanguage,
  )
  const currentPlanId = useMemo(
    () => resolveTipPlatformPlanId(currentSubscription),
    [currentSubscription],
  )

  const [localBillingCycle, setLocalBillingCycle] = useState<ManagePlanBillingCycle>('monthly')
  const billingCycle = billingCycleProp ?? localBillingCycle
  const setBillingCycle = onBillingCycleChange ?? setLocalBillingCycle
  const isYearly = billingCycle === 'yearly'
  const yearlyDiscountBadge = useMemo(() => {
    const percents = (packages ?? [])
      .filter((p) => p.yearlyPrice != null)
      .map((p) => Math.round(p.yearlyDiscountPercent ?? 0))
    if (percents.length === 0) return null
    const max = Math.max(...percents)
    if (max <= 0) return null
    const allEqual = percents.every((pct) => pct === percents[0])
    return { percent: max, isUpTo: !allEqual }
  }, [packages])

  return (
    <div className="relative w-full min-w-0">
      {wide ? (
        <div className="nexora-package-heading">
          <div>
            <span className="package-overview-kicker">
              {t(`${PACKAGE_MGMT_TK}.subscriptions.kicker`)}
            </span>
            <h2>{t(`${PACKAGE_MGMT_TK}.subscriptions.title`)}</h2>
            <p>{t(`${PACKAGE_MGMT_TK}.subscriptions.subtitle`)}</p>
          </div>
          <span className="nexora-package-note">
            {t(`${PACKAGE_MGMT_TK}.subscriptions.note`)}
          </span>
        </div>
      ) : null}

      {wide ? (
        <div className="mb-5 mt-1 flex items-center">
          <div
            role="tablist"
            aria-label={t('manage_plan.billing_cycle_label')}
            className="inline-flex rounded-lg border border-nexoraBorder bg-nexoraSurfaceMuted p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isYearly}
              tabIndex={!isYearly ? 0 : -1}
              onClick={() => setBillingCycle('monthly')}
              className={[
                'rounded-md px-4 py-1.5 text-xs font-bold transition-colors',
                !isYearly ? 'bg-nexoraSurface text-nexoraBrand shadow-sm' : 'text-nexoraMuted',
              ].join(' ')}
            >
              {t('manage_plan.billing_monthly')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isYearly}
              tabIndex={isYearly ? 0 : -1}
              onClick={() => setBillingCycle('yearly')}
              className={[
                'flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-bold transition-colors',
                isYearly ? 'bg-nexoraSurface text-nexoraBrand shadow-sm' : 'text-nexoraMuted',
              ].join(' ')}
            >
              {t('manage_plan.billing_yearly')}
              {yearlyDiscountBadge ? (
                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-600">
                  {yearlyDiscountBadge.isUpTo
                    ? t('manage_plan.yearly_discount_upto', { percent: yearlyDiscountBadge.percent })
                    : `-${yearlyDiscountBadge.percent}%`}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-96 max-w-4xl rounded-full bg-gradient-to-r from-nexoraElectric/20 via-nexoraViolet/20 to-brandCyan/15 blur-[100px]"
          />
          <header className="relative mx-auto max-w-2xl px-4 pt-2 text-center">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-nexoraBrand">
              {t('manage_plan.eyebrow')}
            </span>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-nexoraText sm:text-[2.5rem]">
              {t('manage_plan.title')}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-nexoraMuted">
              {t('manage_plan.subtitle')}
            </p>
          </header>
        </>
      )}

      {/* Plan grid */}
      <div
        className={[
          'relative mx-auto grid w-full grid-cols-1 gap-3 px-1 pb-4 sm:gap-5 md:grid-cols-3 md:items-stretch',
          wide ? 'mt-5 max-w-none' : 'mt-12 max-w-5xl',
        ].join(' ')}
      >
        {PLAN_CONFIG.map((plan) => {
          const base = `manage_plan.plans.${plan.id}`
          // `plan` isn't a real BE field — packageCode is the only reliable catalog match.
          const pkg = packages?.find(
            (p) => (p.packageCode ?? '').toLowerCase() === plan.id,
          )
          const pkgFeatures = isVietnamese ? pkg?.featuresVi : pkg?.featuresEn
          const features = pkgFeatures?.length
            ? pkgFeatures
            : Array.from({ length: plan.featureCount }, (_, i) => t(`${base}.f${i + 1}`))
          const yearlyAvailable = isYearly && pkg?.yearlyPrice != null
          const effectivePrice = yearlyAvailable ? pkg?.yearlyPrice : pkg?.price
          const priceLabel = effectivePrice != null ? `$${effectivePrice}` : t(`${base}.price`)
          const originalPrice = yearlyAvailable ? pkg?.yearlyOriginalPrice : undefined
          const showOriginalPrice =
            originalPrice != null && effectivePrice != null && originalPrice > effectivePrice
          const priceNote = yearlyAvailable
            ? t('manage_plan.price_note_year')
            : pkg && pkg.periodInMonths !== 1
              ? t('manage_plan.price_note_months', { count: pkg.periodInMonths })
              : t(`${base}.price_note`)
          const isCurrent = isTipPlatformPlanCurrent(currentSubscription, plan.id)
          const isLocked = isTipPlatformPlanBelowCurrent(plan.id, currentPlanId)
          const yearlyCheckoutDisabled =
            isYearly && !!pkg && pkg.yearlyPrice == null && plan.id !== TipPlatformUiPlanId.Enterprise

          return (
            <article
              key={plan.id}
              className={[
                'group relative flex flex-col rounded-2xl p-4 transition-all duration-300 sm:p-6',
                isCurrent
                  ? 'border-2 border-nexoraSuccess bg-gradient-to-b from-nexoraSuccess/[0.08] via-nexoraSurface to-nexoraSurface shadow-[0_12px_32px_rgba(22,163,74,0.14)] ring-1 ring-nexoraSuccess/25'
                  : isLocked
                    ? 'border border-nexoraBorder bg-nexoraSurfaceMuted'
                    : plan.featured
                      ? 'border-2 border-nexoraViolet bg-nexoraSurface shadow-premium hover:-translate-y-2 hover:shadow-2xl hover:shadow-nexoraViolet/20 xl:-translate-y-4 xl:hover:-translate-y-6 xl:pb-8'
                      : 'border border-nexoraBorder bg-nexoraSurfaceMuted hover:-translate-y-1 hover:border-nexoraLavender hover:shadow-nexora-soft',
              ].join(' ')}
            >
              {isCurrent ? (
                <span className="absolute left-1/2 top-0 max-w-[80%] -translate-x-1/2 -translate-y-1/2 cursor-default rounded-full border border-nexoraSuccess/30 bg-nexoraSuccess px-3 py-1 text-center text-[9px] font-extrabold uppercase leading-tight tracking-wider text-white shadow-sm sm:px-4 sm:py-1.5 sm:text-[10px]">
                  {t('manage_plan.current_plan')}
                </span>
              ) : !isLocked && plan.featured ? (
                <span className="plan-recommend-badge absolute left-1/2 top-0 max-w-[80%] cursor-default rounded-full bg-gradient-to-r from-nexoraElectric to-nexoraViolet px-3 py-1 text-center text-[9px] font-extrabold uppercase leading-tight tracking-wider text-white sm:px-4 sm:py-1.5 sm:text-[10px]">
                  {t(`${base}.badge`)}
                </span>
              ) : null}

              <h2 className="text-base font-extrabold leading-snug text-nexoraText sm:text-lg">
                {pkg?.name || t(`${base}.name`)}
              </h2>
              <p className="mt-1 min-h-0 text-xs leading-relaxed text-nexoraMuted sm:mt-1.5 sm:min-h-[40px] sm:text-[13px]">
                {t(`${base}.tagline`)}
              </p>

              {/* Price */}
              <div className="mt-3 flex flex-wrap items-end gap-1 sm:mt-5 sm:gap-1.5">
                <span className="text-2xl font-black tracking-tight text-nexoraText tabular-nums sm:text-3xl md:text-4xl">
                  {priceLabel}
                </span>
                <span className="pb-0.5 text-[10px] font-medium text-nexoraSubtle sm:pb-1.5 sm:text-xs">
                  {priceNote}
                </span>
              </div>
              {showOriginalPrice ? (
                <div className="mt-0.5 text-xs font-extrabold text-nexoraSubtle line-through">
                  ${originalPrice}
                </div>
              ) : null}

              <div className="my-3.5 h-px w-full bg-nexoraRule sm:my-5" />

              {/* Features */}
              <ul className="flex-1 space-y-2 sm:space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-2.5">
                    <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-nexoraSuccess/12 text-nexoraSuccess sm:h-4 sm:w-4">
                      <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={3} />
                    </span>
                    <span className="text-xs leading-relaxed text-nexoraText/85 sm:text-[13px]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/*
                CTA footer: renew sits ABOVE the button in a reserved slot so every
                plan card keeps its primary button on the same baseline row.
              */}
              <div className="mt-auto flex flex-col pt-4 sm:pt-6">
                <div className="mb-2 flex min-h-[2rem] flex-col justify-end sm:min-h-[2.75rem]">
                  {isCurrent && renewLabel ? (
                    <span className="text-center text-[10px] font-semibold leading-snug tracking-wide text-nexoraSuccess/90 sm:text-[11px]">
                      {renewLabel}
                    </span>
                  ) : null}
                </div>
                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-nexoraSuccess bg-nexoraSuccess text-[13px] font-bold text-white shadow-nexora-soft sm:h-11 sm:text-sm"
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                    {t('manage_plan.current_active_plan')}
                  </button>
                ) : isLocked ? (
                  <button
                    type="button"
                    disabled
                    aria-label={t('manage_plan.plan_locked')}
                    className="flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#d4cfe3] bg-[#f3f1f8] text-xs font-extrabold text-[#746f8c] opacity-100 shadow-none sm:h-11 sm:text-[13px]"
                  >
                    <Lock className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                    {t('manage_plan.plan_locked')}
                  </button>
                ) : yearlyCheckoutDisabled ? (
                  <button
                    type="button"
                    disabled
                    aria-label={t('manage_plan.yearly_coming_soon')}
                    className="flex h-10 w-full cursor-not-allowed items-center justify-center rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted text-xs font-extrabold text-nexoraMuted opacity-100 shadow-none sm:h-11 sm:text-[13px]"
                  >
                    {t('manage_plan.yearly_coming_soon')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      onSelectPlan?.(
                        plan.id,
                        isYearly ? SubscriptionBillingCycle.Yearly : SubscriptionBillingCycle.Monthly,
                      )
                    }
                    className={[
                      'h-10 w-full rounded-xl text-[13px] font-bold transition-all active:scale-[0.98] sm:h-11 sm:text-sm',
                      plan.featured
                        ? 'bg-gradient-to-r from-nexoraElectric to-nexoraViolet text-white shadow-lg shadow-nexoraViolet/25 hover:brightness-110'
                        : plan.id === TipPlatformUiPlanId.Enterprise
                          ? 'bg-nexoraSidebar text-white hover:bg-nexoraSidebarPanel'
                          : 'border border-nexoraBorder bg-nexoraSurface text-nexoraText hover:border-nexoraBrand hover:text-nexoraBrand',
                    ].join(' ')}
                  >
                    {plan.featured
                      ? t('manage_plan.upgrade_to_pro')
                      : plan.id === TipPlatformUiPlanId.Enterprise
                        ? t('manage_plan.plans.enterprise.cta')
                        : t(`${base}.cta`)}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default ManagePlanView
