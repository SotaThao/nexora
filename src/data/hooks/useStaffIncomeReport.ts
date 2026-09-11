import { useQuery } from '@tanstack/react-query'

import { useSessionRole } from '../../auth/useSessionRole'
import { qk } from '../queryKeys'
import staffIncomeReportRepository from '../repositories/staffIncomeReport'
import type {
  StaffIncomeReportParams,
  StaffIncomeReportResponse,
} from '../repositories/staffIncomeReport'

export function useStaffIncomeReport(
  params: StaffIncomeReportParams,
  { enabled: callerEnabled = true } = {},
) {
  const { isStaff, session } = useSessionRole()
  const sessionId = session?.id ?? 'anonymous'

  return useQuery<StaffIncomeReportResponse>({
    queryKey: qk.staffIncomeReport(sessionId, params),
    queryFn: () => staffIncomeReportRepository.getIncomeReport(params),
    enabled: isStaff && Boolean(session?.id) && callerEnabled,
    retry: false,
  })
}
