// KpiCard — clickable KPI tile with animated count-up value. Shared UI atom.
import { useTranslation } from '../../contexts/LanguageContext'
import { useCountUp } from '../dashboard/utils'

const NO_DELTA_FALLBACK = {
  NO_COMPARISON: 'no_comparison',
  ZERO_VS_LAST_WEEK: 'zero_vs_last_week',
  PERIOD_NOTE: 'period_note',
  WEEKLY_COUNT: 'weekly_count',
}

function KpiCardFooter({
  deltaPercent,
  noDeltaFallback = NO_DELTA_FALLBACK.NO_COMPARISON,
  weeklyCount = null,
}) {
  const { t } = useTranslation()
  const hasDelta = deltaPercent != null && !Number.isNaN(deltaPercent)
  const isPositive = hasDelta ? deltaPercent >= 0 : true
  const subtleLabelClass =
    'text-nexoraSubtle/80 font-semibold uppercase tracking-wider text-[10px]'

  if (hasDelta) {
    return (
      <>
        <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
          {isPositive ? '▲' : '▼'} {Math.abs(deltaPercent).toFixed(1)}%
        </span>
        <span className={subtleLabelClass}>{t('dashboard.kpi.vs_last_week')}</span>
      </>
    )
  }

  if (noDeltaFallback === NO_DELTA_FALLBACK.ZERO_VS_LAST_WEEK) {
    return (
      <>
        <span className="text-emerald-600">↗ 0%</span>
        <span className={subtleLabelClass}>{t('dashboard.kpi.vs_last_week')}</span>
      </>
    )
  }

  if (noDeltaFallback === NO_DELTA_FALLBACK.PERIOD_NOTE) {
    return (
      <span className="text-[10px] font-semibold tracking-wide text-nexoraSubtle/80">
        {t('dashboard.kpi.based_on_period')}
      </span>
    )
  }

  if (noDeltaFallback === NO_DELTA_FALLBACK.WEEKLY_COUNT && weeklyCount != null) {
    const hasWeeklyData = weeklyCount > 0
    return (
      <>
        <span className={hasWeeklyData ? 'text-emerald-600' : 'text-nexoraSubtle/80'}>
          ↗ {hasWeeklyData ? `+${weeklyCount}` : weeklyCount}
        </span>
        <span className={subtleLabelClass}>{t('dashboard.kpi.this_week')}</span>
      </>
    )
  }

  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider text-nexoraSubtle/80">
      {t('dashboard.kpi.no_comparison')}
    </span>
  )
}

export default function KpiCard({
  label,
  value,
  deltaPercent = null,
  active = false,
  onClick,
  noDeltaFallback = NO_DELTA_FALLBACK.NO_COMPARISON,
  weeklyCount = null,
}) {
  const animatedValue = useCountUp(value)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`nexora-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-premium flex flex-col justify-between min-h-[140px] focus:outline-none ${
        active
          ? 'border-nexoraBrand ring-1 ring-nexoraBrand bg-nexoraSurface'
          : 'border-nexoraBorder bg-nexoraSurface'
      }`}
    >
      <div>
        <div className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
          {label}
        </div>
        <div className="mt-2 text-2xl font-black text-nexoraText tracking-tight">
          {animatedValue}
        </div>
      </div>
      <div className="mt-4 flex min-h-5 items-center gap-1.5 text-xs font-bold">
        <KpiCardFooter
          deltaPercent={deltaPercent}
          noDeltaFallback={noDeltaFallback}
          weeklyCount={weeklyCount}
        />
      </div>
    </button>
  )
}

export { NO_DELTA_FALLBACK }
