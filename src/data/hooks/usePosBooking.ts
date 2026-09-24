/**
 * TanStack Query hooks for POS Booking, Staff/Owner creates/manages bookings (Tickets 3, 7-9).
 * Usable by both Owner and Staff sessions (gated server-side via IPosOperationsAccessService).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posBookingRepository from '../repositories/posBooking'
import type {
  AssignBookingServiceLineStaffPayload,
  BookingAssignmentCandidateApiDto,
  BookingDetailApiDto,
  BookingListFilters,
  BookingListResultApiDto,
  CancelBookingPayload,
  CheckInOrderItemPayload,
  CreateBookingPayload,
  PosCheckInResultApiDto,
  RescheduleBookingPayload,
  UnassignedBookingAssignmentApiDto,
} from '../../types/repositories'

export function useCreateStaffBooking(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateBookingPayload>({
    mutationFn: (payload) => posBookingRepository.createStaffBooking(businessId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosBookingList(businessId) })
    },
  })
}

export function useBookingList(
  businessId?: string,
  filters: BookingListFilters = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery<BookingListResultApiDto>({
    queryKey: qk.merchantPosBookingList(businessId, filters),
    queryFn: () => posBookingRepository.getBookingList(businessId as string, filters),
    enabled: enabled && Boolean(businessId),
  })
}

export function useAllBookingListPages(
  businessId?: string,
  filters: Omit<BookingListFilters, 'page' | 'pageSize'> = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery<BookingListResultApiDto>({
    queryKey: qk.merchantPosBookingList(businessId, { ...filters, collection: 'all' }),
    queryFn: () => posBookingRepository.getAllBookingListPages(businessId as string, filters),
    enabled: enabled && Boolean(businessId),
  })
}

export function useBookingDetail(
  businessId?: string,
  bookingId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery<BookingDetailApiDto>({
    queryKey: qk.merchantPosBookingDetail(businessId, bookingId),
    queryFn: () => posBookingRepository.getBookingDetail(businessId as string, bookingId as string),
    enabled: enabled && Boolean(businessId) && Boolean(bookingId),
  })
}

// Every mutation below invalidates the whole posBookingList prefix (no filters argument), since
// a check-in/cancel/reschedule can change which page/filter a booking belongs in.
export function useCheckInBookingFromList(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<PosCheckInResultApiDto, Error, string>({
    mutationFn: (bookingId) => posBookingRepository.checkInBooking(businessId as string, bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosBookingList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
    },
  })
}

/**
 * Check-in tab's version: the operator walked a booked guest through the same steps as a walk-in,
 * so the resulting draft replaces the appointment's lines.
 *
 * Converting the booking rather than opening a new order is the whole point — the two used to
 * diverge, leaving a walk-in order beside an appointment nobody closed and two slots taken in the
 * day's sequence.
 */
export function useCheckInBookingWithDraft(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<
    PosCheckInResultApiDto,
    Error,
    { bookingId: string; items: CheckInOrderItemPayload[]; customerName?: string; customerEmail?: string }
  >({
    mutationFn: ({ bookingId, ...draft }) =>
      posBookingRepository.checkInBooking(businessId as string, bookingId, draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosBookingList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
    },
  })
}

export function useCancelBooking(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { bookingId: string; payload: CancelBookingPayload }>({
    mutationFn: ({ bookingId, payload }) => posBookingRepository.cancelBooking(businessId as string, bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosBookingList(businessId) })
    },
  })
}

export function useRescheduleBooking(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, { bookingId: string; payload: RescheduleBookingPayload }>({
    mutationFn: ({ bookingId, payload }) =>
      posBookingRepository.rescheduleBooking(businessId as string, bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosBookingList(businessId) })
    },
  })
}

export function useUnassignedBookingAssignments(
  businessId?: string,
  filters: { dateFrom?: string; dateTo?: string } = {},
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  return useQuery<UnassignedBookingAssignmentApiDto[]>({
    queryKey: qk.merchantPosUnassignedBookingAssignments(businessId, filters),
    queryFn: () => posBookingRepository.getUnassignedAssignments(businessId as string, filters),
    enabled: Boolean(businessId) && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval ?? 15000,
  })
}

export function useBookingAssignmentCandidates(
  businessId?: string,
  bookingId?: string,
  serviceLineId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery<BookingAssignmentCandidateApiDto[]>({
    queryKey: qk.merchantPosBookingAssignmentCandidates(businessId, bookingId, serviceLineId),
    queryFn: () =>
      posBookingRepository.getAssignmentCandidates(businessId as string, bookingId as string, serviceLineId as string),
    enabled: enabled && Boolean(businessId) && Boolean(bookingId) && Boolean(serviceLineId),
  })
}

export function useAssignBookingServiceLineStaff(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    { bookingId: string; serviceLineId: string; payload: AssignBookingServiceLineStaffPayload }
  >({
    mutationFn: ({ bookingId, serviceLineId, payload }) =>
      posBookingRepository.assignServiceLineStaff(businessId as string, bookingId, serviceLineId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosUnassignedBookingAssignments(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosBookingAssignmentCandidates(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosBookingList(businessId) })
    },
  })
}
