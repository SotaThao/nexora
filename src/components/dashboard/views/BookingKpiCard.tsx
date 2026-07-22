import React from 'react'
import type { CSSProperties, ReactNode } from 'react'

type BookingKpiCardProps = {
  accentStyle: CSSProperties
  icon: ReactNode
  badge: string
  badgeClass: string
  label: string
  value: ReactNode
  trend: string
}

/** Compact overview KPI card — layout matches booking-book-phase-1.html. */
export default function BookingKpiCard({
  accentStyle,
  icon,
  badge,
  badgeClass,
  label,
  value,
  trend,
}: BookingKpiCardProps) {
  return (
    <article className="overview-card kpi-card" style={accentStyle}>
      <div className="kpi-top">
        <div className="kpi-icon">{icon}</div>
        <span className={`badge booking-status ${badgeClass}`}>{badge}</span>
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-trend">{trend}</div>
    </article>
  )
}
