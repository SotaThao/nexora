import { ChevronLeft, ClipboardX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffWorkOrders } from '../../../data/hooks/useStaffWorkOrders'
import { formatDateIsoInTimeZone } from '../../../utils/localDate'
import { STAFF_SALONS_PATH } from '../staffSalonPaths'
import {
  WORK_ORDER_EMPTY_PLACEHOLDER,
  WORK_ORDER_FILTER_I18N,
  WORK_ORDER_FILTER_STATUSES,
  WORK_ORDER_FILTER_TABS,
  WORK_ORDER_TICKET_FILTER,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  workOrderFilterCountClass,
  workOrderFilterTabClass,
  type WorkOrderListItem,
  type WorkOrderSalon,
  type WorkOrderTicketFilter,
} from './constants'
import { setStaffLastWorkOrderSalonId } from './myTicketsSalonPreference'
import StaffWorkOrderDetail from './StaffWorkOrderDetail'
import WorkOrderDatePicker from './WorkOrderDatePicker'
import { WorkOrderErrorCard } from './WorkOrderQueryFeedback'
import { WorkOrderTicketListSkeleton } from './WorkOrderSkeletons'
import WorkOrderTicketCard from './WorkOrderTicketCard'
import {
  WORK_ORDER_NAVIGATE_REPLACE,
  WORK_ORDER_QUERY_PARAM,
  applyWorkOrderListParams,
  parseWorkOrderListDate,
  parseWorkOrderListStatus,
  workOrderListHref,
  workOrderListParamsNeedSync,
} from './workOrderListUrl'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const todayIso = formatDateIsoInTimeZone(new Date(), salon.timeZone)
  const selectedDateIso = parseWorkOrderListDate(
    searchParams.get(WORK_ORDER_QUERY_PARAM.date),
    todayIso,
  )
  const filter = parseWorkOrderListStatus(searchParams.get(WORK_ORDER_QUERY_PARAM.status))
  const [calendarOpen, setCalendarOpen] = useState(false)
  const listHref = (ticketId?: string) => workOrderListHref(salon.id, selectedDateIso, filter, ticketId)
  const goToSalons = () => navigate(STAFF_SALONS_PATH)
  const workOrdersQuery = useStaffWorkOrders(
    salon.id,
    selectedDateIso,
    WORK_ORDER_FILTER_STATUSES[WORK_ORDER_TICKET_FILTER.All],
  )
  const tickets = workOrdersQuery.data ?? []
  const isListLoading = workOrdersQuery.data === undefined && !workOrdersQuery.isError
  const isDetailMode = Boolean(selectedTicketId)
  const chromeClass = isDetailMode ? WORK_ORDERS_LAYOUT_CLASS.hideOnDetailMobile : ''

  useEffect(() => {
    setStaffLastWorkOrderSalonId(salon.id)
  }, [salon.id])

  useEffect(() => {
    if (!workOrderListParamsNeedSync(searchParams, selectedDateIso, filter)) return
    setSearchParams(
      applyWorkOrderListParams(searchParams, selectedDateIso, filter),
      WORK_ORDER_NAVIGATE_REPLACE,
    )
  }, [filter, searchParams, selectedDateIso, setSearchParams])

  const visibleTickets = useMemo(
    () => sortWorkOrderTicketsByTime(
      tickets.filter((ticket) => workOrderTicketMatchesFilter(ticket.myStatus, filter)),
      salon.timeZone,
    ),
    [filter, salon.timeZone, tickets],
  )

  const updateListParams = (dateIso: string, nextFilter: WorkOrderTicketFilter) => {
    if (selectedTicketId) {
      navigate(workOrderListHref(salon.id, dateIso, nextFilter), WORK_ORDER_NAVIGATE_REPLACE)
      return
    }
    setSearchParams(
      applyWorkOrderListParams(searchParams, dateIso, nextFilter),
      WORK_ORDER_NAVIGATE_REPLACE,
    )
  }

  const featuredTicket = !isListLoading && filter === WORK_ORDER_TICKET_FILTER.Assigned
    ? newestAssignedWorkOrder(visibleTickets)
    : null
  const listTickets = featuredTicket
    ? visibleTickets.filter((ticket) => ticket.id !== featuredTicket.id)
    : visibleTickets
  const openTicket = (ticketId: string) => {
    navigate(listHref(ticketId))
  }

  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.page}>
      <div className={`${WORK_ORDERS_LAYOUT_CLASS.ticketsTitleRow} ${chromeClass}`}>
        <div className={WORK_ORDERS_LAYOUT_CLASS.workspaceSalon}>
          <button
            type="button"
            className={WORK_ORDERS_LAYOUT_CLASS.ticketsBack}
            aria-label={t(WORK_ORDERS_I18N.backToSalons)}
            onClick={goToSalons}
          >
            <ChevronLeft className={WORK_ORDERS_LAYOUT_CLASS.ticketsBackIcon} aria-hidden="true" />
          </button>
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
                aria-label={t(WORK_ORDERS_I18N.changeSalon)}
                onClick={goToSalons}
              >
                {workOrderTextOrPlaceholder(salon.name)}
              </button>
            </p>
          </div>
        </div>
        <span className={WORK_ORDERS_LAYOUT_CLASS.countBadge}>
          {isListLoading ? WORK_ORDER_EMPTY_PLACEHOLDER : visibleTickets.length}
        </span>
      </div>

      <div className={`${WORK_ORDERS_LAYOUT_CLASS.filterBar} ${chromeClass}`}>
        <WorkOrderDatePicker
          value={selectedDateIso}
          todayIso={todayIso}
          language={currentLanguage}
          calendarOpen={calendarOpen}
          onCalendarOpenChange={setCalendarOpen}
          onChange={(iso) => updateListParams(iso, filter)}
        />
        <div className={WORK_ORDERS_LAYOUT_CLASS.statusTabs} role="tablist">
          {WORK_ORDER_FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={tab === filter}
              className={workOrderFilterTabClass(tab, tab === filter)}
              onClick={() => updateListParams(selectedDateIso, tab)}
            >
              <span>{t(WORK_ORDER_FILTER_I18N[tab])}</span>
              <span className={workOrderFilterCountClass(tab)}>
                {isListLoading ? WORK_ORDER_EMPTY_PLACEHOLDER : countWorkOrdersByFilter(tickets, tab)}
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
            {isListLoading
              ? t(WORK_ORDERS_I18N.loading)
              : featuredTicket
                ? t(WORK_ORDERS_I18N.upNext)
                : t(WORK_ORDERS_I18N.ticketCount, { count: visibleTickets.length })}
          </h2>
        </div>
        <WorkOrderTicketResults
          isLoading={isListLoading}
          isError={workOrdersQuery.isError}
          tickets={listTickets}
          timeZone={salon.timeZone}
          selectedTicketId={selectedTicketId}
          hasFeatured={Boolean(featuredTicket)}
          onRetry={() => void workOrdersQuery.refetch()}
          onSelect={openTicket}
        />
      </section>

      {selectedTicketId ? (
        <StaffWorkOrderDetail
          orderId={selectedTicketId}
          timeZone={salon.timeZone}
          onBack={() => navigate(listHref())}
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
      <button type="button" className={WORK_ORDERS_LAYOUT_CLASS.featuredButton} onClick={onSelect}>
        {t(WORK_ORDERS_I18N.viewTicket)}
      </button>
    </article>
  )
}

function WorkOrderTicketResults({
  isLoading,
  isError,
  tickets,
  timeZone,
  selectedTicketId,
  hasFeatured,
  onRetry,
  onSelect,
}: {
  isLoading: boolean
  isError: boolean
  tickets: WorkOrderListItem[]
  timeZone?: string | null
  selectedTicketId?: string
  hasFeatured: boolean
  onRetry: () => void
  onSelect: (ticketId: string) => void
}) {
  const { t } = useTranslation()

  if (isLoading) return <WorkOrderTicketListSkeleton />
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
          timeZone={timeZone}
          isActive={ticket.id === selectedTicketId}
          onSelect={() => onSelect(ticket.id)}
        />
      ))}
    </div>
  )
}
