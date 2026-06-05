// KpiCard — clickable KPI tile with animated count-up value. Shared UI atom.
import { useTranslation } from '../../contexts/LanguageContext'
import { useCountUp } from '../dashboard/utils'

export default function KpiCard({ label, value, delta, active = false, onClick }) {
  const animatedValue = useCountUp(value)
  const { t } = useTranslation()

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
      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
        <span>▲ {delta}</span>
        <span className="text-nexoraSubtle/80 font-semibold uppercase tracking-wider text-[10px]">
          {t('dashboard.kpi.vs_last_week') || 'vs last week'}
        </span>
      </div>
    </button>
  )
}
