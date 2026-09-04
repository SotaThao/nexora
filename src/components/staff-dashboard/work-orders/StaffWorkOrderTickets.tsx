import { ClipboardX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffWorkOrders } from '../../../data/hooks/useStaffWorkOrders'
import { formatLocalDateIso } from '../../../utils/localDate'
import { STAFF_SALONS_PATH } from '../staffSalonPaths'
import {
  WORK_ORDER_EMPTY_PLACEHOLDER,
  WORK_ORDER_FILTER_I18N,
  WORK_ORDER_FILTER_STATUSES,
  WORK_ORDER_FILTER_TABS,
  WORK_ORDER_TICKET_FILTER,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  staffWorkOrdersPath,
  workOrderFilterCountClass,
  workOrderFilterTabClass,
  type WorkOrderListItem,
  type WorkOrderSalon,
  type WorkOrderTicketFilter,
} from './constants'
import StaffWorkOrderDetail from './StaffWorkOrderDetail'
import WorkOrderDatePicker from './WorkOrderDatePicker'
import { WorkOrderErrorCard } from './WorkOrderQueryFeedback'
import { WorkOrderTicketListSkeleton } from './WorkOrderSkeletons'
import WorkOrderTicketCard from './WorkOrderTicketCard'
import {
  countWorkOrdersByFilter,
  formatWorkOrderNumber,
  joinWorkOrderServiceNames,
  newestAssignedWorkOrder,
  sortWorkOrderTicketsByTime,
  workOrderTextOrPlaceholder,
  workOrderTicketMatchesFilter,
} from './workOrderTickets'

interface StaffWorkOrderTicketsProps {
  salon: WorkOrderSalon
  selectedTicketId?: string
}

export default function StaffWorkOrderTickets({
  salon,
  selectedTicketId,
}: StaffWorkOrderTicketsProps) {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const fromSalons = (location.state as { from?: string } | null)?.from === STAFF_SALONS_PATH
  const todayIso = formatLocalDateIso(new Date())
  const [selectedDateIso, setSelectedDateIso] = useState(todayIso)
  const [filter, setFilter] = useState<WorkOrderTicketFilter>(WORK_ORDER_TICKET_FILTER.Assigned)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const workOrdersQuery = useStaffWorkOrders(
    salon.id,
    selectedDateIso,
    WORK_ORDER_FILTER_STATUSES[WORK_ORDER_TICKET_FILTER.All],
  )
  const tickets = workOrdersQuery.data ?? []
  const isDetailMode = Boolean(selectedTicketId)
  const chromeClass = isDetailMode ? WORK_ORDERS_LAYOUT_CLASS.hideOnDetailMobile : ''
  const changeSalonPath = fromSalons ? STAFF_SALONS_PATH : staffWorkOrdersPath()

  const visibleTickets = useMemo(
    () => sortWorkOrderTicketsByTime(
      tickets.filter((ticket) => workOrderTicketMatchesFilter(ticket.status, filter)),
    ),
    [filter, tickets],
  )
  const featuredTicket = filter === WORK_ORDER_TICKET_FILTER.Assigned
    ? newestAssignedWorkOrder(visibleTickets)
    : null
  const listTickets = featuredTicket
    ? visibleTickets.filter((ticket) => ticket.id !== featuredTicket.id)
    : visibleTickets
  const openTicket = (ticketId: string) => {
    navigate(staffWorkOrdersPath(salon.id, ticketId), { state: location.state })
  }

  return (
    <div className="w-full">
      <div className={`${WORK_ORDERS_LAYOUT_CLASS.ticketsTitleRow} ${chromeClass}`}>
        <div className={WORK_ORDERS_LAYOUT_CLASS.workspaceSalon}>
          <div className={WORK_ORDERS_LAYOUT_CLASS.grow}>
            <p className={WORK_ORDERS_LAYOUT_CLASS.workspaceKicker}>
              {t(WORK_ORDERS_I18N.breadcrumbWorkspace)}
            </p>
            <h1 className={WORK_ORDERS_LAYOUT_CLASS.ticketsTitle}>
              {t(WORK_ORDERS_I18N.pageTitle)}
            </h1>
            <p className={WORK_ORDERS_LAYOUT_CLASS.ticketsSalon}>
              <button
                type="button"
                className={WORK_ORDERS_LAYOUT_CLASS.workspaceSalonButton}
                onClick={() => navigate(changeSalonPath)}
              >
                {workOrderTextOrPlaceholder(salon.name)}
              </button>
            </p>
          </div>
        </div>
        <span className={WORK_ORDERS_LAYOUT_CLASS.countBadge}>{visibleTickets.length}</span>
      </div>

      <div className={`${WORK_ORDERS_LAYOUT_CLASS.filterBar} ${chromeClass}`}>
        <WorkOrderDatePicker
          value={selectedDateIso}
          todayIso={todayIso}
          language={currentLanguage}
          calendarOpen={calendarOpen}
          onCalendarOpenChange={setCalendarOpen}
          onChange={(iso) => {
            setSelectedDateIso(iso)
            if (selectedTicketId) navigate(staffWorkOrdersPath(salon.id), { state: location.state })
          }}
        />
        <div className={WORK_ORDERS_LAYOUT_CLASS.statusTabs} role="tablist">
          {WORK_ORDER_FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={tab === filter}
              className={workOrderFilterTabClass(tab, tab === filter)}
              onClick={() => {
                setFilter(tab)
                if (selectedTicketId) navigate(staffWorkOrdersPath(salon.id), { state: location.state })
              }}
            >
              <span>{t(WORK_ORDER_FILTER_I18N[tab])}</span>
              <span className={workOrderFilterCountClass(tab)}>
                {countWorkOrdersByFilter(tickets, tab)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <section className={`${WORK_ORDERS_LAYOUT_CLASS.ordersPanel} ${chromeClass}`} aria-label={t(WORK_ORDERS_I18N.pageTitle)}>
        {featuredTicket ? (
          <div className={WORK_ORDERS_LAYOUT_CLASS.featuredSlot}>
            <WorkOrderFeaturedTicket ticket={featuredTicket} onSelect={() => openTicket(featuredTicket.id)} />
          </div>
        ) : null}
        <div className={WORK_ORDERS_LAYOUT_CLASS.ordersPanelHead}>
          <h2 className={WORK_ORDERS_LAYOUT_CLASS.ordersPanelTitle}>
            {featuredTicket
              ? t(WORK_ORDERS_I18N.upNext)
              : t(WORK_ORDERS_I18N.ticketCount, { count: visibleTickets.length })}
          </h2>
          <button
            type="button"
            className={WORK_ORDERS_LAYOUT_CLASS.viewCalendar}
            onClick={() => setCalendarOpen(true)}
          >
            {t(WORK_ORDERS_I18N.viewCalendar)}
          </button>
        </div>
        <WorkOrderTicketResults
          isPending={workOrdersQuery.isPending}
          isError={workOrdersQuery.isError}
          tickets={listTickets}
          selectedTicketId={selectedTicketId}
          hasFeatured={Boolean(featuredTicket)}
          onRetry={() => void workOrdersQuery.refetch()}
          onSelect={openTicket}
        />
      </section>

      {selectedTicketId ? (
        <StaffWorkOrderDetail
          orderId={selectedTicketId}
          onBack={() => navigate(staffWorkOrdersPath(salon.id), { state: location.state })}
        />
      ) : null}
    </div>
  )
}

function WorkOrderFeaturedTicket({
  ticket,
  onSelect,
}: {
  ticket: WorkOrderListItem
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const services = workOrderTextOrPlaceholder(joinWorkOrderServiceNames(ticket.serviceNames))

  return (
    <article className={WORK_ORDERS_LAYOUT_CLASS.featuredCard}>
      <div className={WORK_ORDERS_LAYOUT_CLASS.featuredTop}>
        <span className={WORK_ORDERS_LAYOUT_CLASS.featuredEyebrow}>{t(WORK_ORDERS_I18N.newAssignment)}</span>
        <span className={WORK_ORDERS_LAYOUT_CLASS.featuredStatus}>{t(WORK_ORDERS_I18N.statusAssigned)}</span>
      </div>
      <h2 className={WORK_ORDERS_LAYOUT_CLASS.featuredTitle}>
        {t(WORK_ORDERS_I18N.featuredTicket, {
          code: formatWorkOrderNumber(ticket.orderNumber),
          customer: workOrderTextOrPlaceholder(ticket.customerName),
        })}
      </h2>
      <p className={WORK_ORDERS_LAYOUT_CLASS.featuredService}>
        {services}
        {' · '}
        {WORK_ORDER_EMPTY_PLACEHOLDER}
      </p>
      <p className={WORK_ORDERS_LAYOUT_CLASS.featuredNote}>
        “{WORK_ORDER_EMPTY_PLACEHOLDER}”
      </p>
      <button type="button" className={WORK_ORDERS_LAYOUT_CLASS.featuredButton} onClick={onSelect}>
        {t(WORK_ORDERS_I18N.viewTicket)}
      </button>
    </article>
  )
}

function WorkOrderTicketResults({
  isPending,
  isError,
  tickets,
  selectedTicketId,
  hasFeatured,
  onRetry,
  onSelect,
}: {
  isPending: boolean
  isError: boolean
  tickets: WorkOrderListItem[]
  selectedTicketId?: string
  hasFeatured: boolean
  onRetry: () => void
  onSelect: (ticketId: string) => void
}) {
  const { t } = useTranslation()

  if (isPending && tickets.length === 0 && !hasFeatured) return <WorkOrderTicketListSkeleton />
  if (isError) return <WorkOrderErrorCard onAction={onRetry} />
  if (tickets.length === 0) {
    return (
      <div className={WORK_ORDERS_LAYOUT_CLASS.ticketEmpty}>
        {hasFeatured ? null : (
          <ClipboardX className={WORK_ORDERS_LAYOUT_CLASS.emptyIcon} aria-hidden="true" />
        )}
        <strong className={WORK_ORDERS_LAYOUT_CLASS.emptyTitle}>
          {t(hasFeatured ? WORK_ORDERS_I18N.emptyMoreTitle : WORK_ORDERS_I18N.emptyTitle)}
        </strong>
        <span className={WORK_ORDERS_LAYOUT_CLASS.emptyBody}>
          {t(hasFeatured ? WORK_ORDERS_I18N.emptyMoreHint : WORK_ORDERS_I18N.emptyHint)}
        </span>
      </div>
    )
  }

  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.ticketList}>
      {tickets.map((ticket) => (
        <WorkOrderTicketCard
          key={ticket.id}
          ticket={ticket}
          isActive={ticket.id === selectedTicketId}
          onSelect={() => onSelect(ticket.id)}
        />
      ))}
    </div>
  )
}
