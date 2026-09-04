import { Navigate, useParams } from 'react-router-dom'
import { useStaffBusinesses } from '../../../data/hooks/useStaffSelf'
import { StaffWorkOrdersViewKind } from './constants'
import StaffWorkOrderSalonPicker from './StaffWorkOrderSalonPicker'
import StaffWorkOrderTickets from './StaffWorkOrderTickets'
import { WorkOrderErrorCard } from './WorkOrderQueryFeedback'
import {
  WorkOrderSalonPickerSkeleton,
  WorkOrderTicketsSkeleton,
} from './WorkOrderSkeletons'
import { resolveStaffWorkOrdersView, toWorkOrderSalons } from './workOrderTickets'

export default function StaffWorkOrders() {
  const { salonId, ticketId } = useParams<{ salonId: string; ticketId: string }>()
  const businessesQuery = useStaffBusinesses()

  if (businessesQuery.isPending) {
    return <WorkOrdersRouteSkeleton salonId={salonId} />
  }
  if (businessesQuery.isError) {
    return <WorkOrderErrorCard onAction={() => void businessesQuery.refetch()} />
  }

  const salons = toWorkOrderSalons(businessesQuery.data)
  const view = resolveStaffWorkOrdersView(salonId, ticketId, salons)

  switch (view.kind) {
    case StaffWorkOrdersViewKind.Picker:
      return <StaffWorkOrderSalonPicker salons={salons} />
    case StaffWorkOrdersViewKind.Redirect:
      return <Navigate to={view.to} replace />
    case StaffWorkOrdersViewKind.Tickets:
      return <StaffWorkOrderTickets salon={view.salon} />
    case StaffWorkOrdersViewKind.Detail:
      return <StaffWorkOrderTickets salon={view.salon} selectedTicketId={view.orderId} />
  }
}

function WorkOrdersRouteSkeleton({ salonId }: { salonId?: string }) {
  if (salonId) return <WorkOrderTicketsSkeleton />
  return <WorkOrderSalonPickerSkeleton />
}
