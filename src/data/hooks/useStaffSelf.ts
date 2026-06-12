/**
 * useStaffSelf — TanStack Query hooks for the staff self-service domain.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import staffSelfRepository from '../repositories/staffSelf'
import { useSessionRole } from '../../auth/useSessionRole'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import type {
  StaffBusinessLink,
  StaffDashboardSummary,
  StaffLinkRequestDetail,
  StaffProfile,
  StaffReviewsPage,
  StaffTipsConfirmReceiptResult,
  StaffTipsPage,
} from '../../types/domain'
import type { StaffTipsListParams } from '../repositories/staffSelf'

export function useStaffProfile({ enabled: callerEnabled = true } = {}) {
  const queryClient = useQueryClient()
  const { isStaff } = useSessionRole()
  const hasCachedProfile = queryClient.getQueryData(qk.staffProfile()) !== undefined

  return useQuery<StaffProfile | null>({
    queryKey: qk.staffProfile(),
    queryFn: () => staffSelfRepository.getMyProfile(),
    enabled: isStaff && callerEnabled && !hasCachedProfile,
    initialData: () => queryClient.getQueryData<StaffProfile | null>(qk.staffProfile()),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useStaffBusinesses({ enabled: callerEnabled = true } = {}) {
  const { isStaff } = useSessionRole()
  return useQuery<StaffBusinessLink[]>({
    queryKey: qk.staffBusinesses(),
    queryFn: () => staffSelfRepository.getMyBusinesses(),
    enabled: isStaff && callerEnabled,
  })
}

export function useStaffDashboardSummary({ enabled: callerEnabled = true } = {}) {
  const { isStaff } = useSessionRole()
  return useQuery<StaffDashboardSummary>({
    queryKey: qk.staffDashboardSummary(),
    queryFn: () => staffSelfRepository.getDashboardSummary(),
    enabled: isStaff && callerEnabled,
  })
}

export function useStaffReviews({
  pageNumber = 1,
  pageSize = 20,
  enabled: callerEnabled = true,
} = {}) {
  const { isStaff } = useSessionRole()
  return useQuery<StaffReviewsPage>({
    queryKey: qk.staffReviews({ pageNumber, pageSize }),
    queryFn: () => staffSelfRepository.getReviews({ pageNumber, pageSize }),
    enabled: isStaff && callerEnabled,
  })
}

export function useStaffTips({
  pageNumber = 1,
  pageSize = 20,
  dateFrom,
  dateTo,
  status,
  enabled: callerEnabled = true,
}: StaffTipsListParams & { enabled?: boolean } = {}) {
  const { isStaff } = useSessionRole()
  const filters = { pageNumber, pageSize, dateFrom, dateTo, status }

  return useQuery<StaffTipsPage>({
    queryKey: qk.staffTips(filters),
    queryFn: () => staffSelfRepository.getTips(filters),
    enabled: isStaff && callerEnabled,
  })
}

export function useConfirmStaffTipsReceipt() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation<StaffTipsConfirmReceiptResult, Error, string[]>({
    mutationFn: (tipIds) => staffSelfRepository.confirmTipsReceipt(tipIds),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['staffTips'] })
      queryClient.invalidateQueries({ queryKey: qk.staffDashboardSummary() })

      if (result.failedIds.length > 0) {
        showToast(
          t('staff_dashboard.home.confirm_partial', { count: result.confirmedCount }),
          'warning',
        )
        return
      }

      showToast(t('staff_dashboard.home.confirm_success'), 'success')
    },
    onError: (err) => {
      showToast(err.message || t('staff_dashboard.home.confirm_failed'), 'error')
    },
  })
}

export function useStaffLinkRequest(linkId: string | null | undefined, { enabled = true } = {}) {
  return useQuery<StaffLinkRequestDetail>({
    queryKey: qk.staffLinkRequest(linkId),
    queryFn: () => staffSelfRepository.getLinkRequest(linkId || ''),
    enabled: enabled && !!linkId,
  })
}

export function useAcceptStaffLinkRequest() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (linkId) => staffSelfRepository.acceptLinkRequest(linkId),
    onSuccess: (_data, linkId) => {
      queryClient.invalidateQueries({ queryKey: qk.staffLinkRequest(linkId) })
      queryClient.invalidateQueries({ queryKey: qk.staffBusinesses() })
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
      queryClient.invalidateQueries({ queryKey: qk.notificationsUnreadCount() })
    },
  })
}

export function useRejectStaffLinkRequest() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (linkId) => staffSelfRepository.rejectLinkRequest(linkId),
    onSuccess: (_data, linkId) => {
      queryClient.invalidateQueries({ queryKey: qk.staffLinkRequest(linkId) })
      queryClient.invalidateQueries({ queryKey: qk.staffBusinesses() })
      queryClient.invalidateQueries({ queryKey: qk.notifications() })
      queryClient.invalidateQueries({ queryKey: qk.notificationsUnreadCount() })
    },
  })
}
