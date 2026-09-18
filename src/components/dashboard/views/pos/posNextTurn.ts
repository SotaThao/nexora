import type { TimeClockRosterRowApiDto, TurnBoardStationApiDto } from '../../../../types/repositories'
import { PosOrderStatus } from '../../../../constants/posOrderStatus'
import type { NextTurnBalance } from '../../../../data/repositories/posNextTurn'
import { parseApiUtcDateTime } from '../../../../utils/localDate'

type NextTurnRosterRow = Pick<
  TimeClockRosterRowApiDto,
  'posStaffProfileId' | 'displayName' | 'isClockedIn' | 'turnRank' | 'turnsToday' | 'clockInAt'
>

function weightedTurns(station: Pick<TurnBoardStationApiDto, 'weightedTurnsToday'>) {
  return Number.isFinite(station.weightedTurnsToday) ? Math.max(0, station.weightedTurnsToday ?? 0) : 0
}

function assignedServiceAmountInCents(station: Pick<TurnBoardStationApiDto, 'turnEntries'>) {
  // Compare cents so equal service totals stay tied despite floating-point addition.
  return (station.turnEntries ?? [])
    .filter(entry => !entry.isRecorded)
    .reduce((total, entry) => total + (Number.isFinite(entry.turnCreditAmount)
      ? Math.round(Math.max(0, entry.turnCreditAmount) * 100) : 0), 0)
}

export function selectNextTurnStation<
  TStation extends Pick<TurnBoardStationApiDto, 'posStaffProfileId' | 'weightedTurnsToday' | 'turnEntries'>,
>(
  stations: readonly TStation[],
  rosterRows: readonly Pick<NextTurnRosterRow, 'posStaffProfileId' | 'isClockedIn' | 'clockInAt'>[],
  availableSince?: ReadonlyMap<string, number>,
) {
  // The roster reflects open clock entries; the Board's clock flag reflects staff status.
  const clockedInRows = new Map(rosterRows.filter(row => row.isClockedIn).map(row => [row.posStaffProfileId, row]))
  const waitingSince = (station: TStation) => Math.max(
    availableSince?.get(station.posStaffProfileId) ?? 0,
    parseApiUtcDateTime(clockedInRows.get(station.posStaffProfileId)?.clockInAt)?.getTime() ?? 0,
  )

  // The API total already includes recorded turns and provisional credit for assigned services.
  return stations
    .filter(station => clockedInRows.has(station.posStaffProfileId))
    .sort((a, b) => weightedTurns(a) - weightedTurns(b)
      || assignedServiceAmountInCents(a) - assignedServiceAmountInCents(b)
      || waitingSince(a) - waitingSince(b))[0]
}

export function sortTurnBoardStations<
  TStation extends Pick<TurnBoardStationApiDto, 'posStaffProfileId' | 'currentStatus' | 'isClockedIn' | 'weightedTurnsToday'>,
>(stations: readonly TStation[], nextTurnStaffId?: string): TStation[] {
  return [...stations].sort((a, b) => {
    // The recommendation always leads the board, even when that technician is busy.
    const nextTurnDifference = Number(b.posStaffProfileId === nextTurnStaffId)
      - Number(a.posStaffProfileId === nextTurnStaffId)
    if (nextTurnDifference !== 0) return nextTurnDifference

    const busyDifference = Number(a.currentStatus === PosOrderStatus.InService)
      - Number(b.currentStatus === PosOrderStatus.InService)
    if (busyDifference !== 0) return busyDifference

    // Remaining busy technicians run from fewest to most displayed turns.
    if (a.currentStatus === PosOrderStatus.InService) {
      const turnsDifference = weightedTurns(a) - weightedTurns(b)
      if (turnsDifference !== 0) return turnsDifference
    }

    // Keep on-shift technicians first within remaining ties; absent values read as on shift.
    return Number(a.isClockedIn === false) - Number(b.isClockedIn === false)
  })
}

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

// The line-level picker supplies technicians qualified for its service. From that eligible set,
// use clocked in, then lowest paid + committed services. Current workload does not exclude anyone.
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
