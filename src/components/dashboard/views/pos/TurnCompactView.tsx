// Turn Compact — one dense row per technician, matching the reference prototype's compact board:
// rank/technician, status, turns, services, service total, and today's skills + actions.
// Same data and sort order as the Stations and Turn Grid views; this one just trades card/grid
// layout for a scannable table when the front desk wants the whole roster on screen at once.
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import TurnStationDetails, { TurnStationStatus } from './TurnStationDetails'
import { formatHours } from './timeclock/timeClockDay'
import { EMPTY_VALUE, getInitials } from './posDisplay'
import StationBeepButton from './StationBeepButton'
import { formatServiceTotal, formatTurnCredit } from './TurnGridView'
import {
  POS_TABLE_HEADER_CELL_CLASS,
  POS_TABLE_HEADER_ROW_CLASS,
} from './posTableStyles'
import type { PosBeepApiDto, TurnBoardStationApiDto } from '../../../../types/repositories'

const TK = 'components.dashboard.views.pos.PosFrontDeskView.'
const TIME_CLOCK_TK = 'components.dashboard.views.pos.TimeClock.'

export default function TurnCompactView({
  stations,
  nextTurnStaffId,
  beepByStaffId,
  isBeepPending,
  beepingStaffId,
  onOpenBeep,
  checkInEligibleStaffIds,
  isCheckInPending,
  checkingInStaffId,
  onCheckIn,
  staffLevelByStaffId,
  workingHoursByStaffId,
  customerPhoneByOrderId,
}: {
  stations: readonly TurnBoardStationApiDto[]
  nextTurnStaffId?: string
  beepByStaffId: ReadonlyMap<string, PosBeepApiDto>
  isBeepPending: boolean
  beepingStaffId?: string
  onOpenBeep: (station: TurnBoardStationApiDto) => void
  checkInEligibleStaffIds: ReadonlySet<string>
  isCheckInPending: boolean
  checkingInStaffId: string | null
  onCheckIn: (station: TurnBoardStationApiDto) => void
  staffLevelByStaffId: ReadonlyMap<string, string | null | undefined>
  workingHoursByStaffId: ReadonlyMap<string, number>
  customerPhoneByOrderId: ReadonlyMap<string, string>
}) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
      <table className="w-full min-w-[960px] table-fixed text-left text-xs">
        <colgroup>
          <col className="w-[22%]" />
          <col className="w-[10%]" />
          <col className="w-[8%]" />
          <col className="w-[8%]" />
          <col className="w-[10%]" />
          <col className="w-[42%]" />
        </colgroup>
        <thead>
          <tr className={POS_TABLE_HEADER_ROW_CLASS}>
            <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(TK + 'turnBoardCompactColumnTechnician')}</th>
            <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(TK + 'turnBoardCompactColumnStatus')}</th>
            <th className={`${POS_TABLE_HEADER_CELL_CLASS} text-right`}>{t(TK + 'todayTurnsColumnTurns')}</th>
            <th className={`${POS_TABLE_HEADER_CELL_CLASS} text-right`}>{t(TK + 'turnBoardCompactColumnServices')}</th>
            <th className={`${POS_TABLE_HEADER_CELL_CLASS} text-right`}>{t(TK + 'turnBoardCompactColumnServiceTotal')}</th>
            <th className={POS_TABLE_HEADER_CELL_CLASS}>{t(TK + 'turnBoardCompactColumnActions')}</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((station, rowIndex) => {
            const isNextTurn = station.posStaffProfileId === nextTurnStaffId
            const isBeeping = isBeepPending && beepingStaffId === station.posStaffProfileId
            const canCheckIn = station.isClockedIn === false && checkInEligibleStaffIds.has(station.posStaffProfileId)
            const serviceCount = (station.turnEntries ?? []).length
            return (
              <tr
                key={station.posStaffProfileId}
                data-testid={`turn-compact-row-${station.posStaffProfileId}`}
                className={`border-t border-nexoraBorder/70 transition-colors ${
                  isNextTurn ? 'bg-violet-50/60 hover:bg-violet-50' : 'hover:bg-nexoraCanvas/60'
                }`}
              >
                <td className="px-3 py-2.5 align-top">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nexoraLavender/20 text-[10px] font-bold text-nexoraBrandDark">
                      {station.photoUrl ? (
                        <img src={station.photoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        getInitials(station.displayName)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="truncate text-xs font-extrabold text-nexoraText">
                          {station.isClockedIn === false
                            ? `${EMPTY_VALUE} · ${station.displayName}`
                            : `#${rowIndex + 1} · ${station.displayName}`}
                        </span>
                        {isNextTurn ? (
                          <span className="inline-flex rounded-full bg-violet-700 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                            {t(TK + 'nextTurnBadge')}
                          </span>
                        ) : null}
                      </div>
                      <span className="mt-0.5 block text-[10px] font-bold text-nexoraMuted">
                        {t(TK + 'stationLevelLabel')} {staffLevelByStaffId.get(station.posStaffProfileId) ?? EMPTY_VALUE}
                      </span>
                      {workingHoursByStaffId.has(station.posStaffProfileId) ? (
                        <span className="mt-0.5 block text-[10px] tabular-nums text-nexoraMuted">
                          {t(TK + 'stationWorkingTimeLabel')}: {formatHours(workingHoursByStaffId.get(station.posStaffProfileId))}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <TurnStationStatus station={station} />
                </td>
                <td className="px-3 py-2.5 text-right align-top font-bold tabular-nums text-nexoraText">
                  {formatTurnCredit(station.weightedTurnsToday)}
                </td>
                <td className="px-3 py-2.5 text-right align-top font-bold tabular-nums text-nexoraText">
                  {serviceCount}
                </td>
                <td className="px-3 py-2.5 text-right align-top font-bold tabular-nums text-nexoraText">
                  {formatServiceTotal(station.serviceTotalToday)}
                </td>
                <td className="px-3 py-2.5 align-top">
                  <TurnStationDetails
                    station={station}
                    customerPhone={customerPhoneByOrderId.get(station.currentOrderId)}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {(station.turnEntries ?? []).map((entry) => (
                      <span
                        key={entry.posOrderItemId}
                        className="rounded-md border border-nexoraBorder bg-nexoraCanvas/60 px-1.5 py-0.5 text-[10px] font-bold text-nexoraMuted"
                      >
                        {entry.serviceName}
                      </span>
                    ))}
                    {canCheckIn ? (
                      <button
                        type="button"
                        onClick={() => onCheckIn(station)}
                        disabled={isCheckInPending}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                      >
                        {checkingInStaffId === station.posStaffProfileId ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : null}
                        {t(TIME_CLOCK_TK + 'clockIn')}
                      </button>
                    ) : null}
                    <StationBeepButton
                      station={station}
                      beep={beepByStaffId.get(station.posStaffProfileId)}
                      isPending={isBeepPending}
                      isBeeping={isBeeping}
                      onOpen={onOpenBeep}
                    />
                    {/* Show Edit Turn when its API is supported. */}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
