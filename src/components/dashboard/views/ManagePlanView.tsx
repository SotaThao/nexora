// ManagePlanView — pricing / plan selection page for the dashboard "subscriptions"
// route. Static marketing-style tiers (no billing backend yet); CTAs delegate to
// the optional onSelectPlan callback. Highlights the merchant's current plan when
// a matching plan id is supplied.
import { Check } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

type PlanId = 'lite' | 'starter' | 'pro' | 'enterprise'

interface ManagePlanViewProps {
  /** Lowercased identifier of the active plan, used to mark "current plan". */
  currentPlanId?: string | null
  /** Invoked with the chosen plan id when a CTA is pressed. */
  onSelectPlan?: (planId: PlanId) => void
}

interface PlanConfig {
  id: PlanId
  /** Elevated, violet-framed tier with a ribbon badge (Pro). */
  featured?: boolean
  /** Green free-tier treatment: inline FREE pill, green CTA, green first feature. */
  free?: boolean
  /** number of feature lines to read from i18n (f1..fN) */
  featureCount: number
}

const PLAN_CONFIG: PlanConfig[] = [
  { id: 'lite', free: true, featureCount: 4 },
  { id: 'starter', featureCount: 4 },
  { id: 'pro', featured: true, featureCount: 5 },
  { id: 'enterprise', featureCount: 4 },
]

function ManagePlanView({ currentPlanId = null, onSelectPlan }: ManagePlanViewProps) {
  const { t } = useTranslation()

  const normalizedCurrent = (currentPlanId || '').toLowerCase()

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
      <div className="relative mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-5 px-1 pb-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
        {PLAN_CONFIG.map((plan) => {
          const base = `manage_plan.plans.${plan.id}`
          const features = Array.from({ length: plan.featureCount }, (_, i) =>
            t(`${base}.f${i + 1}`),
          )
          const isCurrent =
            !!normalizedCurrent && normalizedCurrent.includes(plan.id)

          return (
            <article
              key={plan.id}
              className={[
                'group relative flex flex-col rounded-2xl p-6 transition-all duration-300',
                plan.featured
                  ? 'border-2 border-nexoraViolet bg-nexoraSurface shadow-premium hover:-translate-y-2 hover:shadow-2xl hover:shadow-nexoraViolet/20 xl:-translate-y-4 xl:hover:-translate-y-6 xl:pb-8'
                  : 'border border-nexoraBorder bg-nexoraSurfaceMuted hover:-translate-y-1 hover:border-nexoraLavender hover:shadow-nexora-soft',
              ].join(' ')}
            >
              {/* Ribbon badge straddling the top edge (featured tier only) */}
              {plan.featured && (
                <span className="plan-recommend-badge absolute left-1/2 top-0 max-w-[80%] cursor-default rounded-full bg-gradient-to-r from-nexoraElectric to-nexoraViolet px-4 py-1.5 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wider text-white">
                  {t(`${base}.badge`)}
                </span>
              )}

              {/* Name + inline free pill */}
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold leading-snug text-nexoraText">
                  {t(`${base}.name`)}
                </h2>
                {plan.free && (
                  <span className="inline-flex shrink-0 items-center rounded-md bg-nexoraSuccess/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-nexoraSuccess">
                    {t(`${base}.badge`)}
                  </span>
                )}
              </div>
              <p className="mt-1.5 min-h-[40px] text-[13px] leading-relaxed text-nexoraMuted">
                {t(`${base}.tagline`)}
              </p>

              {/* Price */}
              <div className="mt-5 flex items-end gap-1.5">
                <span className="text-4xl font-black tracking-tight text-nexoraText tabular-nums">
                  {t(`${base}.price`)}
                </span>
                <span className="pb-1.5 text-xs font-medium text-nexoraSubtle">
                  {t(`${base}.price_note`)}
                </span>
              </div>

              <div className="my-5 h-px w-full bg-nexoraRule" />

              {/* Features */}
              <ul className="flex-1 space-y-3">
                {features.map((feature, i) => {
                  const highlight = plan.free && i === 0
                  return (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-nexoraSuccess/12 text-nexoraSuccess">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span
                        className={[
                          'text-[13px] leading-relaxed',
                          highlight
                            ? 'font-semibold text-nexoraSuccess'
                            : 'text-nexoraText/85',
                        ].join(' ')}
                      >
                        {feature}
                      </span>
                    </li>
                  )
                })}
              </ul>

              {/* CTA */}
              <div className="mt-6">
                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-nexoraBorder bg-nexoraSurface text-sm font-bold text-nexoraMuted"
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                    {t('manage_plan.current_plan')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectPlan?.(plan.id)}
                    className={[
                      'h-11 w-full rounded-xl text-sm font-bold transition-all active:scale-[0.98]',
                      plan.featured
                        ? 'bg-gradient-to-r from-nexoraElectric to-nexoraViolet text-white shadow-lg shadow-nexoraViolet/25 hover:brightness-110'
                        : plan.free
                          ? 'bg-nexoraSuccess text-white shadow-lg shadow-nexoraSuccess/25 hover:brightness-110'
                          : plan.id === 'enterprise'
                            ? 'bg-nexoraSidebar text-white hover:bg-nexoraSidebarPanel'
                            : 'border border-nexoraBorder bg-nexoraSurface text-nexoraText hover:border-nexoraBrand hover:text-nexoraBrand',
                    ].join(' ')}
                  >
                    {t(`${base}.cta`)}
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
