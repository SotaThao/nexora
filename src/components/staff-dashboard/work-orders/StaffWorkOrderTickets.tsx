import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatLocalDateIso } from '../../../utils/localDate'
import {
  WORK_ORDER_FILTER_I18N,
  WORK_ORDER_FILTER_TABS,
  WORK_ORDER_TICKET_FILTER,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  staffWorkOrdersPath,
  workOrderFilterTabClass,
  type WorkOrderSalonMock,
  type WorkOrderTicketFilter,
} from './constants'
import WorkOrderDatePicker from './WorkOrderDatePicker'
import WorkOrderTicketCard from './WorkOrderTicketCard'
import {
  assignedTicketCount,
  filterWorkOrderTickets,
  ticketsForSalon,
} from './workOrderTickets'

interface StaffWorkOrderTicketsProps {
  salon: WorkOrderSalonMock
}

export default function StaffWorkOrderTickets({ salon }: StaffWorkOrderTicketsProps) {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  const todayIso = formatLocalDateIso(new Date())
  const [selectedDateIso, setSelectedDateIso] = useState(todayIso)
  const [filter, setFilter] = useState<WorkOrderTicketFilter>(WORK_ORDER_TICKET_FILTER.Assigned)

  const salonTickets = useMemo(() => ticketsForSalon(salon.id), [salon.id])
  const visibleTickets = useMemo(
    () => filterWorkOrderTickets(salonTickets, filter),
    [filter, salonTickets],
  )
  const assignedCount = useMemo(() => assignedTicketCount(salonTickets), [salonTickets])

  return (
    <div>
      <p className={WORK_ORDERS_LAYOUT_CLASS.breadcrumb}>
        {t(WORK_ORDERS_I18N.breadcrumbWorkspace)}
      </p>
      <div className={WORK_ORDERS_LAYOUT_CLASS.ticketsTitleRow}>
        <h2 className={WORK_ORDERS_LAYOUT_CLASS.ticketsTitle}>
          {t(WORK_ORDERS_I18N.pageTitle)}
        </h2>
        <span className={WORK_ORDERS_LAYOUT_CLASS.countBadge}>{assignedCount}</span>
      </div>
      <p className={WORK_ORDERS_LAYOUT_CLASS.ticketsSalon}>{salon.name}</p>

      <WorkOrderDatePicker
        value={selectedDateIso}
        todayIso={todayIso}
        language={currentLanguage}
        onChange={setSelectedDateIso}
      />

      <div className={WORK_ORDERS_LAYOUT_CLASS.filterBar} role="tablist">
        {WORK_ORDER_FILTER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={tab === filter}
            className={workOrderFilterTabClass(tab === filter)}
            onClick={() => setFilter(tab)}
          >
            {t(WORK_ORDER_FILTER_I18N[tab])}
          </button>
        ))}
      </div>

      <div className={WORK_ORDERS_LAYOUT_CLASS.listMeta}>
        <span>{t(WORK_ORDERS_I18N.ticketCount, { count: visibleTickets.length })}</span>
        <span>{t(WORK_ORDER_FILTER_I18N[filter])}</span>
      </div>

      {visibleTickets.length === 0 ? (
        <p className={WORK_ORDERS_LAYOUT_CLASS.ticketEmpty}>
          {t(WORK_ORDERS_I18N.empty)}
        </p>
      ) : (
        <div className={WORK_ORDERS_LAYOUT_CLASS.ticketList}>
          {visibleTickets.map((ticket) => (
            <WorkOrderTicketCard
              key={ticket.id}
              salonName={salon.name}
              ticket={ticket}
              onSelect={() => navigate(staffWorkOrdersPath(salon.id, ticket.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
