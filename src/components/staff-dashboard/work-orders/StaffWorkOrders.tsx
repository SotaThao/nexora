import { Navigate, useParams } from 'react-router-dom'
import { useStaffBusinesses } from '../../../data/hooks/useStaffSelf'
import { STAFF_SALONS_PATH } from '../staffSalonPaths'
import { StaffWorkOrdersViewKind } from './constants'
import StaffWorkOrderTickets from './StaffWorkOrderTickets'
import { WorkOrderErrorCard } from './WorkOrderQueryFeedback'
import { WorkOrderTicketsSkeleton } from './WorkOrderSkeletons'
import { resolveStaffWorkOrdersView, toWorkOrderSalons } from './workOrderTickets'

export default function StaffWorkOrders() {
  const { salonId, ticketId } = useParams<{ salonId: string; ticketId: string }>()
  const businessesQuery = useStaffBusinesses()

  if (!salonId) return <Navigate to={STAFF_SALONS_PATH} replace />

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
    case StaffWorkOrdersViewKind.Tickets:
      return <StaffWorkOrderTickets salon={view.salon} />
    case StaffWorkOrdersViewKind.Detail:
      return <StaffWorkOrderTickets salon={view.salon} selectedTicketId={view.orderId} />
  }
}
