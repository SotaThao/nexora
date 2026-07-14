// MobileKpiCard — themed KPI tile for mobile home surfaces (staff + merchant).
import { ChevronRight } from 'lucide-react'

export const MOBILE_KPI_THEMES = {
  green:  { card: 'bg-[#ecfdf5] shadow-[0_4px_14px_rgba(16,185,129,0.10)]',  icon: 'bg-[#34d399]',  trend: 'text-[#059669]' },
  purple: { card: 'bg-[#f5f3ff] shadow-[0_4px_14px_rgba(139,92,246,0.10)]',  icon: 'bg-[#8b5cf6]',  trend: 'text-[#7c3aed]' },
  amber:  { card: 'bg-[#fffbeb] shadow-[0_4px_14px_rgba(245,158,11,0.10)]',  icon: 'bg-[#fbbf24]',  trend: 'text-[#059669]' },
  blue:   { card: 'bg-[#eff6ff] shadow-[0_4px_14px_rgba(59,130,246,0.10)]',  icon: 'bg-[#60a5fa]',  trend: 'text-[#2563eb]' },
  indigo: { card: 'bg-[#eef2ff] shadow-[0_4px_14px_rgba(99,102,241,0.10)]',  icon: 'bg-[#818cf8]',  trend: 'text-[#4f46e5]' },
  pink:   { card: 'bg-[#fdf4ff] shadow-[0_4px_14px_rgba(232,121,249,0.10)]', icon: 'bg-[#e879f9]',  trend: 'text-[#a21caf]' },
}

export const MOBILE_KPI_LABEL_CLASS = 'text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#94a3b8]'
export const MOBILE_KPI_ICON_WRAP_CLASS = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white'
export const MOBILE_KPI_GRID_CLASS = 'grid grid-cols-2 gap-2.5'

export function MobileKpiIcon({ theme, children }) {
  const styles = MOBILE_KPI_THEMES[theme] || MOBILE_KPI_THEMES.green
  return <span className={`${MOBILE_KPI_ICON_WRAP_CLASS} ${styles.icon}`}>{children}</span>
}

export default function MobileKpiCard({
  theme,
  icon,
  label,
  value = null,
  trend = null,
  trendColor = undefined,
  onClick,
  className = '',
}) {
  const styles = MOBILE_KPI_THEMES[theme] || MOBILE_KPI_THEMES.green

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl p-4 text-left transition-transform duration-150 active:scale-[0.98] focus:outline-none ${styles.card} ${className}`}
    >
      <p className={`mb-2 ${MOBILE_KPI_LABEL_CLASS}`}>{label}</p>
      <div className="flex items-center gap-2.5">
        <MobileKpiIcon theme={theme}>{icon}</MobileKpiIcon>
        {value != null && (
          <div className="min-w-0 flex-1">
            <p className="text-[20px] font-black leading-none tracking-tight text-[#0f172a]">{value}</p>
            {trend ? (
              typeof trend === 'string' ? (
                <p className={`mt-1.5 text-[11px] font-bold leading-none ${trendColor || styles.trend}`}>{trend}</p>
              ) : (
                <div className="mt-1.5">{trend}</div>
              )
            ) : null}
          </div>
        )}
        <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[#cbd5e1]" strokeWidth={2.5} />
      </div>
    </button>
  )
}
