// StaffFrontDesk — thin wrapper reading :businessId from the route so Staff can
// reuse the same PosFrontDeskView the Owner dashboard uses (US-12). Access itself
// is enforced server-side (IPosOperationsAccessService); StaffMySalons only links
// here for a business where usePosAccess already reported canManageOperations.
import { useParams } from 'react-router-dom'
import PosFrontDeskView from '../../dashboard/views/pos/PosFrontDeskView'

export default function StaffFrontDesk() {
  const { businessId } = useParams<{ businessId: string }>()
  if (!businessId) return null
  return <PosFrontDeskView businessId={businessId} includeTechnicianReportTab />
}
