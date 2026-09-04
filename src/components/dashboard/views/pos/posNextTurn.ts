import type { TimeClockRosterRowApiDto } from '../../../../types/repositories'

type NextTurnRosterRow = Pick<
  TimeClockRosterRowApiDto,
  'posStaffProfileId' | 'displayName' | 'isClockedIn' | 'turnRank' | 'turnsToday'
>

export function compareNextTurnRows(a: NextTurnRosterRow, b: NextTurnRosterRow) {
  const turnsDifference = (a.turnsToday ?? 0) - (b.turnsToday ?? 0)
  if (turnsDifference !== 0) return turnsDifference
  if (a.turnRank == null && b.turnRank == null) return a.displayName.localeCompare(b.displayName)
  if (a.turnRank == null) return 1
  if (b.turnRank == null) return -1
  return a.turnRank - b.turnRank
}

// Skill filtering happens at the caller because a Turn Board recommendation can require several
// services while a line-level picker requires only one. From that eligible set, both surfaces use
// this identical fairness rule: clocked in, then fewest turns for the whole day. Current workload
// does not override fairness — a busy technician with fewer turns remains next in the rotation.
export function selectNextTurnTechnician<TRow extends NextTurnRosterRow>(
  rosterRows: readonly TRow[],
  eligibleStaffIds: ReadonlySet<string>,
) {
  const eligibleRows = rosterRows
    .filter((row) => row.isClockedIn && eligibleStaffIds.has(row.posStaffProfileId))
    .slice()
    .sort(compareNextTurnRows)

  return eligibleRows[0]
}
