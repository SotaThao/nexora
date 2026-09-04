import { Puzzle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  WORK_ORDER_APPROVAL_I18N,
  WORK_ORDER_APPROVAL_PILL_CLASS,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
} from './constants'
import type { WorkOrderEditableLine, WorkOrderServiceApproval } from './workOrderServiceCatalog'
import {
  formatWorkOrderDurationMinutes,
  formatWorkOrderMoney,
  workOrderAssignedTechnicianLabel,
  workOrderTextOrPlaceholder,
} from './workOrderTickets'

interface WorkOrderServiceLinesProps {
  items: WorkOrderEditableLine[]
  serviceTotal: number
  canEdit: boolean
  onAddService: () => void
  onAddCustomService: () => void
  onChangeService: (key: string) => void
}

export default function WorkOrderServiceLines({
  items,
  serviceTotal,
  canEdit,
  onAddService,
  onAddCustomService,
  onChangeService,
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
          <table className={WORK_ORDERS_LAYOUT_CLASS.serviceTable}>
            <colgroup>
              <col />
              <col className={WORK_ORDERS_LAYOUT_CLASS.serviceColPrice} />
              <col className={WORK_ORDERS_LAYOUT_CLASS.serviceColTime} />
              {canEdit ? <col className={WORK_ORDERS_LAYOUT_CLASS.serviceColAction} /> : null}
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
                {canEdit ? <th scope="col" className={WORK_ORDERS_LAYOUT_CLASS.srOnly}>{t(WORK_ORDERS_I18N.changeService)}</th> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((line) => (
                <WorkOrderServiceLineRow
                  key={line.key}
                  line={line}
                  canEdit={canEdit}
                  onChangeService={() => onChangeService(line.key)}
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

function WorkOrderApprovalPill({ approval }: { approval: WorkOrderServiceApproval }) {
  const { t } = useTranslation()
  return (
    <span className={`${WORK_ORDERS_LAYOUT_CLASS.approvalPill} ${WORK_ORDER_APPROVAL_PILL_CLASS[approval]}`}>
      {t(WORK_ORDER_APPROVAL_I18N[approval])}
    </span>
  )
}

function WorkOrderServiceLineRow({
  line,
  canEdit,
  onChangeService,
}: {
  line: WorkOrderEditableLine
  canEdit: boolean
  onChangeService: () => void
}) {
  const { t } = useTranslation()

  return (
    <tr className={WORK_ORDERS_LAYOUT_CLASS.serviceRow}>
      <td className={WORK_ORDERS_LAYOUT_CLASS.serviceNameCell}>
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
        {line.technicianName ? (
          <p className={WORK_ORDERS_LAYOUT_CLASS.serviceTech}>
            {workOrderAssignedTechnicianLabel(line.technicianName, t)}
          </p>
        ) : null}
      </td>
      <td className={`${WORK_ORDERS_LAYOUT_CLASS.serviceNumCell} ${WORK_ORDERS_LAYOUT_CLASS.servicePrice}`}>
        {formatWorkOrderMoney(line.unitPrice)}
      </td>
      <td className={`${WORK_ORDERS_LAYOUT_CLASS.serviceNumCell} ${WORK_ORDERS_LAYOUT_CLASS.serviceDuration}`}>
        {formatWorkOrderDurationMinutes(line.durationMinutes, t)}
      </td>
      {canEdit ? (
        <td className={WORK_ORDERS_LAYOUT_CLASS.serviceActionCell}>
          {line.isAddOn ? null : (
            <button
              type="button"
              className={WORK_ORDERS_LAYOUT_CLASS.serviceChangeButton}
              aria-label={`${t(WORK_ORDERS_I18N.changeService)} ${workOrderTextOrPlaceholder(line.serviceName)}`}
              onClick={onChangeService}
            >
              {t(WORK_ORDERS_I18N.changeService)}
            </button>
          )}
        </td>
      ) : null}
    </tr>
  )
}
