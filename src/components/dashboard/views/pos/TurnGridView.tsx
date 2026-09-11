// Turn Grid — one row per technician, one column per turn, so the day can be checked turn by
// turn instead of only as a total. A technician who thinks their count is wrong can point at the
// cell they disagree with, which a single "4.5T" badge never allows.
//
// Read-only. Adding a missing turn and editing a recorded one both create turns that belong to no
// service line, which needs a turn ledger and an audit trail — deliberately out of scope here.
import { useTranslation } from '../../../../contexts/LanguageContext'
import type { TurnBoardStationApiDto } from '../../../../types/repositories'

const TK = 'components.dashboard.views.pos.PosFrontDeskView.'

// Matches the prototype: the grid always shows at least this many columns so a quiet morning does
// not render as a one-column table that jumps wider with every ticket.
const MIN_TURN_COLUMNS = 12

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

export default function TurnGridView({
  stations,
  nextTurnStaffId,
}: {
  stations: readonly TurnBoardStationApiDto[]
  nextTurnStaffId?: string
}) {
  const { t } = useTranslation()

  const columnCount = Math.max(
    MIN_TURN_COLUMNS,
    ...stations.map((station) => station.turnEntries?.length ?? 0),
  )
  const columns = Array.from({ length: columnCount }, (_, index) => index)

  return (
    <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-nexoraCanvas/70">
            <th className="sticky left-0 z-10 bg-nexoraCanvas/70 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
              {t(TK + 'turnGridColumnHeader')}
            </th>
            {columns.map((index) => (
              <th
                key={index}
                className="px-2 py-2 text-[10px] font-extrabold tabular-nums text-nexoraMuted"
              >
                {index + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stations.map((station, rowIndex) => {
            const entries = station.turnEntries ?? []
            const isNextTurn = station.posStaffProfileId === nextTurnStaffId
            return (
              <tr
                key={station.posStaffProfileId}
                data-testid={`turn-grid-row-${station.posStaffProfileId}`}
                className="border-t border-nexoraBorder"
              >
                <th
                  scope="row"
                  className={`sticky left-0 z-10 min-w-[11rem] px-3 py-2 align-top ${
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
                </th>
                {columns.map((index) => {
                  const entry = entries[index]
                  if (!entry) {
                    return <td key={index} className="px-1 py-1" />
                  }
                  return (
                    <td key={index} className="px-1 py-1 align-top">
                      <div
                        title={`${entry.serviceName} · #${entry.orderNumber} · ${
                          entry.isRecorded
                            ? t(TK + 'turnGridRecordedHint')
                            : t(TK + 'turnGridProvisionalHint')
                        }`}
                        className={`min-w-[5.5rem] rounded-lg border px-2 py-1.5 ${
                          entry.isRecorded
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-dashed border-nexoraBorder bg-nexoraCanvas/60'
                        }`}
                      >
                        <span className="block truncate text-[10px] font-extrabold uppercase text-nexoraText">
                          {entry.serviceName}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-bold tabular-nums text-nexoraMuted">
                          {`${formatServiceTotal(entry.turnCreditAmount)} · +${formatTurnCredit(entry.turnCredit)}T`}
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
