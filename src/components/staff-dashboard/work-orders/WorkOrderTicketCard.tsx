import { ChevronRight, MapPin, Radio, Store } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  WORK_ORDER_STATUS_BADGE_VARIANT,
  WORK_ORDER_STATUS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  workOrderStatusClass,
  type WorkOrderListItem,
} from './constants'
import {
  formatWorkOrderTicketTime,
  joinWorkOrderServiceNames,
  workOrderBeeperChipText,
  workOrderStationChipText,
  workOrderTextOrPlaceholder,
} from './workOrderTickets'

interface WorkOrderTicketCardProps {
  salonName: string
  ticket: WorkOrderListItem
  onSelect: () => void
}

export default function WorkOrderTicketCard({ salonName, ticket, onSelect }: WorkOrderTicketCardProps) {
  const { t, currentLanguage } = useTranslation()

  return (
    <button type="button" className={WORK_ORDERS_LAYOUT_CLASS.ticketCard} onClick={onSelect}>
      <span className={WORK_ORDERS_LAYOUT_CLASS.ticketTime}>
        {formatWorkOrderTicketTime(ticket, currentLanguage)}
      </span>
      <span className={WORK_ORDERS_LAYOUT_CLASS.grow}>
        <span className={WORK_ORDERS_LAYOUT_CLASS.ticketHeadRow}>
          <span className={WORK_ORDERS_LAYOUT_CLASS.ticketCustomer}>
            {workOrderTextOrPlaceholder(ticket.customerName)}
          </span>
          <span className={workOrderStatusClass(ticket.status, WORK_ORDER_STATUS_BADGE_VARIANT.ticket)}>
            {t(WORK_ORDER_STATUS_I18N[ticket.status])}
          </span>
        </span>
        <span className={WORK_ORDERS_LAYOUT_CLASS.ticketService}>
          {workOrderTextOrPlaceholder(joinWorkOrderServiceNames(ticket.serviceNames))}
        </span>
        <span className={WORK_ORDERS_LAYOUT_CLASS.ticketMeta}>
          <span className={WORK_ORDERS_LAYOUT_CLASS.metaChip}>
            <Store className={WORK_ORDERS_LAYOUT_CLASS.ticketMetaIcon} aria-hidden="true" />
            <span className={WORK_ORDERS_LAYOUT_CLASS.truncate}>
              {workOrderTextOrPlaceholder(salonName)}
            </span>
          </span>
          <span className={WORK_ORDERS_LAYOUT_CLASS.metaChip}>
            <MapPin className={WORK_ORDERS_LAYOUT_CLASS.ticketMetaIcon} aria-hidden="true" />
            <span className={WORK_ORDERS_LAYOUT_CLASS.truncate}>
              {workOrderStationChipText(ticket.stationNumber, t)}
            </span>
          </span>
          <span className={WORK_ORDERS_LAYOUT_CLASS.metaChip}>
            <Radio className={WORK_ORDERS_LAYOUT_CLASS.ticketMetaIcon} aria-hidden="true" />
            <span className={WORK_ORDERS_LAYOUT_CLASS.truncate}>
              {workOrderBeeperChipText(ticket.beeper, t)}
            </span>
          </span>
        </span>
      </span>
      <ChevronRight className={WORK_ORDERS_LAYOUT_CLASS.ticketChevron} aria-hidden="true" />
    </button>
  )
}
