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

function completedServiceAmount(
  serviceAmountsByStaffId: ReadonlyMap<string, number>,
  staffId: string,
) {
  const amount = serviceAmountsByStaffId.get(staffId) ?? 0
  return Number.isFinite(amount) ? Math.max(0, amount) : 0
}

// Skill filtering happens at the caller because a Turn Board recommendation can require several
// services while a line-level picker requires only one. From that eligible set, both surfaces use
// this identical fairness rule: clocked in, then lowest gross value of services completed today.
// Turns and the fixed clock-in rank only break equal-dollar ties. Current workload does not
// override fairness — a busy technician with a lower service amount remains next in the rotation.
export function selectNextTurnTechnician<TRow extends NextTurnRosterRow>(
  rosterRows: readonly TRow[],
  eligibleStaffIds: ReadonlySet<string>,
  serviceAmountsByStaffId: ReadonlyMap<string, number>,
) {
  const eligibleRows = rosterRows
    .filter((row) => row.isClockedIn && eligibleStaffIds.has(row.posStaffProfileId))
    .slice()
    .sort((a, b) => {
      const amountDifference = completedServiceAmount(serviceAmountsByStaffId, a.posStaffProfileId)
        - completedServiceAmount(serviceAmountsByStaffId, b.posStaffProfileId)
      return amountDifference || compareNextTurnRows(a, b)
    })

  return eligibleRows[0]
}
