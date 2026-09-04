import { useTranslation } from '../../../contexts/LanguageContext'
import {
  WORK_ORDER_EMPTY_PLACEHOLDER,
  WORK_ORDER_STATUS_BADGE_VARIANT,
  WORK_ORDER_STATUS_I18N,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  workOrderStatusClass,
  workOrderTicketCardClass,
  type WorkOrderListItem,
} from './constants'
import {
  formatWorkOrderStationValue,
  formatWorkOrderTicketClock,
  workOrderPrimaryServiceName,
  workOrderTextOrPlaceholder,
} from './workOrderTickets'

interface WorkOrderTicketCardProps {
  ticket: WorkOrderListItem
  isActive?: boolean
  onSelect: () => void
}

export default function WorkOrderTicketCard({ ticket, isActive = false, onSelect }: WorkOrderTicketCardProps) {
  const { t, currentLanguage } = useTranslation()
  const clock = formatWorkOrderTicketClock(ticket, currentLanguage)

  return (
    <button type="button" className={workOrderTicketCardClass(isActive)} onClick={onSelect}>
      <span className={WORK_ORDERS_LAYOUT_CLASS.ticketCardTop}>
        <span className={WORK_ORDERS_LAYOUT_CLASS.ticketTime}>
          <strong className={WORK_ORDERS_LAYOUT_CLASS.ticketTimeValue}>{clock.value}</strong>
          <small className={WORK_ORDERS_LAYOUT_CLASS.ticketTimePeriod}>{clock.period}</small>
        </span>
        <span className={WORK_ORDERS_LAYOUT_CLASS.grow}>
          <span className={WORK_ORDERS_LAYOUT_CLASS.ticketCustomer}>
            {workOrderTextOrPlaceholder(ticket.customerName)}
            {' · '}
            {workOrderPrimaryServiceName(ticket.serviceNames)}
          </span>
          <span className={WORK_ORDERS_LAYOUT_CLASS.ticketService}>
            {t(WORK_ORDERS_I18N.durationStation, {
              duration: t(WORK_ORDERS_I18N.durationMinutes, { minutes: WORK_ORDER_EMPTY_PLACEHOLDER }),
              station: formatWorkOrderStationValue(ticket.stationNumber),
            })}
          </span>
        </span>
        <span className={workOrderStatusClass(ticket.status, WORK_ORDER_STATUS_BADGE_VARIANT.ticket)}>
          {t(WORK_ORDER_STATUS_I18N[ticket.status])}
        </span>
      </span>
    </button>
  )
}
