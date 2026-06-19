/**
 * useStaffSelf — TanStack Query hooks for the staff self-service domain.
 */
import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  const qrCodesQuery = useQuery<StaffBusinessTipQr[] | null>({
    queryKey: [...qk.staffBusinessQrCodes(), staffProfileId],
    queryFn: () => staffSelfRepository.getMyBusinessQrCodes(staffProfileId),
    enabled: isStaff && callerEnabled,
  })

  const businessTipQrs = useMemo(() => {
    const businesses = businessesQuery.data ?? []
    const dedicatedQr = qrCodesQuery.data
    const origin = getWebUrlOrigin()

    if (dedicatedQr?.length) {
      const byBusinessId = new Map(dedicatedQr.map((item) => [item.businessId, item]))
      return businesses.map((biz) => {
        const fromApi = byBusinessId.get(biz.businessId)
        if (fromApi) {
          return {
            ...fromApi,
            displayName:
              fromApi.displayName ||
              account.displayNamesByBusiness?.[biz.businessId] ||
              account.defaultDisplayName,
          }
        }

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
          logoUrl: biz.logoUrl,
          tipLinkIncomplete: Boolean(biz.touchPointsMissing),
        } satisfies StaffBusinessTipQr
      })
    }

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
        logoUrl: biz.logoUrl,
        tipLinkIncomplete: Boolean(biz.touchPointsMissing),
      } satisfies StaffBusinessTipQr
    })
  }, [
    businessesQuery.data,
    qrCodesQuery.data,
    staffProfileId,
    account.displayNamesByBusiness,
    account.defaultDisplayName,
  ])

  return {
    businessTipQrs,
    isLoading: businessesQuery.isPending || qrCodesQuery.isPending,
    isFetching: businessesQuery.isFetching || qrCodesQuery.isFetching,
  }
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
