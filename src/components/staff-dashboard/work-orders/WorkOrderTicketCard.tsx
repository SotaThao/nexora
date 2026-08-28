import { ChevronRight, MapPin, Radio, Store } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  WORK_ORDER_STATUS_BADGE_CLASS,
  WORK_ORDER_STATUS_I18N,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  type WorkOrderTicketMock,
} from './constants'
import { formatWorkOrderTime } from './workOrderTickets'

interface WorkOrderTicketCardProps {
  salonName: string
  ticket: WorkOrderTicketMock
  onSelect: () => void
}

export default function WorkOrderTicketCard({ salonName, ticket, onSelect }: WorkOrderTicketCardProps) {
  const { t, currentLanguage } = useTranslation()

  return (
    <button type="button" className={WORK_ORDERS_LAYOUT_CLASS.ticketCard} onClick={onSelect}>
      <span className={WORK_ORDERS_LAYOUT_CLASS.ticketTime}>
        {formatWorkOrderTime(ticket.time, currentLanguage)}
      </span>
      <span className={WORK_ORDERS_LAYOUT_CLASS.grow}>
        <span className={WORK_ORDERS_LAYOUT_CLASS.ticketHeadRow}>
          <span className={WORK_ORDERS_LAYOUT_CLASS.ticketCustomer}>{ticket.customerName}</span>
          <span className={`${WORK_ORDERS_LAYOUT_CLASS.ticketBadge} ${WORK_ORDER_STATUS_BADGE_CLASS[ticket.status]}`}>
            {t(WORK_ORDER_STATUS_I18N[ticket.status])}
          </span>
        </span>
        <span className={WORK_ORDERS_LAYOUT_CLASS.ticketService}>{ticket.serviceName}</span>
        <span className={WORK_ORDERS_LAYOUT_CLASS.ticketMeta}>
          <span className={WORK_ORDERS_LAYOUT_CLASS.metaChip}>
            <Store className={WORK_ORDERS_LAYOUT_CLASS.ticketMetaIcon} aria-hidden="true" />
            <span className={WORK_ORDERS_LAYOUT_CLASS.truncate}>{salonName}</span>
          </span>
          <span className={WORK_ORDERS_LAYOUT_CLASS.metaChip}>
            <MapPin className={WORK_ORDERS_LAYOUT_CLASS.ticketMetaIcon} aria-hidden="true" />
            <span>{t(WORK_ORDERS_I18N.station, { number: ticket.station })}</span>
          </span>
          <span className={WORK_ORDERS_LAYOUT_CLASS.metaChip}>
            <Radio className={WORK_ORDERS_LAYOUT_CLASS.ticketMetaIcon} aria-hidden="true" />
            <span>{t(WORK_ORDERS_I18N.beeper, { code: ticket.beeper })}</span>
          </span>
        </span>
      </span>
      <ChevronRight className={WORK_ORDERS_LAYOUT_CLASS.ticketChevron} aria-hidden="true" />
    </button>
  )
}
