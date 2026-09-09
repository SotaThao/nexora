// The "who would you like?" grid, shared by the kiosk and the front desk.
//
// Both screens ask the same question of the same people. The kiosk keeps the visual avatar cards;
// the front desk can request compact text-only cards to keep the working surface short.
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { SkeletonList } from '../../ui/skeleton'

export interface TechnicianOption {
  posStaffProfileId: string
  displayName: string
  photoUrl?: string | null
  isBusy?: boolean
  turnsToday?: number
  isNextTurn?: boolean
  // Clocked out, and offered anyway because they are already working the ticket being edited.
  // Check-in surfaces never set this — opening a ticket still takes a technician on shift.
  isOffShift?: boolean
}

// Above this many people the grid becomes hard to scan, and a name is faster to type than to hunt.
const SEARCH_THRESHOLD = 6
const EMPTY_ROSTER_SKELETON_COUNT = 4

function initialsOf(displayName: string) {
  return displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function TechnicianPickerGrid({
  technicians,
  isLoading,
  selectedStaffId,
  onSelect,
  anyoneLabel,
  anyoneHint,
  searchPlaceholder,
  emptyLabel,
  busyLabel,
  availableLabel,
  offShiftLabel,
  turnsLabel,
  nextTurnLabel,
  compact = false,
  autoWrap = false,
}: {
  technicians: TechnicianOption[]
  isLoading?: boolean
  // null = no technician preference.
  selectedStaffId: string | null
  onSelect: (posStaffProfileId: string | null) => void
  anyoneLabel: string
  anyoneHint?: string
  searchPlaceholder: string
  emptyLabel: string
  // Omitted together by callers that have no busy information to show (the wizard's own step still
  // passes neither, so its cards stay exactly as they were).
  busyLabel?: string
  availableLabel?: string
  // Only passed where an off-shift technician can appear at all; without it they read as available.
  offShiftLabel?: string
  turnsLabel?: (count: number) => string
  nextTurnLabel?: string
  compact?: boolean
  // Check-in surfaces use content-width choices that wrap; other consumers keep the existing grid.
  autoWrap?: boolean
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return query === ''
      ? technicians
      : technicians.filter((s) => s.displayName.toLowerCase().includes(query))
  }, [technicians, searchQuery])

  const cardClass = (isSelected: boolean) =>
    `${autoWrap ? 'min-w-0 w-auto max-w-full flex-none ' : ''}${compact
      ? 'flex min-h-11 flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left'
      : 'flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center'} ${
      isSelected ? 'border-nexoraBrand bg-nexoraBrand/5' : 'border-nexoraBorder hover:border-nexoraBrand'
    }`

  const optionLabelClass = `${autoWrap ? 'max-w-full' : 'w-full'} truncate text-xs font-bold text-nexoraText`
  const fullRowClass = autoWrap ? 'w-full' : 'col-span-full'

  const renderBadge = (staff: TechnicianOption) => {
    if (staff.isOffShift && offShiftLabel) {
      return <span className="text-[10px] font-semibold text-amber-600">{offShiftLabel}</span>
    }
    if (!busyLabel || !availableLabel || staff.isBusy === undefined) return null
    return (
      <span className={`text-[10px] font-semibold ${staff.isBusy ? 'text-rose-600' : 'text-emerald-600'}`}>
        {staff.isBusy ? busyLabel : availableLabel}
      </span>
    )
  }

  return (
    <div className="space-y-3">
      {technicians.length > SEARCH_THRESHOLD ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-lg border border-nexoraBorder bg-white pl-9 pr-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand"
          />
        </div>
      ) : null}

      <div
        className={
          autoWrap ? 'flex flex-wrap items-stretch gap-2' : 'grid grid-cols-2 gap-2 sm:grid-cols-3'
        }
      >
        {/* Outside the loading branch: "Anyone" needs no data, so it is tappable immediately. */}
        <button type="button" onClick={() => onSelect(null)} className={cardClass(selectedStaffId === null)}>
          {!compact ? (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-nexoraCanvas text-base">⚡</span>
          ) : null}
          <span className={optionLabelClass}>{anyoneLabel}</span>
          {anyoneHint ? (
            <span className="max-w-full truncate text-[10px] text-nexoraMuted">{anyoneHint}</span>
          ) : null}
        </button>

        {isLoading && technicians.length === 0 ? (
          <div className={fullRowClass}>
            <SkeletonList count={EMPTY_ROSTER_SKELETON_COUNT} lines={1} />
          </div>
        ) : (
          <>
            {filtered.map((staff) => (
              <button
                key={staff.posStaffProfileId}
                type="button"
                onClick={() => onSelect(staff.posStaffProfileId)}
                className={cardClass(selectedStaffId === staff.posStaffProfileId)}
              >
                {!compact ? (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-nexoraCanvas text-xs font-bold text-nexoraText">
                    {staff.photoUrl ? (
                      <img src={staff.photoUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      initialsOf(staff.displayName)
                    )}
                  </span>
                ) : null}
                <span className={optionLabelClass}>{staff.displayName}</span>
                {staff.turnsToday !== undefined && turnsLabel ? (
                  <span className="text-[10px] font-semibold tabular-nums text-nexoraMuted">
                    {turnsLabel(staff.turnsToday)}
                  </span>
                ) : null}
                {staff.isNextTurn && nextTurnLabel ? (
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-extrabold text-violet-700">
                    {nextTurnLabel}
                  </span>
                ) : null}
                {renderBadge(staff)}
              </button>
            ))}

            {filtered.length === 0 ? (
              <p className={`${fullRowClass} text-xs text-nexoraMuted`}>{emptyLabel}</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
