import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useStaffBusinesses } from '../../../data/hooks/useStaffSelf'
import { StaffWorkOrdersViewKind, staffWorkOrdersPath } from './constants'
import StaffWorkOrderDetail from './StaffWorkOrderDetail'
import StaffWorkOrderSalonPicker from './StaffWorkOrderSalonPicker'
import StaffWorkOrderTickets from './StaffWorkOrderTickets'
import { WorkOrderErrorCard } from './WorkOrderQueryFeedback'
import {
  WorkOrderDetailSkeleton,
  WorkOrderSalonPickerSkeleton,
  WorkOrderTicketsSkeleton,
} from './WorkOrderSkeletons'
import { resolveStaffWorkOrdersView, toWorkOrderSalons } from './workOrderTickets'

export default function StaffWorkOrders() {
  const { salonId, ticketId } = useParams<{ salonId: string; ticketId: string }>()
  const navigate = useNavigate()
  const businessesQuery = useStaffBusinesses()

  if (businessesQuery.isPending) {
    return <WorkOrdersRouteSkeleton salonId={salonId} ticketId={ticketId} />
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
      return (
        <StaffWorkOrderDetail
          orderId={view.orderId}
          onBack={() => navigate(staffWorkOrdersPath(view.salon.id))}
        />
      )
  }
}

function WorkOrdersRouteSkeleton({
  salonId,
  ticketId,
}: {
  salonId?: string
  ticketId?: string
}) {
  if (ticketId) return <WorkOrderDetailSkeleton />
  if (salonId) return <WorkOrderTicketsSkeleton />
  return <WorkOrderSalonPickerSkeleton />
}
