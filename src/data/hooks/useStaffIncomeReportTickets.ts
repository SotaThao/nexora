import { useQuery } from '@tanstack/react-query'

import { useSessionRole } from '../../auth/useSessionRole'
import { qk } from '../queryKeys'
import staffIncomeReportRepository from '../repositories/staffIncomeReport'
import type {
  StaffIncomeReportTicketsParams,
  StaffIncomeReportTicketsResponse,
} from '../repositories/staffIncomeReport'

export function useStaffIncomeReportTickets(
  params: StaffIncomeReportTicketsParams,
  { enabled: callerEnabled = true } = {},
) {
  const { isStaff, session } = useSessionRole()
  const sessionId = session?.id ?? 'anonymous'

  return useQuery<StaffIncomeReportTicketsResponse>({
    queryKey: qk.staffIncomeReportTickets(sessionId, params),
    queryFn: () => staffIncomeReportRepository.getIncomeReportTickets(params),
    enabled: isStaff && Boolean(session?.id) && callerEnabled,
    retry: false,
  })
}
