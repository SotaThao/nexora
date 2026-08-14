import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import {
  type MerchantVoiceBusinessStaffFilter,
  type CreateMerchantVoiceStaffRequest,
  type UpdateMerchantVoiceStaffRequest,
  merchantVoiceRepository,
  type MerchantVoiceBusinessStaffDto,
  type MerchantVoiceConfigDto,
  type UpdateMerchantVoiceConfigRequest,
  type MerchantVoiceHolidayDto,
  type CreateMerchantVoiceHolidayRequest,
  type UpdateMerchantVoiceHolidayRequest,
  type MerchantVoiceServiceCategoryDto,
  type MerchantVoiceServiceDto,
  type CreateMerchantVoiceServiceCategoryRequest,
  type UpdateMerchantVoiceServiceCategoryRequest,
  type CreateMerchantVoiceServiceRequest,
  type UpdateMerchantVoiceServiceRequest,
  MerchantVoiceLeadStatus,
  MerchantVoiceStaffStatus,
  type CreateMerchantVoiceBookingRequest,
  type CreateMerchantVoiceBookingResultDto,
  type MerchantVoiceBookingsFilter,
  type MerchantVoiceBookingsResponse,
  type MerchantVoiceBookingStatisticsDto,
  type MerchantVoiceCallsFilter,
  type MerchantVoiceCallsResponse,
  type MerchantVoiceCallStatisticsDto,
  type MerchantVoiceCustomersFilter,
  type MerchantVoiceCustomersResponse,
  type MerchantVoiceCustomerGroupSummaryDto,
  type CreateMerchantVoiceCustomerRequest,
  type MerchantVoiceCustomerDto,
  type UpdateMerchantVoiceCustomerRequest,
  type MerchantVoiceStaffFilter,
  type MerchantVoiceStaffResponse,
  type MerchantVoiceTenantDto,
  type MerchantVoiceTenantStatusDto,
  type VoiceCreditWalletDto,
  type MerchantVoiceUsageActivityFilter,
  type MerchantVoiceUsageActivityResponse,
} from '../repositories/merchantVoice'

const EMPTY_FILTERS: MerchantVoiceBookingsFilter = {}

export function useMerchantVoiceTenantStatus({ enabled = true } = {}) {
  return useQuery<MerchantVoiceTenantStatusDto>({
    queryKey: qk.merchantVoiceTenantStatus(),
    queryFn: () => merchantVoiceRepository.getTenantStatus(),
    enabled,
  })
}

/**
 * Refetch tenant status until `hasVoiceTenant` is true (or attempts exhausted).
 * After VoiceAI plan Paid, AI Hub / sidebar re-render with all tabs — no page reload.
 */
export async function refetchVoiceTenantUntilReady(
  queryClient: QueryClient,
  {
    maxAttempts = 8,
    intervalMs = 750,
  }: { maxAttempts?: number; intervalMs?: number } = {},
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await queryClient.fetchQuery({
      queryKey: qk.merchantVoiceTenantStatus(),
      queryFn: () => merchantVoiceRepository.getTenantStatus(),
      staleTime: 0,
    })
    if (status.hasVoiceTenant) return true
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, intervalMs)
      })
    }
  }
  return false
}

export function useMerchantVoiceMyTenant({ enabled = true } = {}) {
  return useQuery<MerchantVoiceTenantDto>({
    queryKey: qk.merchantVoiceMyTenant(),
    queryFn: () => merchantVoiceRepository.getMyTenant(),
    enabled,
  })
}

/** Loads tenant identity only after `GET /tenant/status` confirms a voice tenant exists. */
export function useMerchantVoiceTenantIdentity() {
  const status = useMerchantVoiceTenantStatus()
  return useMerchantVoiceMyTenant({
    enabled: status.data?.hasVoiceTenant === true,
  })
}

export function useMerchantVoiceBookingStatistics(
  { enabled = true, refetchInterval = false as number | false } = {},
) {
  return useQuery<MerchantVoiceBookingStatisticsDto>({
    queryKey: qk.merchantVoiceBookingStatistics(),
    queryFn: () => merchantVoiceRepository.getBookingStatistics(),
    enabled,
    refetchInterval,
    refetchIntervalInBackground: false,
  })
}

export function useMerchantVoiceBookings(
  filters: MerchantVoiceBookingsFilter = EMPTY_FILTERS,
  { enabled = true, refetchInterval = false as number | false } = {},
) {
  return useQuery<MerchantVoiceBookingsResponse>({
    queryKey: qk.merchantVoiceBookings(filters),
    queryFn: () => merchantVoiceRepository.getBookings(filters),
    enabled,
    refetchInterval,
    refetchIntervalInBackground: false,
  })
}

/** Full list collect for client-side status-filter paging (no BE Status on GET /bookings). */
export function useMerchantVoiceBookingsCollected(
  filters: Omit<MerchantVoiceBookingsFilter, 'pageNumber' | 'pageSize'> = EMPTY_FILTERS,
  { enabled = true, refetchInterval = false as number | false } = {},
) {
  return useQuery<MerchantVoiceBookingsResponse>({
    queryKey: qk.merchantVoiceBookingsCollected(filters),
    queryFn: () => merchantVoiceRepository.getBookingsCollected(filters),
    enabled,
    refetchInterval,
    refetchIntervalInBackground: false,
  })
}

export function useUpdateMerchantVoiceBookingStatus() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: string; status: MerchantVoiceLeadStatus.Done | MerchantVoiceLeadStatus.NoShow }>({
    mutationFn: ({ id, status }) => merchantVoiceRepository.updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchantVoice', 'bookings'] })
    },
  })
}

export function useCreateMerchantVoiceBooking() {
  const queryClient = useQueryClient()

  return useMutation<CreateMerchantVoiceBookingResultDto, Error, CreateMerchantVoiceBookingRequest>({
    mutationFn: (body) => merchantVoiceRepository.createBooking(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchantVoice', 'bookings'] })
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceBookingStatistics() })
    },
  })
}

export function useSendMerchantVoiceBookingConfirmationSms() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => merchantVoiceRepository.sendBookingConfirmationSms(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchantVoice', 'bookings'] })
    },
  })
}

const EMPTY_STAFF_FILTERS: MerchantVoiceStaffFilter = {}

export function useMerchantVoiceStaff(
  filters: MerchantVoiceStaffFilter = EMPTY_STAFF_FILTERS,
  { enabled = true } = {},
) {
  return useQuery<MerchantVoiceStaffResponse>({
    queryKey: qk.merchantVoiceStaff(filters),
    queryFn: () => merchantVoiceRepository.getStaff(filters),
    enabled,
  })
}

export function useCreateMerchantVoiceStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateMerchantVoiceStaffRequest) => merchantVoiceRepository.createStaff(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchantVoice', 'staff'] })
    },
  })
}

export function useUpdateMerchantVoiceStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateMerchantVoiceStaffRequest) => merchantVoiceRepository.updateStaff(body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['merchantVoice', 'staff'] })
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceStaffById(variables.id) })
    },
  })
}

export function useMerchantVoiceStaffById(id?: string | null, { enabled = true } = {}) {
  return useQuery({
    queryKey: qk.merchantVoiceStaffById(id),
    queryFn: () => merchantVoiceRepository.getStaffById(id!),
    enabled: enabled && !!id,
  })
}

const EMPTY_BUSINESS_STAFF_FILTERS: MerchantVoiceBusinessStaffFilter = {}

export function useMerchantVoiceBusinessStaff(
  filters: MerchantVoiceBusinessStaffFilter = EMPTY_BUSINESS_STAFF_FILTERS,
  { enabled = true } = {},
) {
  return useQuery<MerchantVoiceBusinessStaffDto[]>({
    queryKey: qk.merchantVoiceBusinessStaff(filters),
    queryFn: () => merchantVoiceRepository.getBusinessStaff(filters),
    enabled,
  })
}

export function useMerchantVoiceConfig({ enabled = true } = {}) {
  return useQuery<MerchantVoiceConfigDto>({
    queryKey: qk.merchantVoiceConfig(),
    queryFn: () => merchantVoiceRepository.getConfig(),
    enabled,
  })
}

export function useUpdateMerchantVoiceConfig() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, UpdateMerchantVoiceConfigRequest>({
    mutationFn: (body) => merchantVoiceRepository.updateConfig(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceConfig() })
    },
  })
}

export function useMerchantVoiceHolidays({ enabled = true } = {}) {
  return useQuery<MerchantVoiceHolidayDto[]>({
    queryKey: qk.merchantVoiceHolidays(),
    queryFn: () => merchantVoiceRepository.getHolidays(),
    enabled,
  })
}

export function useAffectedBookingsCount(date: string, { enabled = true } = {}) {
  return useQuery<number>({
    queryKey: qk.merchantVoiceHolidaysAffectedCount(date),
    queryFn: () => merchantVoiceRepository.getAffectedBookingsCount(date),
    enabled: enabled && Boolean(date),
  })
}

export function useCreateMerchantVoiceHoliday() {
  const queryClient = useQueryClient()
  return useMutation<MerchantVoiceHolidayDto, Error, CreateMerchantVoiceHolidayRequest>({
    mutationFn: (body) => merchantVoiceRepository.createHoliday(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceHolidays() })
    },
  })
}

export function useUpdateMerchantVoiceHoliday() {
  const queryClient = useQueryClient()
  return useMutation<MerchantVoiceHolidayDto, Error, { id: string; body: UpdateMerchantVoiceHolidayRequest }>({
    mutationFn: ({ id, body }) => merchantVoiceRepository.updateHoliday(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceHolidays() })
    },
  })
}

export function useDeleteMerchantVoiceHoliday() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => merchantVoiceRepository.deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceHolidays() })
    },
  })
}

export function useMerchantVoiceServiceCategories({ enabled = true } = {}) {
  return useQuery<MerchantVoiceServiceCategoryDto[]>({
    queryKey: qk.merchantVoiceServiceCategories(),
    queryFn: () => merchantVoiceRepository.getServiceCategories(),
    enabled,
  })
}

export function useCreateMerchantVoiceServiceCategory() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateMerchantVoiceServiceCategoryRequest>({
    mutationFn: (body) => merchantVoiceRepository.createServiceCategory(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceServiceCategories() })
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceServices() })
    },
  })
}

export function useUpdateMerchantVoiceServiceCategory() {
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    { id: string; body: UpdateMerchantVoiceServiceCategoryRequest }
  >({
    mutationFn: ({ id, body }) => merchantVoiceRepository.updateServiceCategory(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceServiceCategories() })
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceServices() })
    },
  })
}

export function useDeleteMerchantVoiceServiceCategory() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => merchantVoiceRepository.deleteServiceCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceServiceCategories() })
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceServices() })
    },
  })
}

export function useMerchantVoiceServices({ enabled = true } = {}) {
  return useQuery<MerchantVoiceServiceDto[]>({
    queryKey: qk.merchantVoiceServices(),
    queryFn: () => merchantVoiceRepository.getServices(),
    enabled,
  })
}

export function useCreateMerchantVoiceService() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateMerchantVoiceServiceRequest>({
    mutationFn: (body) => merchantVoiceRepository.createService(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceServices() })
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceServiceCategories() })
    },
  })
}

export function useUpdateMerchantVoiceService() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { id: string; body: UpdateMerchantVoiceServiceRequest }>({
    mutationFn: ({ id, body }) => merchantVoiceRepository.updateService(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceServices() })
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceServiceCategories() })
    },
  })
}

export function useDeleteMerchantVoiceService() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => merchantVoiceRepository.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceServices() })
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceServiceCategories() })
    },
  })
}

export function useToggleMerchantVoiceStaffStatus() {
  const queryClient = useQueryClient()
  return useMutation<MerchantVoiceStaffStatus, Error, string>({
    mutationFn: (id) => merchantVoiceRepository.toggleStaffStatus(id),
    onSuccess: (_status, id) => {
      queryClient.invalidateQueries({ queryKey: ['merchantVoice', 'staff'] })
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceStaffById(id) })
    },
  })
}

const EMPTY_CALLS_FILTERS: MerchantVoiceCallsFilter = {}

export function useMerchantVoiceCalls(
  filters: MerchantVoiceCallsFilter = EMPTY_CALLS_FILTERS,
  { enabled = true } = {},
) {
  return useQuery<MerchantVoiceCallsResponse>({
    queryKey: qk.merchantVoiceCalls(filters),
    queryFn: () => merchantVoiceRepository.getCalls(filters),
    enabled,
  })
}

export function useMerchantVoiceCallStatistics({ enabled = true } = {}) {
  return useQuery<MerchantVoiceCallStatisticsDto>({
    queryKey: qk.merchantVoiceCallStatistics(),
    queryFn: () => merchantVoiceRepository.getCallStatistics(),
    enabled,
  })
}

export function useSendMerchantVoiceCallFollowUpSms() {
  const queryClient = useQueryClient()

  return useMutation<boolean, Error, { id: string }>({
    mutationFn: ({ id }) => merchantVoiceRepository.sendCallFollowUpSms(id),
    onSuccess: (sent) => {
      if (!sent) return
      queryClient.invalidateQueries({ queryKey: ['merchantVoice', 'calls'] })
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceCallStatistics() })
    },
  })
}

const EMPTY_CUSTOMERS_FILTERS: MerchantVoiceCustomersFilter = {}

export function useMerchantVoiceCustomers(
  filters: MerchantVoiceCustomersFilter = EMPTY_CUSTOMERS_FILTERS,
  { enabled = true } = {},
) {
  return useQuery<MerchantVoiceCustomersResponse>({
    queryKey: qk.merchantVoiceCustomers(filters),
    queryFn: () => merchantVoiceRepository.getCustomers(filters),
    enabled,
  })
}

export function useMerchantVoiceCustomerSummary({ enabled = true } = {}) {
  return useQuery<MerchantVoiceCustomerGroupSummaryDto>({
    queryKey: qk.merchantVoiceCustomerSummary(),
    queryFn: () => merchantVoiceRepository.getCustomerSummary(),
    enabled,
  })
}

function invalidateMerchantVoiceCustomers(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: qk.merchantVoiceCustomersRoot() })
}

export function useCreateMerchantVoiceCustomer() {
  const queryClient = useQueryClient()

  return useMutation<MerchantVoiceCustomerDto, Error, CreateMerchantVoiceCustomerRequest>({
    mutationFn: (body) => merchantVoiceRepository.createCustomer(body),
    onSuccess: () => {
      invalidateMerchantVoiceCustomers(queryClient)
    },
  })
}

export function useUpdateMerchantVoiceCustomer() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: string; body: UpdateMerchantVoiceCustomerRequest }>({
    mutationFn: ({ id, body }) => merchantVoiceRepository.updateCustomer(id, body),
    onSuccess: () => {
      invalidateMerchantVoiceCustomers(queryClient)
    },
  })
}

const EMPTY_USAGE_ACTIVITY_FILTERS: MerchantVoiceUsageActivityFilter = {}

/** GET `/api/v1/merchant/nexora-voice/credits` */
export function useMerchantVoiceCreditWallet({ enabled = true } = {}) {
  return useQuery<VoiceCreditWalletDto>({
    queryKey: qk.merchantVoiceCreditWallet(),
    queryFn: () => merchantVoiceRepository.getCreditWallet(),
    enabled,
  })
}

/** GET `/api/v1/merchant/nexora-voice/usage/activity` */
export function useMerchantVoiceUsageActivity(
  filters: MerchantVoiceUsageActivityFilter = EMPTY_USAGE_ACTIVITY_FILTERS,
  { enabled = true } = {},
) {
  return useQuery<MerchantVoiceUsageActivityResponse>({
    queryKey: qk.merchantVoiceUsageActivity(filters),
    queryFn: () => merchantVoiceRepository.getUsageActivity(filters),
    enabled,
  })
}

