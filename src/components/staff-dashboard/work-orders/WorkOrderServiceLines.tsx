import { Loader2, Puzzle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { PosOrderItemStatus, posOrderItemStatusLabelKey } from '../../../constants/posOrderItemStatus'
import {
  WORK_ORDER_APPROVAL_I18N,
  WORK_ORDER_APPROVAL_PILL_CLASS,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  workOrderServiceRowClass,
  workOrderServiceTableHeadClass,
} from './constants'
import type { WorkOrderEditableLine, WorkOrderServiceApproval } from './workOrderServiceCatalog'
import {
  formatWorkOrderDurationMinutes,
  formatWorkOrderMoney,
  workOrderAssignedTechnicianLabel,
  workOrderTextOrPlaceholder,
} from './workOrderTickets'

export type LineStatusActionKind = 'accept' | 'decline' | 'start' | 'complete'

export interface WorkOrderLineActions {
  onAccept: (line: WorkOrderEditableLine) => void
  onDecline: (line: WorkOrderEditableLine) => void
  onStart: (line: WorkOrderEditableLine) => void
  onComplete: (line: WorkOrderEditableLine) => void
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

const LINE_ACTION_PRIMARY_CLASS =
  'inline-flex h-9 items-center gap-1.5 rounded-lg bg-nexoraBrand px-3 text-[11px] font-extrabold text-white disabled:opacity-60'
const LINE_ACTION_SECONDARY_CLASS =
  'inline-flex h-9 items-center gap-1.5 rounded-lg border border-nexoraBorder px-3 text-[11px] font-extrabold text-nexoraText disabled:opacity-60'

interface WorkOrderServiceLinesProps {
  items: WorkOrderEditableLine[]
  serviceTotal: number
  canEdit: boolean
  onAddService: () => void
  onAddCustomService: () => void
  onChangeService: (key: string) => void
  onRemoveService?: (key: string) => void
  /** Omitted on read-only views; without it the rows render without line-status buttons. */
  actions?: WorkOrderLineActions
}

export default function WorkOrderServiceLines({
  items,
  serviceTotal,
  canEdit,
  onAddService,
  onAddCustomService,
  onChangeService,
  onRemoveService,
  actions,
}: WorkOrderServiceLinesProps) {
  const { t } = useTranslation()

  return (
    <section className={WORK_ORDERS_LAYOUT_CLASS.servicesCard}>
      <div className={WORK_ORDERS_LAYOUT_CLASS.servicesTitleRow}>
        <h3 className={WORK_ORDERS_LAYOUT_CLASS.servicesTitle}>
          {t(WORK_ORDERS_I18N.services)}
        </h3>
        {canEdit ? (
          <div className={WORK_ORDERS_LAYOUT_CLASS.serviceHeadActions}>
            <button type="button" className={WORK_ORDERS_LAYOUT_CLASS.addServiceButton} onClick={onAddService}>
              {t(WORK_ORDERS_I18N.addService)}
            </button>
            <button
              type="button"
              className={WORK_ORDERS_LAYOUT_CLASS.addServiceButton}
              onClick={onAddCustomService}
            >
              {t(WORK_ORDERS_I18N.addCustomService)}
            </button>
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className={WORK_ORDERS_LAYOUT_CLASS.emptyInline}>{workOrderTextOrPlaceholder('')}</p>
      ) : (
        <>
          <div className={WORK_ORDERS_LAYOUT_CLASS.serviceTable}>
            <div className={workOrderServiceTableHeadClass(canEdit)}>
              <span className={WORK_ORDERS_LAYOUT_CLASS.textLeft}>{t(WORK_ORDERS_I18N.colService)}</span>
              <span className={WORK_ORDERS_LAYOUT_CLASS.serviceHeadCellEnd}>{t(WORK_ORDERS_I18N.colPrice)}</span>
              <span className={WORK_ORDERS_LAYOUT_CLASS.serviceHeadCellEnd}>{t(WORK_ORDERS_I18N.colTime)}</span>
              {canEdit ? <span className="hidden md:block" aria-hidden="true" /> : null}
            </div>
            {items.map((line, index) => (
              <WorkOrderServiceLineRow
                key={line.id || line.key || `${line.serviceName}-${index}`}
                line={line}
                canEdit={canEdit}
                actions={actions}
                onChangeService={() => onChangeService(line.key)}
                onRemoveService={onRemoveService ? () => onRemoveService(line.key) : undefined}
              />
            ))}
          </div>
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

function WorkOrderApprovalPill({ approval }: { approval: WorkOrderServiceApproval }) {
  const { t } = useTranslation()

  return (
    <span className={WORK_ORDER_APPROVAL_PILL_CLASS[approval]}>
      {t(WORK_ORDER_APPROVAL_I18N[approval])}
    </span>
  )
}

function WorkOrderServiceLineRow({
  line,
  canEdit,
  actions,
  onChangeService,
  onRemoveService,
}: {
  line: WorkOrderEditableLine
  canEdit: boolean
  actions?: WorkOrderLineActions
  onChangeService: () => void
  onRemoveService?: () => void
}) {
  const { t } = useTranslation()
  const canAct = Boolean(actions) && Boolean(line.isMine) && !line.isAddOn
  const isPending = (kind: LineStatusActionKind) =>
    actions?.pendingLineId === line.id && actions.pendingKind === kind

  return (
    <div className={workOrderServiceRowClass(canEdit)}>
      <div className={WORK_ORDERS_LAYOUT_CLASS.serviceNameCell}>
        {line.isAddOn ? (
          <p className={WORK_ORDERS_LAYOUT_CLASS.serviceAddOnName}>
            <Puzzle className={WORK_ORDERS_LAYOUT_CLASS.serviceAddOnIcon} aria-hidden="true" />
            <span className={WORK_ORDERS_LAYOUT_CLASS.truncate}>
              {workOrderTextOrPlaceholder(line.serviceName)}
            </span>
            {line.approval ? <WorkOrderApprovalPill approval={line.approval} /> : null}
          </p>
        ) : (
          <div className={WORK_ORDERS_LAYOUT_CLASS.serviceNameRow}>
            <p className={WORK_ORDERS_LAYOUT_CLASS.serviceName}>
              {workOrderTextOrPlaceholder(line.serviceName)}
            </p>
            {line.approval ? <WorkOrderApprovalPill approval={line.approval} /> : null}
          </div>
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
      </div>
      <div className={`${WORK_ORDERS_LAYOUT_CLASS.serviceNumCell} ${WORK_ORDERS_LAYOUT_CLASS.servicePrice}`}>
        {formatWorkOrderMoney(line.unitPrice)}
      </div>
      <div className={`${WORK_ORDERS_LAYOUT_CLASS.serviceNumCell} ${WORK_ORDERS_LAYOUT_CLASS.serviceDuration}`}>
        {formatWorkOrderDurationMinutes(line.durationMinutes, t)}
      </div>
      {canEdit ? (
        <div className={WORK_ORDERS_LAYOUT_CLASS.serviceActionCell}>
          {line.isAddOn ? null : (
            <span className={WORK_ORDERS_LAYOUT_CLASS.serviceActionGroup}>
              <button
                type="button"
                className={WORK_ORDERS_LAYOUT_CLASS.serviceChangeButton}
                aria-label={`${t(WORK_ORDERS_I18N.changeService)} ${workOrderTextOrPlaceholder(line.serviceName)}`}
                onClick={onChangeService}
              >
                {t(WORK_ORDERS_I18N.changeServiceAction)}
              </button>
              {onRemoveService ? (
                <button
                  type="button"
                  className={WORK_ORDERS_LAYOUT_CLASS.serviceRemoveButton}
                  aria-label={`${t(WORK_ORDERS_I18N.removeService)} ${workOrderTextOrPlaceholder(line.serviceName)}`}
                  onClick={onRemoveService}
                >
                  {t(WORK_ORDERS_I18N.removeService)}
                </button>
              ) : null}
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}
