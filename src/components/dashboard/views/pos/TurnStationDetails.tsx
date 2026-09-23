import { useTranslation } from '../../../../contexts/LanguageContext'
import { PosOrderStatus } from '../../../../constants/posOrderStatus'
import { posOrderItemStatusLabelKey } from '../../../../constants/posOrderItemStatus'
import type { TurnBoardStationApiDto } from '../../../../types/repositories'
import { formatPosTime } from './posDateTime'

const TK = 'components.dashboard.views.pos.PosFrontDeskView.'

export function TurnStationStatus({ station }: { station: TurnBoardStationApiDto }) {
  const { t } = useTranslation()
  const clockedOut = station.isClockedIn === false
  const busy = station.currentStatus === PosOrderStatus.InService
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${
      clockedOut ? 'border-slate-200 bg-slate-50 text-slate-600'
        : busy ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }`}>
      {t(TK + (clockedOut ? 'turnBoardStatusFilter.clockedout' : `stationStatus.${station.currentStatus}`))}
    </span>
  )
}

export default function TurnStationDetails({ station, customerPhone }: {
  station: TurnBoardStationApiDto
  customerPhone?: string
}) {
  const { t, currentLanguage } = useTranslation()
  const pendingCount = station.pendingAcceptanceCount ?? 0
  const addOnCount = station.currentAddOnCount ?? 0
  return (
    <div className="space-y-2 text-[11px] text-nexoraMuted">
      {pendingCount > 0 ? (
        <p className="font-semibold text-amber-700">
          {t(TK + (pendingCount === 1 ? 'stationPendingService' : 'stationPendingServices'), { count: pendingCount })}
        </p>
      ) : null}
      {station.currentStatus === PosOrderStatus.InService ? (
        <div className="space-y-2 rounded-xl bg-nexoraCanvas/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="pos-customer-name break-words text-xs font-bold text-nexoraText">{station.currentCustomerName}</p>
            {station.currentOrderNumber ? (
              <span className="font-mono font-bold">#{station.currentOrderNumber}</span>
            ) : null}
          </div>
          {station.currentServiceNames?.length > 0 ? (
            <p className="break-words font-semibold text-nexoraText">{station.currentServiceNames.join(', ')}</p>
          ) : null}
          {customerPhone ? <p className="tabular-nums">{customerPhone}</p> : null}
          {station.currentLineStatus ? (
            <p className="font-semibold text-nexoraText">{t(posOrderItemStatusLabelKey(station.currentLineStatus))}</p>
          ) : null}
          {addOnCount > 0 ? (
            <p>{t(TK + (addOnCount === 1 ? 'stationAddOn' : 'stationAddOns'), { count: addOnCount })}</p>
          ) : null}
          {station.assignedAt ? (
            <p className="font-semibold text-nexoraText">
              {t(TK + 'servingSince', { time: formatPosTime(station.assignedAt, currentLanguage) })}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
