import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffWorkOrders } from '../../../data/hooks/useStaffWorkOrders'
import { formatDateIsoInTimeZone } from '../../../utils/localDate'
import {
  WORK_ORDER_FILTER_I18N,
  WORK_ORDER_FILTER_STATUSES,
  WORK_ORDER_FILTER_TABS,
  WORK_ORDER_TICKET_FILTER,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  staffWorkOrdersPath,
  workOrderFilterTabClass,
  type WorkOrderListItem,
  type WorkOrderSalon,
  type WorkOrderTicketFilter,
} from './constants'
import WorkOrderDatePicker from './WorkOrderDatePicker'
import { WorkOrderErrorCard } from './WorkOrderQueryFeedback'
import { WorkOrderTicketListSkeleton } from './WorkOrderSkeletons'
import WorkOrderTicketCard from './WorkOrderTicketCard'
import WorkOrderWorkspaceBack from './WorkOrderWorkspaceBack'

interface StaffWorkOrderTicketsProps {
  salon: WorkOrderSalon
}

export default function StaffWorkOrderTickets({
  salon,
}: StaffWorkOrderTicketsProps) {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  const todayIso = formatDateIsoInTimeZone(new Date(), salon.timeZone)
  const [selectedDateIso, setSelectedDateIso] = useState(todayIso)
  const [filter, setFilter] = useState<WorkOrderTicketFilter>(WORK_ORDER_TICKET_FILTER.Assigned)
  const workOrdersQuery = useStaffWorkOrders(
    salon.id,
    selectedDateIso,
    WORK_ORDER_FILTER_STATUSES[filter],
  )
  const tickets = workOrdersQuery.data ?? []

  return (
    <div>
      <WorkOrderWorkspaceBack onBack={() => navigate(staffWorkOrdersPath())} />
      <div className={WORK_ORDERS_LAYOUT_CLASS.ticketsTitleRow}>
        <h2 className={WORK_ORDERS_LAYOUT_CLASS.ticketsTitle}>
          {t(WORK_ORDERS_I18N.pageTitle)}
        </h2>
        <span className={WORK_ORDERS_LAYOUT_CLASS.countBadge}>{tickets.length}</span>
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
        <span>{t(WORK_ORDERS_I18N.ticketCount, { count: tickets.length })}</span>
        <span>{t(WORK_ORDER_FILTER_I18N[filter])}</span>
      </div>

      <WorkOrderTicketResults
        isPending={workOrdersQuery.isPending}
        isError={workOrdersQuery.isError}
        tickets={tickets}
        salonName={salon.name}
        onRetry={() => void workOrdersQuery.refetch()}
        onSelect={(ticketId) => navigate(staffWorkOrdersPath(salon.id, ticketId))}
      />
    </div>
  )
}

function WorkOrderTicketResults({
  isPending,
  isError,
  tickets,
  salonName,
  onRetry,
  onSelect,
}: {
  isPending: boolean
  isError: boolean
  tickets: WorkOrderListItem[]
  salonName: string
  onRetry: () => void
  onSelect: (ticketId: string) => void
}) {
  const { t } = useTranslation()

  if (isPending && tickets.length === 0) return <WorkOrderTicketListSkeleton />
  if (isError) return <WorkOrderErrorCard onAction={onRetry} />
  if (tickets.length === 0) {
    return <p className={WORK_ORDERS_LAYOUT_CLASS.ticketEmpty}>{t(WORK_ORDERS_I18N.empty)}</p>
  }

  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.ticketList}>
      {tickets.map((ticket) => (
        <WorkOrderTicketCard
          key={ticket.id}
          salonName={salonName}
          ticket={ticket}
          onSelect={() => onSelect(ticket.id)}
        />
      ))}
    </div>
  )
}
