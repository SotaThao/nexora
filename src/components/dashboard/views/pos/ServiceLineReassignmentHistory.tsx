// Reassignment history for one service line of a completed ticket.
//
// Collapsed by default and fetched only once expanded: a ticket has several services, and loading
// every line's history on open would fire a request per line for something most lines never have.
//
// This exists because technicians are not notified when their earnings move — when one asks why
// their week is short, this is what the front desk reads back to them.
import { useState } from 'react'
import { History } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useServiceLineReassignmentHistory } from '../../../../data/hooks/usePosOrders'
import { formatPosDateTime } from './posDateTime'

const K = 'components.dashboard.views.pos.ServiceLineReassignmentHistory'

export default function ServiceLineReassignmentHistory({
  businessId,
  orderId,
  serviceLineId,
}: {
  businessId: string
  orderId: string
  serviceLineId: string
}) {
  const { t, currentLanguage } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const { data, isLoading } = useServiceLineReassignmentHistory(
    businessId,
    orderId,
    expanded ? serviceLineId : undefined,
  )

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraMuted hover:text-nexoraBrand"
      >
        <History className="h-3 w-3" />
        {expanded ? t(`${K}.hide`) : t(`${K}.show`)}
      </button>

      {expanded ? (
        <div className="mt-1 space-y-1.5">
          {isLoading ? <p className="text-[11px] text-nexoraMuted">{t(`${K}.loading`)}</p> : null}

          {!isLoading && (data ?? []).length === 0 ? (
            <p className="text-[11px] text-nexoraMuted">{t(`${K}.empty`)}</p>
          ) : null}

          {(data ?? []).map((entry) => (
            <div
              key={`${entry.reassignedAt}-${entry.toStaffName ?? ''}`}
              className="rounded-lg border border-nexoraBorder bg-nexoraCanvas p-2 text-[11px] text-nexoraText"
            >
              <p className="font-bold">
                {t(`${K}.movedLine`, {
                  from: entry.fromStaffName || t(`${K}.unknownTechnician`),
                  to: entry.toStaffName || t(`${K}.unknownTechnician`),
                })}
              </p>
              <p className="text-nexoraMuted">
                {t(`${K}.metaLine`, {
                  dateTime: formatPosDateTime(entry.reassignedAt, currentLanguage),
                  actor: entry.reassignedByName || t(`${K}.unknownActor`),
                })}
              </p>
              {entry.tipMovedAmount > 0 ? (
                <p className="text-nexoraMuted">
                  {t(`${K}.tipMoved`, { amount: entry.tipMovedAmount.toFixed(2) })}
                </p>
              ) : null}
              {entry.reason ? <p className="mt-0.5 italic">{entry.reason}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
