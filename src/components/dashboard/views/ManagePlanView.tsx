// ManagePlanView — pricing / plan selection page for the dashboard "subscriptions"
// route. Name/Price/Features come from GET /merchant/subscriptions/packages;
// falls back to the i18n copy below while that request is loading (or for the
// fields the API leaves null, e.g. Lite's $0 and Enterprise's custom quote).
// CTAs delegate to the optional onSelectPlan callback. Highlights the merchant's
// current TipPlatform plan from GET /userprofile/me → business.subscriptions.
import { Check } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import type { SubscriptionPackage } from '../../../data/repositories/subscriptionPayments'
import type { UserSubscription } from '../../../types/domain'
import {
  getSubscriptionPlanRenewLabel,
  isTipPlatformPlanCurrent,
} from '../../../utils/subscriptionDisplay'

type PlanId = 'lite' | 'starter' | 'pro' | 'enterprise'

interface ManagePlanViewProps {
  /** Active TipPlatform subscription from /userprofile/me. */
  currentSubscription?: UserSubscription | null
  /** Invoked with the chosen plan id when a CTA is pressed. */
  onSelectPlan?: (planId: PlanId) => void
  /** Packages from the API — undefined while loading. */
  packages?: SubscriptionPackage[]
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
  // { id: 'lite', free: true, featureCount: 4 }, // Hidden free plan
  { id: 'starter', featureCount: 4 },
  { id: 'pro', featured: true, featureCount: 5 },
  { id: 'enterprise', featureCount: 4 },
]

function ManagePlanView({
  currentSubscription = null,
  onSelectPlan,
  packages,
}: ManagePlanViewProps) {
  const { t, currentLanguage } = useTranslation()
  const isVietnamese = currentLanguage === 'vi'
  const renewLabel = getSubscriptionPlanRenewLabel(
    currentSubscription,
    t,
    currentLanguage,
  )

  return (
    <div className="relative">
      {/* Atmospheric backdrop — soft brand glow behind the featured column */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-96 max-w-4xl rounded-full bg-gradient-to-r from-nexoraElectric/20 via-nexoraViolet/20 to-brandCyan/15 blur-[100px]"
      />

      {/* Header */}
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

      {/* Plan grid */}
      <div className="relative mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 px-1 pb-4 md:grid-cols-3 md:items-stretch">
        {PLAN_CONFIG.map((plan) => {
          const base = `manage_plan.plans.${plan.id}`
          const pkg = packages?.find(
            (p) => (p.plan ?? '').toLowerCase() === plan.id,
          )
          const pkgFeatures = isVietnamese ? pkg?.featuresVi : pkg?.featuresEn
          const features = pkgFeatures?.length
            ? pkgFeatures
            : Array.from({ length: plan.featureCount }, (_, i) => t(`${base}.f${i + 1}`))
          const priceLabel = pkg?.price != null ? `$${pkg.price}` : t(`${base}.price`)
          const priceNote =
            pkg && pkg.periodInMonths !== 1
              ? t('manage_plan.price_note_months', { count: pkg.periodInMonths })
              : t(`${base}.price_note`)
          const isCurrent = isTipPlatformPlanCurrent(currentSubscription, plan.id)

          return (
            <article
              key={plan.id}
              className={[
                'group relative flex flex-col rounded-2xl p-6 transition-all duration-300',
                isCurrent
                  ? 'border-2 border-nexoraSuccess bg-gradient-to-b from-nexoraSuccess/[0.08] via-nexoraSurface to-nexoraSurface shadow-[0_12px_32px_rgba(22,163,74,0.14)] ring-1 ring-nexoraSuccess/25'
                  : plan.featured
                    ? 'border-2 border-nexoraViolet bg-nexoraSurface shadow-premium hover:-translate-y-2 hover:shadow-2xl hover:shadow-nexoraViolet/20 xl:-translate-y-4 xl:hover:-translate-y-6 xl:pb-8'
                    : 'border border-nexoraBorder bg-nexoraSurfaceMuted hover:-translate-y-1 hover:border-nexoraLavender hover:shadow-nexora-soft',
              ].join(' ')}
            >
              {/* Ribbon — Active plan wins over featured recommend badge */}
              {isCurrent ? (
                <span className="absolute left-1/2 top-0 max-w-[80%] -translate-x-1/2 -translate-y-1/2 cursor-default rounded-full border border-nexoraSuccess/30 bg-nexoraSuccess px-4 py-1.5 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wider text-white shadow-sm">
                  {t('manage_plan.current_plan')}
                </span>
              ) : plan.featured ? (
                <span className="plan-recommend-badge absolute left-1/2 top-0 max-w-[80%] cursor-default rounded-full bg-gradient-to-r from-nexoraElectric to-nexoraViolet px-4 py-1.5 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wider text-white">
                  {t(`${base}.badge`)}
                </span>
              ) : null}

              <h2 className="text-lg font-extrabold leading-snug text-nexoraText">
                {pkg?.name || t(`${base}.name`)}
              </h2>
              <p className="mt-1.5 min-h-[40px] text-[13px] leading-relaxed text-nexoraMuted">
                {t(`${base}.tagline`)}
              </p>

              {/* Price */}
              <div className="mt-5 flex items-end gap-1.5">
                <span className="text-4xl font-black tracking-tight text-nexoraText tabular-nums">
                  {priceLabel}
                </span>
                <span className="pb-1.5 text-xs font-medium text-nexoraSubtle">
                  {priceNote}
                </span>
              </div>

              <div className="my-5 h-px w-full bg-nexoraRule" />

              {/* Features */}
              <ul className="flex-1 space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-nexoraSuccess/12 text-nexoraSuccess">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-[13px] leading-relaxed text-nexoraText/85">{feature}</span>
                  </li>
                ))}
              </ul>

              {/*
                CTA footer: renew sits ABOVE the button in a reserved slot so every
                plan card keeps its primary button on the same baseline row.
              */}
              <div className="mt-auto flex flex-col pt-6">
                <div className="mb-2 flex min-h-[2.75rem] flex-col justify-end">
                  {isCurrent && renewLabel ? (
                    <span className="text-center text-[11px] font-semibold leading-snug tracking-wide text-nexoraSuccess/90">
                      {renewLabel}
                    </span>
                  ) : null}
                </div>
                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-nexoraSuccess bg-nexoraSuccess text-sm font-bold text-white shadow-nexora-soft"
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                    {t('manage_plan.current_active_plan')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectPlan?.(plan.id)}
                    className={[
                      'h-11 w-full rounded-xl text-sm font-bold transition-all active:scale-[0.98]',
                      plan.featured
                        ? 'bg-gradient-to-r from-nexoraElectric to-nexoraViolet text-white shadow-lg shadow-nexoraViolet/25 hover:brightness-110'
                        : plan.id === 'enterprise'
                          ? 'bg-nexoraSidebar text-white hover:bg-nexoraSidebarPanel'
                          : 'border border-nexoraBorder bg-nexoraSurface text-nexoraText hover:border-nexoraBrand hover:text-nexoraBrand',
                    ].join(' ')}
                  >
                    {plan.featured
                      ? t('manage_plan.upgrade_to_pro')
                      : plan.id === 'enterprise'
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
