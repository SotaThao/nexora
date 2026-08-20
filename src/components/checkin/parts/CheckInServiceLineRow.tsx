// One service line on the confirmation step, shared by the kiosk and the front desk.
//
// The technician control is a slot rather than a fixed <select>: the kiosk already holds every
// technician's skills in memory and filters locally, while the front desk asks per service
// (CheckinServiceTechnicianSelect). Same row, same avatar, same price — different source for the
// list of names.
import type { ReactNode } from 'react'

export default function CheckInServiceLineRow({
  serviceName,
  price,
  durationMinutes,
  technicianInitials,
  technicianSelect,
  trailing,
}: {
  serviceName: string
  price: number
  durationMinutes?: number | null
  // Null/undefined shows the "anyone" bolt, matching the picker's Anyone card.
  technicianInitials?: string | null
  technicianSelect: ReactNode
  // Front desk only: the per-line delete button.
  trailing?: ReactNode
}) {
  return (
    // Wraps rather than squeezing: on a phone the fixed-width technician control would otherwise
    // crush the service name down to "Cl…", so below that width it drops to its own line instead.
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-nexoraBorder p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nexoraCanvas text-xs font-bold text-nexoraText">
          {technicianInitials || '⚡'}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-nexoraText">{serviceName}</p>
          <p className="truncate text-xs text-nexoraMuted">
            ${price.toFixed(2)}
            {durationMinutes ? ` · ${durationMinutes} min` : ''}
          </p>
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {technicianSelect}
        {trailing}
      </div>
    </div>
  )
}
