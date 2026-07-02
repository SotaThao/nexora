/**
 * useStaffSelf — TanStack Query hooks for the staff self-service domain.
 */
import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, keepPreviousData, type QueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import staffSelfRepository from '../repositories/staffSelf'
import { useSessionRole } from '../../auth/useSessionRole'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import type {
  StaffBusinessLink,
  StaffBusinessTipQr,
  StaffDashboardSummary,
  StaffLinkRequestDetail,
  StaffProfile,
  StaffReviewsPage,
  StaffTipsConfirmReceiptResult,
  StaffTipsPage,
} from '../../types/domain'
import type { StaffTipsListParams } from '../repositories/staffSelf'
import type { TransactionsListQuery } from '../repositories/transactions'
import type { TransactionsListPage } from '../repositories/transactions'
import { useStaffAccount } from '../../contexts/StaffAccountContext'
import { resolveStaffTipQr } from '../../utils/staffTipUrl'
import { getWebUrlOrigin } from '../../utils/webUrlBase'

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

export function useStaffBusinessTipQrs({ enabled: callerEnabled = true } = {}) {
  const { isStaff } = useSessionRole()
  const { account } = useStaffAccount()
  const { data: staffProfile } = useStaffProfile({ enabled: isStaff && callerEnabled })
  const staffProfileId = staffProfile?.id?.trim() || null

  const businessesQuery = useStaffBusinesses({ enabled: isStaff && callerEnabled })

  // Staff tip QRs are generated client-side from the linked businesses
  // (businessSlug + touchPointSlug + staffProfileId). The API spec has no
  // per-staff QR endpoint (GET /staff/business-qr-codes 404s), so we rely
  // solely on resolveStaffTipQr. See US-023.
  const businessTipQrs = useMemo(() => {
    const businesses = businessesQuery.data ?? []
    const origin = getWebUrlOrigin()

    return businesses.map((biz) => {
      const resolved = resolveStaffTipQr(
        biz,
        staffProfileId,
        origin,
        { allowDefaultTouchPointSlug: !biz.touchPointsMissing },
      )
      return {
        businessId: biz.businessId,
        businessName: biz.businessName,
        displayName:
          account.displayNamesByBusiness?.[biz.businessId] || account.defaultDisplayName,
        businessSlug: resolved.businessSlug,
        touchPointSlug: resolved.touchPointSlug,
        tipUrl: biz.touchPointsMissing ? null : resolved.tipUrl,
        qrImageUrl: resolved.qrImageUrl ?? biz.qrImageUrl ?? null,
        linkStatus: biz.linkStatus,
        linkStatusLabel: biz.linkStatusLabel,
        roleLabel: biz.roleLabel,
        roleAtBusiness: biz.roleAtBusiness,
        logoUrl: biz.logoUrl,
        tipLinkIncomplete: Boolean(biz.touchPointsMissing),
      } satisfies StaffBusinessTipQr
    })
  }, [
    businessesQuery.data,
    staffProfileId,
    account.displayNamesByBusiness,
    account.defaultDisplayName,
  ])

  return {
    businessTipQrs,
    isLoading: businessesQuery.isPending,
    isFetching: businessesQuery.isFetching,
  }
}

export function useStaffDashboardSummary({ enabled: callerEnabled = true } = {}) {
  const { isStaff } = useSessionRole()
  return useQuery<StaffDashboardSummary>({
    queryKey: qk.staffDashboardSummary(),
    queryFn: () => staffSelfRepository.getDashboardSummary(),
    enabled: isStaff && callerEnabled,
    refetchOnMount: true,
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
    refetchOnMount: true,
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
    refetchOnMount: true,
  })
}

export function useStaffTransactionsPaginated(
  query: TransactionsListQuery,
  { enabled: callerEnabled = true } = {},
) {
  const { isStaff } = useSessionRole()
  const { data: profile } = useStaffProfile({ enabled: isStaff && callerEnabled })
  const staffDisplayName =
    profile?.displayName?.trim() ||
    profile?.fullName?.trim() ||
    profile?.staffCode?.trim() ||
    'Staff'

  return useQuery<TransactionsListPage>({
    queryKey: qk.staffTransactionsPaginated(query),
    queryFn: () => staffSelfRepository.listTransactionsPaginated(query, staffDisplayName),
    enabled: isStaff && callerEnabled,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useConfirmStaffTipsReceipt() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation<
    StaffTipsConfirmReceiptResult,
    Error,
    string[],
    { previousTips: ReturnType<QueryClient['getQueriesData']> }
  >({
    mutationFn: (tipIds) => staffSelfRepository.confirmTipsReceipt(tipIds),
    onMutate: async (tipIds) => {
      await queryClient.cancelQueries({ queryKey: ['staffTips'] })
      const previousTips = queryClient.getQueriesData<StaffTipsPage>({ queryKey: ['staffTips'] })
      const ids = new Set(tipIds)
      queryClient.setQueriesData<StaffTipsPage>(
        { queryKey: ['staffTips'] },
        (current) => {
          if (!current?.items?.length) return current
          const items = current.items.filter((tip) => !ids.has(tip.id))
          const removed = current.items.length - items.length
          if (removed === 0) return current
          return {
            ...current,
            items,
            totalCount: Math.max(0, (current.totalCount ?? current.items.length) - removed),
          }
        },
      )
      return { previousTips }
    },
    onError: (err, _tipIds, context) => {
      context?.previousTips?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
      showToast(err.message || t('staff_dashboard.home.confirm_failed'), 'error')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['staffTips'] })
      void queryClient.invalidateQueries({ queryKey: ['staffTransactions', 'paginated'] })
      void queryClient.invalidateQueries({ queryKey: qk.staffDashboardSummary() })
    },
    onSuccess: (result) => {
      if (result.failedIds.length > 0) {
        if (result.confirmedCount === 0) {
          showToast(t('staff_dashboard.home.confirm_failed'), 'error')
          return
        }

        showToast(
          t('staff_dashboard.home.confirm_partial', { count: result.confirmedCount }),
          'warning',
        )
        return
      }

      showToast(t('staff_dashboard.home.confirm_success'), 'success')
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
