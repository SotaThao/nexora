import { useState } from 'react'
import { Check, ChevronLeft, LayoutGrid, Play, Radio } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  WORK_ORDER_STATUS_ACTION,
  WORK_ORDER_STATUS_BADGE_CLASS,
  WORK_ORDER_STATUS_I18N,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  WorkOrderActionIcon,
  WorkOrderTicketStatus,
  type WorkOrderTicketMock,
} from './constants'
import WorkOrderServiceLines from './WorkOrderServiceLines'
import {
  workOrderCustomerInitials,
  workOrderServiceTotal,
} from './workOrderTickets'

const ACTION_ICON = {
  [WorkOrderActionIcon.Play]: Play,
  [WorkOrderActionIcon.Check]: Check,
} as const

const ACTION_ICON_CLASS = {
  [WorkOrderActionIcon.Play]: WORK_ORDERS_LAYOUT_CLASS.iconMdFill,
  [WorkOrderActionIcon.Check]: WORK_ORDERS_LAYOUT_CLASS.iconMd,
} as const

interface StaffWorkOrderDetailProps {
  ticket: WorkOrderTicketMock
  onBack: () => void
}

export default function StaffWorkOrderDetail({ ticket, onBack }: StaffWorkOrderDetailProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState(ticket.status)
  const total = workOrderServiceTotal(ticket.services)

  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.detailPage}>
      <div className={WORK_ORDERS_LAYOUT_CLASS.detailHeader}>
        <button
          type="button"
          className={WORK_ORDERS_LAYOUT_CLASS.detailBack}
          aria-label={t(WORK_ORDERS_I18N.back)}
          onClick={onBack}
        >
          <ChevronLeft className={WORK_ORDERS_LAYOUT_CLASS.iconMd} aria-hidden="true" />
        </button>
        <div className={WORK_ORDERS_LAYOUT_CLASS.detailTitleWrap}>
          <h2 className={WORK_ORDERS_LAYOUT_CLASS.detailTitle}>
            {t(WORK_ORDERS_I18N.detailTitle)}
          </h2>
          <p className={WORK_ORDERS_LAYOUT_CLASS.detailCode}>{ticket.code}</p>
        </div>
        <span className={`${WORK_ORDERS_LAYOUT_CLASS.detailBadge} ${WORK_ORDER_STATUS_BADGE_CLASS[status]}`}>
          {t(WORK_ORDER_STATUS_I18N[status])}
        </span>
      </div>

      <div className={WORK_ORDERS_LAYOUT_CLASS.customerCard}>
        <div className={WORK_ORDERS_LAYOUT_CLASS.customerRow}>
          <span className={WORK_ORDERS_LAYOUT_CLASS.avatar}>
            {workOrderCustomerInitials(ticket.customerName)}
          </span>
          <div className={WORK_ORDERS_LAYOUT_CLASS.grow}>
            <p className={WORK_ORDERS_LAYOUT_CLASS.customerLabel}>
              {t(WORK_ORDERS_I18N.customer)}
            </p>
            <p className={WORK_ORDERS_LAYOUT_CLASS.customerName}>{ticket.customerName}</p>
            <div className={WORK_ORDERS_LAYOUT_CLASS.customerMeta}>
              <span className={WORK_ORDERS_LAYOUT_CLASS.metaChipWide}>
                <LayoutGrid className={WORK_ORDERS_LAYOUT_CLASS.addOnIcon} aria-hidden="true" />
                {t(WORK_ORDERS_I18N.station, { number: ticket.station })}
              </span>
              <span className={WORK_ORDERS_LAYOUT_CLASS.metaChipWide}>
                <Radio className={WORK_ORDERS_LAYOUT_CLASS.addOnIcon} aria-hidden="true" />
                {t(WORK_ORDERS_I18N.beeper, { code: ticket.beeper })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <WorkOrderServiceLines services={ticket.services} total={total} />
      <WorkOrderStatusActionButton status={status} onAdvance={setStatus} />

      {ticket.notes ? (
        <aside className={WORK_ORDERS_LAYOUT_CLASS.notesCard}>
          <p className={WORK_ORDERS_LAYOUT_CLASS.notesKicker}>
            {t(WORK_ORDERS_I18N.notesLabel)}
          </p>
          <p className={WORK_ORDERS_LAYOUT_CLASS.notesHeading}>
            {t(WORK_ORDERS_I18N.notesTitle)}
          </p>
          <p className={WORK_ORDERS_LAYOUT_CLASS.notesBody}>{ticket.notes}</p>
        </aside>
      ) : null}
    </div>
  )
}

function WorkOrderStatusActionButton({
  status,
  onAdvance,
}: {
  status: WorkOrderTicketStatus
  onAdvance: (nextStatus: WorkOrderTicketStatus) => void
}) {
  const { t } = useTranslation()
  const action = WORK_ORDER_STATUS_ACTION[status]
  if (!action) return null

  const Icon = ACTION_ICON[action.icon]
  return (
    <button
      type="button"
      className={WORK_ORDERS_LAYOUT_CLASS.actionButton}
      onClick={() => onAdvance(action.nextStatus)}
    >
      <Icon className={ACTION_ICON_CLASS[action.icon]} aria-hidden="true" />
      {t(action.labelKey)}
    </button>
  )
}
