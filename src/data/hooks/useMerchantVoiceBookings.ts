import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import {
  type MerchantVoiceBusinessStaffFilter,
  type CreateMerchantVoiceStaffRequest,
  merchantVoiceRepository,
  type MerchantVoiceBusinessStaffDto,
  type MerchantVoiceConfigDto,
  type UpdateMerchantVoiceConfigRequest,
  MerchantVoiceLeadStatus,
  MerchantVoiceStaffStatus,
  type MerchantVoiceBookingsFilter,
  type MerchantVoiceBookingsResponse,
  type MerchantVoiceBookingStatisticsDto,
  type MerchantVoiceStaffFilter,
  type MerchantVoiceStaffResponse,
} from '../repositories/merchantVoice'

const EMPTY_FILTERS: MerchantVoiceBookingsFilter = {}

export function useMerchantVoiceBookingStatistics({ enabled = true } = {}) {
  return useQuery<MerchantVoiceBookingStatisticsDto>({
    queryKey: qk.merchantVoiceBookingStatistics(),
    queryFn: () => merchantVoiceRepository.getBookingStatistics(),
    enabled,
  })
}

export function useMerchantVoiceBookings(
  filters: MerchantVoiceBookingsFilter = EMPTY_FILTERS,
  { enabled = true } = {},
) {
  return useQuery<MerchantVoiceBookingsResponse>({
    queryKey: qk.merchantVoiceBookings(filters),
    queryFn: () => merchantVoiceRepository.getBookings(filters),
    enabled,
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

