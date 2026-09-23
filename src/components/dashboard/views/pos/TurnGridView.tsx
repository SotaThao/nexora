// Each column holds one weighted turn, filled chronologically by service credits.
// A service can span cells; multiple services can share a cell. The final cell may be fractional.
// Manual turn creation/editing remains unavailable until the API supports it.
import { formatHours } from './timeclock/timeClockDay'
import { TurnStationStatus } from './TurnStationDetails'
import { useTranslation } from '../../../../contexts/LanguageContext'
import type { TurnBoardEntryApiDto, TurnBoardStationApiDto } from '../../../../types/repositories'
import './TurnGridView.css'

const TK = 'components.dashboard.views.pos.PosFrontDeskView.'
const TIME_CLOCK_TK = 'components.dashboard.views.pos.TimeClock.'

// Matches the prototype: the grid always shows at least this many columns so a quiet morning does
// not render as a one-column table that jumps wider with every ticket.
const MIN_TURN_COLUMNS = 12
const TECHNICIAN_COLUMN_WIDTH = 190
const TURN_COLUMN_MIN_WIDTH = 66
const COLUMN_SPACING = 4
const TABLE_HORIZONTAL_PADDING = 16

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** 4 rather than 4.0, but 4.5 stays 4.5 — the ".0" reads as precision nobody asked for. */
export function formatTurnCredit(value: number | null | undefined) {
  const turns = Number.isFinite(value) ? Math.max(0, value as number) : 0
  return Number.isInteger(turns) ? String(turns) : turns.toFixed(1)
}

export function formatServiceTotal(value: number | null | undefined) {
  return currency.format(Number.isFinite(value) ? Math.max(0, value as number) : 0)
}

const TURN_PRECISION = 8
const TURN_EPSILON = 10 ** -TURN_PRECISION
const gridCredit = (credit: number) => String(Number(credit.toFixed(TURN_PRECISION)))

function buildTurnCells(entries: readonly TurnBoardEntryApiDto[]) {
  const cells: { credit: number; parts: { entry: TurnBoardEntryApiDto; credit: number }[] }[] = []
  // The API supplies oldest-first entries. Ticket boundaries do not reset a partially filled cell.
  for (const entry of entries) {
    let remaining = Number.isFinite(entry.turnCredit) ? Math.max(0, entry.turnCredit) : 0
    while (remaining > TURN_EPSILON) {
      let cell = cells[cells.length - 1]
      if (!cell || cell.credit >= 1 - TURN_EPSILON) {
        cell = { credit: 0, parts: [] }
        cells.push(cell)
      }
      const credit = Math.min(1 - cell.credit, remaining)
      cell.parts.push({ entry, credit })
      cell.credit += credit
      remaining -= credit
    }
  }
  return cells.map(cell => ({
    ...cell,
    isRecorded: cell.parts.every(part => part.entry.isRecorded),
  }))
}

export default function TurnGridView({
  stations,
  nextTurnStaffId,
  checkInEligibleStaffIds,
  isCheckInPending,
  onCheckIn,
  workingHoursByStaffId,
}: {
  workingHoursByStaffId?: ReadonlyMap<string, number>
  stations: readonly TurnBoardStationApiDto[]
  nextTurnStaffId?: string
  checkInEligibleStaffIds: ReadonlySet<string>
  isCheckInPending: boolean
  onCheckIn: (station: TurnBoardStationApiDto) => void
}) {
  const { t } = useTranslation()

  const rows = stations.map(station => ({ station, turns: buildTurnCells(station.turnEntries ?? []) }))
  const columnCount = Math.max(MIN_TURN_COLUMNS, ...rows.map(row => row.turns.length + 1))
  const columns = Array.from({ length: columnCount }, (_, index) => index)
  const tableMinWidth = TECHNICIAN_COLUMN_WIDTH + columnCount * TURN_COLUMN_MIN_WIDTH
    + (columnCount + 2) * COLUMN_SPACING + TABLE_HORIZONTAL_PADDING

  return (
    <div className="pos-turn-grid-wrap overflow-auto border bg-white">
      <table
        className="pos-turn-grid w-full table-fixed border-separate border-spacing-1 p-2 text-left"
        style={{ minWidth: tableMinWidth }}
      >
        <colgroup>
          <col style={{ width: TECHNICIAN_COLUMN_WIDTH }} />
          <col span={columnCount} />
        </colgroup>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 px-2 py-2 text-[10px] font-extrabold uppercase tracking-wide">
              {t(TK + 'turnGridColumnHeader')}
            </th>
            {columns.map((index) => (
              <th
                key={index}
                scope="col"
                className="px-2 py-2 text-center text-[10px] font-extrabold tabular-nums"
              >
                {index + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ station, turns }, rowIndex) => {
            const isNextTurn = station.posStaffProfileId === nextTurnStaffId
            return (
              <tr
                key={station.posStaffProfileId}
                data-testid={`turn-grid-row-${station.posStaffProfileId}`}
              >
                <th
                  scope="row"
                  className={`sticky left-0 z-10 px-2 py-2 align-middle shadow-sm ${
                    isNextTurn ? 'bg-violet-50' : 'bg-white'
                  }`}
                >
                  <span className="block truncate text-[11px] font-extrabold text-nexoraText">
                    {station.isClockedIn === false
                      ? `— · ${station.displayName}`
                      : `#${rowIndex + 1}${isNextTurn ? ' NEXT' : ''} · ${station.displayName}`}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-bold tabular-nums text-nexoraMuted">
                    {t(TK + 'stationWeightedTurns', {
                      turns: formatTurnCredit(station.weightedTurnsToday),
                      amount: formatServiceTotal(station.serviceTotalToday),
                    })}
                  </span>
                  <div className="mt-1"><TurnStationStatus station={station} /></div>
                  {workingHoursByStaffId?.has(station.posStaffProfileId) ? (
                    <span className="mt-1 block text-[10px] text-nexoraMuted">
                      {t(TK + 'stationWorkingTimeLabel')}: {formatHours(workingHoursByStaffId.get(station.posStaffProfileId))}
                    </span>
                  ) : null}
                  {station.isClockedIn === false && checkInEligibleStaffIds.has(station.posStaffProfileId) ? (
                    <button
                      type="button"
                      onClick={() => onCheckIn(station)}
                      disabled={isCheckInPending}
                      className="mt-1 block rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      {t(TIME_CLOCK_TK + 'clockIn')}
                    </button>
                  ) : null}
                </th>
                {columns.map((index) => {
                  const turn = turns[index]
                  const cellClass = 'pos-turn-grid-cell h-[60px] border p-0 text-center align-middle text-[10px] font-bold'
                  if (!turn) {
                    // Show Add Turn here when manual turn creation is supported by the API.
                    return <td key={index} className={cellClass} />
                  }
                  return (
                    <td
                      key={index}
                      // Keep the text above its diagonal fill without overlapping the sticky technician column.
                      className={`${cellClass} pos-turn-grid-cell-filled relative isolate overflow-hidden${turn.isRecorded ? '' : ' border-dashed'}`}
                    >
                      {index === turns.length - 1 && turn.credit < 1 - TURN_EPSILON ? (
                        <svg
                          aria-hidden="true"
                          focusable="false"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          className="pointer-events-none absolute inset-0 h-full w-full"
                        >
                          <polygon points="100,0 100,100 0,100" className="pos-turn-grid-empty-half" />
                          <line
                            x1="0" y1="100" x2="100" y2="0"
                            stroke="currentColor"
                            strokeOpacity="0.2"
                            strokeWidth="0.75"
                            strokeDasharray="4 4"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      ) : null}
                      <div
                        title={`${turn.parts.map(({ entry, credit }) => `${entry.serviceName} · #${entry.orderNumber} · ${gridCredit(credit)}T`).join('\n')} · ${
                          turn.isRecorded ? t(TK + 'turnGridRecordedHint') : t(TK + 'turnGridProvisionalHint')
                        }`}
                        className="relative z-10 flex min-h-[58px] min-w-0 flex-col justify-center gap-1 px-2 py-2"
                      >
                        {turn.parts.map(({ entry }) => (
                          <span key={entry.posOrderItemId} className="block font-extrabold uppercase leading-tight [overflow-wrap:anywhere]">
                            {entry.serviceName}
                          </span>
                        ))}
                        <span className="block whitespace-nowrap text-[10px] font-bold tabular-nums">
                          {`${gridCredit(turn.credit)}T`}
                        </span>
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
