import type { TimeClockRosterRowApiDto } from '../../../../types/repositories'
import type { NextTurnBalance } from '../../../../data/repositories/posNextTurn'
import { parseApiUtcDateTime } from '../../../../utils/localDate'

type NextTurnRosterRow = Pick<
  TimeClockRosterRowApiDto,
  'posStaffProfileId' | 'displayName' | 'isClockedIn' | 'turnRank' | 'turnsToday' | 'clockInAt'
>

export function compareNextTurnRows(a: NextTurnRosterRow, b: NextTurnRosterRow) {
  const turnsDifference = (a.turnsToday ?? 0) - (b.turnsToday ?? 0)
  if (turnsDifference !== 0) return turnsDifference
  if (a.turnRank == null && b.turnRank == null) return a.displayName.localeCompare(b.displayName)
  if (a.turnRank == null) return 1
  if (b.turnRank == null) return -1
  return a.turnRank - b.turnRank
}

function serviceAmount(
  serviceAmountsByStaffId: ReadonlyMap<string, number>,
  staffId: string,
) {
  const amount = serviceAmountsByStaffId.get(staffId) ?? 0
  return Number.isFinite(amount) ? Math.max(0, amount) : 0
}

export function nextTurnServiceAmount(
  staffId: string,
  paidAmounts: ReadonlyMap<string, number>,
  committedAmounts?: ReadonlyMap<string, number>,
) {
  return Math.round((serviceAmount(paidAmounts, staffId)
    + (committedAmounts ? serviceAmount(committedAmounts, staffId) : 0)) * 100) / 100
}

// Skill filtering happens at the caller because a Turn Board recommendation can require several
// services while a line-level picker requires only one. From that eligible set, both surfaces use
// this identical fairness rule: clocked in, then lowest paid + committed services. Current workload does not exclude anyone.
// Longest wait breaks equal-dollar ties; fully tied rows retain their existing order.
export function selectNextTurnTechnician<TRow extends NextTurnRosterRow>(
  rosterRows: readonly TRow[],
  eligibleStaffIds: ReadonlySet<string>,
  serviceAmountsByStaffId: ReadonlyMap<string, number>,
  balance?: Pick<NextTurnBalance, 'committedAmounts' | 'availableSince'>,
) {
  const total = (id: string) => Math.round(nextTurnServiceAmount(id, serviceAmountsByStaffId, balance?.committedAmounts) * 100)
  const availableSince = (row: TRow) => Math.max(
    balance?.availableSince.get(row.posStaffProfileId) ?? 0,
    parseApiUtcDateTime(row.clockInAt)?.getTime() ?? 0,
  )
  const eligibleRows = rosterRows
    .filter((row) => row.isClockedIn && eligibleStaffIds.has(row.posStaffProfileId))
    .slice()
    .sort((a, b) => {
      const amountDifference = total(a.posStaffProfileId) - total(b.posStaffProfileId)
      return amountDifference || availableSince(a) - availableSince(b)
    })

  return eligibleRows[0]
}
