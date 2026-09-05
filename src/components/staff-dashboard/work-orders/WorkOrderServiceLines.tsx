import { Loader2, Puzzle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  PosOrderItemStatus,
  posOrderItemStatusLabelKey,
} from '../../../constants/posOrderItemStatus'
import { WORK_ORDERS_I18N, WORK_ORDERS_LAYOUT_CLASS, type WorkOrderItem } from './constants'
import {
  formatWorkOrderDurationMinutes,
  formatWorkOrderMoney,
  workOrderAssignedTechnicianLabel,
  workOrderTextOrPlaceholder,
} from './workOrderTickets'

export type LineStatusActionKind = 'accept' | 'decline' | 'start' | 'complete'

export interface WorkOrderLineActions {
  onAccept: (line: WorkOrderItem) => void
  onDecline: (line: WorkOrderItem) => void
  onStart: (line: WorkOrderItem) => void
  onComplete: (line: WorkOrderItem) => void
  isBusy: boolean
  /** The line whose button is mid-flight — only that button shows a spinner. */
  pendingLineId: string | null
  pendingKind: LineStatusActionKind | null
}

const LINE_STATUS_I18N = 'components.dashboard.views.pos.serviceLineStatus'

const LINE_STATUS_BADGE_CLASS: Record<string, string> = {
  [PosOrderItemStatus.Unassigned]: 'bg-rose-100 text-rose-700',
  [PosOrderItemStatus.PendingAcceptance]: 'bg-amber-100 text-amber-700',
  [PosOrderItemStatus.Assigned]: 'bg-sky-100 text-sky-700',
  [PosOrderItemStatus.Started]: 'bg-indigo-100 text-indigo-700',
  [PosOrderItemStatus.Completed]: 'bg-emerald-100 text-emerald-700',
}

// 44pt-ish tap targets: these are pressed one-handed, mid-service.
const LINE_ACTION_PRIMARY_CLASS =
  'inline-flex h-9 items-center gap-1.5 rounded-lg bg-nexoraBrand px-3 text-[11px] font-extrabold text-white disabled:opacity-60'
const LINE_ACTION_SECONDARY_CLASS =
  'inline-flex h-9 items-center gap-1.5 rounded-lg border border-nexoraBorder px-3 text-[11px] font-extrabold text-nexoraText disabled:opacity-60'

interface WorkOrderServiceLinesProps {
  items: WorkOrderItem[]
  serviceTotal: number
  /** Omitted on read-only views; without it the rows render exactly as before. */
  actions?: WorkOrderLineActions
}

export default function WorkOrderServiceLines({ items, serviceTotal, actions }: WorkOrderServiceLinesProps) {
  const { t } = useTranslation()

  return (
    <section className={WORK_ORDERS_LAYOUT_CLASS.servicesCard}>
      <div className={WORK_ORDERS_LAYOUT_CLASS.servicesTitleRow}>
        <h3 className={WORK_ORDERS_LAYOUT_CLASS.servicesTitle}>
          {t(WORK_ORDERS_I18N.services)}
        </h3>
      </div>

      {items.length === 0 ? (
        <p className={WORK_ORDERS_LAYOUT_CLASS.emptyInline}>{workOrderTextOrPlaceholder('')}</p>
      ) : (
        <>
          <table className={WORK_ORDERS_LAYOUT_CLASS.serviceTable}>
            <colgroup>
              <col />
              <col className={WORK_ORDERS_LAYOUT_CLASS.serviceColPrice} />
              <col className={WORK_ORDERS_LAYOUT_CLASS.serviceColTime} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className={`${WORK_ORDERS_LAYOUT_CLASS.serviceHeadCell} ${WORK_ORDERS_LAYOUT_CLASS.textLeft}`}>
                  {t(WORK_ORDERS_I18N.colService)}
                </th>
                <th scope="col" className={WORK_ORDERS_LAYOUT_CLASS.serviceHeadCellEnd}>
                  {t(WORK_ORDERS_I18N.colPrice)}
                </th>
                <th scope="col" className={WORK_ORDERS_LAYOUT_CLASS.serviceHeadCellEnd}>
                  {t(WORK_ORDERS_I18N.colTime)}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((line, index) => (
                <WorkOrderServiceLineRow
                  key={line.id || `${line.serviceName}-${index}`}
                  line={line}
                  actions={actions}
                />
              ))}
            </tbody>
          </table>
          <div className={WORK_ORDERS_LAYOUT_CLASS.serviceTotalRow}>
            <span className={WORK_ORDERS_LAYOUT_CLASS.serviceTotalLabel}>
              {t(WORK_ORDERS_I18N.serviceTotal)}
            </span>
            <span className={WORK_ORDERS_LAYOUT_CLASS.serviceTotalValue}>
              {formatWorkOrderMoney(serviceTotal)}
            </span>
          </div>
        </>
      )}
    </section>
  )
}

function WorkOrderServiceLineRow({
  line,
  actions,
}: {
  line: WorkOrderItem
  actions?: WorkOrderLineActions
}) {
  const { t } = useTranslation()

  // An add-on is finished together with the service it extends, and a line belonging to another
  // technician is theirs to act on — neither gets buttons here.
  const canAct = Boolean(actions) && line.isMine && !line.isAddOn

  const isPending = (kind: LineStatusActionKind) =>
    actions?.pendingLineId === line.id && actions.pendingKind === kind

  return (
    <tr className={WORK_ORDERS_LAYOUT_CLASS.serviceRow}>
      <td className={WORK_ORDERS_LAYOUT_CLASS.serviceNameCell}>
        {line.isAddOn ? (
          <p className={WORK_ORDERS_LAYOUT_CLASS.serviceAddOnName}>
            <Puzzle className={WORK_ORDERS_LAYOUT_CLASS.serviceAddOnIcon} aria-hidden="true" />
            <span className={WORK_ORDERS_LAYOUT_CLASS.truncate}>
              {workOrderTextOrPlaceholder(line.serviceName)}
            </span>
          </p>
        ) : (
          <p className={WORK_ORDERS_LAYOUT_CLASS.serviceName}>
            {workOrderTextOrPlaceholder(line.serviceName)}
          </p>
        )}
        <p className={WORK_ORDERS_LAYOUT_CLASS.serviceTech}>
          {workOrderAssignedTechnicianLabel(line.technicianName, t)}
        </p>
        {!line.isAddOn && line.lineStatus ? (
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
            LINE_STATUS_BADGE_CLASS[line.lineStatus] ?? LINE_STATUS_BADGE_CLASS[PosOrderItemStatus.Unassigned]
          }`}>
            {t(posOrderItemStatusLabelKey(line.lineStatus))}
          </span>
        ) : null}
        {canAct && actions ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {line.lineStatus === PosOrderItemStatus.PendingAcceptance ? (
              <>
                <button
                  type="button"
                  onClick={() => actions.onAccept(line)}
                  disabled={actions.isBusy}
                  className={LINE_ACTION_PRIMARY_CLASS}
                >
                  {isPending('accept') ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : null}
                  {t(`${LINE_STATUS_I18N}.acceptAction`)}
                </button>
                <button
                  type="button"
                  onClick={() => actions.onDecline(line)}
                  disabled={actions.isBusy}
                  className={LINE_ACTION_SECONDARY_CLASS}
                >
                  {isPending('decline') ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : null}
                  {t(`${LINE_STATUS_I18N}.declineAction`)}
                </button>
              </>
            ) : null}
            {line.lineStatus === PosOrderItemStatus.Assigned ? (
              <button
                type="button"
                onClick={() => actions.onStart(line)}
                disabled={actions.isBusy}
                className={LINE_ACTION_PRIMARY_CLASS}
              >
                {isPending('start') ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : null}
                {t(`${LINE_STATUS_I18N}.startAction`)}
              </button>
            ) : null}
            {line.lineStatus === PosOrderItemStatus.Started ? (
              <button
                type="button"
                onClick={() => actions.onComplete(line)}
                disabled={actions.isBusy}
                className={LINE_ACTION_PRIMARY_CLASS}
              >
                {isPending('complete') ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : null}
                {t(`${LINE_STATUS_I18N}.completeAction`)}
              </button>
            ) : null}
          </div>
        ) : null}
      </td>
      <td className={`${WORK_ORDERS_LAYOUT_CLASS.serviceNumCell} ${WORK_ORDERS_LAYOUT_CLASS.servicePrice}`}>
        {formatWorkOrderMoney(line.lineTotal || line.unitPrice)}
      </td>
      <td className={`${WORK_ORDERS_LAYOUT_CLASS.serviceNumCell} ${WORK_ORDERS_LAYOUT_CLASS.serviceDuration}`}>
        {formatWorkOrderDurationMinutes(line.durationMinutes, t)}
      </td>
    </tr>
  )
}
