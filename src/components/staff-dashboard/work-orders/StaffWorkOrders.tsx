import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { StaffWorkOrdersViewKind, staffWorkOrdersPath } from './constants'
import StaffWorkOrderDetail from './StaffWorkOrderDetail'
import StaffWorkOrderSalonPicker from './StaffWorkOrderSalonPicker'
import StaffWorkOrderTickets from './StaffWorkOrderTickets'
import { resolveStaffWorkOrdersView } from './workOrderTickets'

export default function StaffWorkOrders() {
  const { salonId, ticketId } = useParams<{ salonId: string; ticketId: string }>()
  const navigate = useNavigate()
  const view = resolveStaffWorkOrdersView(salonId, ticketId)

  switch (view.kind) {
    case StaffWorkOrdersViewKind.Picker:
      return <StaffWorkOrderSalonPicker />
    case StaffWorkOrdersViewKind.Redirect:
      return <Navigate to={view.to} replace />
    case StaffWorkOrdersViewKind.Tickets:
      return <StaffWorkOrderTickets salon={view.salon} />
    case StaffWorkOrdersViewKind.Detail:
      return (
        <StaffWorkOrderDetail
          ticket={view.ticket}
          onBack={() => navigate(staffWorkOrdersPath(view.salon.id))}
        />
      )
  }
}
