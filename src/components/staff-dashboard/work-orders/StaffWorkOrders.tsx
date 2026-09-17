import { Navigate, useParams } from 'react-router-dom'
import { useStaffBusinesses } from '../../../data/hooks/useStaffSelf'
import { STAFF_SALONS_PATH } from '../staffSalonPaths'
import { StaffWorkOrdersViewKind } from './constants'
import StaffWorkOrderTickets from './StaffWorkOrderTickets'
import { WorkOrderErrorCard } from './WorkOrderQueryFeedback'
import { WorkOrderTicketsSkeleton } from './WorkOrderSkeletons'
import { useMyTicketsEntryTarget } from './useMyTicketsEntryTarget'
import { resolveStaffWorkOrdersView, toWorkOrderSalons } from './workOrderTickets'

function StaffMyTicketsEntryRedirect({
  salons,
}: {
  salons: ReturnType<typeof toWorkOrderSalons>
}) {
  const { target, isPending } = useMyTicketsEntryTarget(salons)

  if (!salons.length) {
    return <Navigate to={STAFF_SALONS_PATH} replace />
  }
  if (isPending) return <WorkOrderTicketsSkeleton />
  if (!target) {
    return <Navigate to={STAFF_SALONS_PATH} replace />
  }
  return <Navigate to={target.href} replace />
}

export default function StaffWorkOrders() {
  const { salonId, ticketId } = useParams<{ salonId: string; ticketId: string }>()
  const businessesQuery = useStaffBusinesses()

  if (businessesQuery.isPending) {
    return <WorkOrderTicketsSkeleton />
  }
  if (businessesQuery.isError) {
    return <WorkOrderErrorCard onAction={() => void businessesQuery.refetch()} />
  }

  const salons = toWorkOrderSalons(businessesQuery.data)
  const view = resolveStaffWorkOrdersView(salonId, ticketId, salons)

  switch (view.kind) {
    case StaffWorkOrdersViewKind.Redirect:
      return <Navigate to={view.to} replace />
    case StaffWorkOrdersViewKind.Entry:
      return <StaffMyTicketsEntryRedirect salons={view.salons} />
    case StaffWorkOrdersViewKind.Tickets:
      return <StaffWorkOrderTickets salon={view.salon} />
    case StaffWorkOrdersViewKind.Detail:
      return <StaffWorkOrderTickets salon={view.salon} selectedTicketId={view.orderId} />
  }
}
