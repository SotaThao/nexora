/**
 * TanStack Query hooks for POS Booking, Staff/Owner creates/manages bookings (Tickets 3, 7-9).
 * Usable by both Owner and Staff sessions (gated server-side via IPosOperationsAccessService).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posBookingRepository from '../repositories/posBooking'
import type {
  BookingDetailApiDto,
  BookingListFilters,
  BookingListResultApiDto,
  CancelBookingPayload,
  CreateBookingPayload,
  RescheduleBookingPayload,
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

export function useBookingList(businessId?: string, filters: BookingListFilters = {}) {
  return useQuery<BookingListResultApiDto>({
    queryKey: qk.merchantPosBookingList(businessId, filters),
    queryFn: () => posBookingRepository.getBookingList(businessId as string, filters),
    enabled: Boolean(businessId),
  })
}

export function useBookingDetail(businessId?: string, bookingId?: string) {
  return useQuery<BookingDetailApiDto>({
    queryKey: qk.merchantPosBookingDetail(businessId, bookingId),
    queryFn: () => posBookingRepository.getBookingDetail(businessId as string, bookingId as string),
    enabled: Boolean(businessId) && Boolean(bookingId),
  })
}

// Every mutation below invalidates the whole posBookingList prefix (no filters argument), since
// a check-in/cancel/reschedule can change which page/filter a booking belongs in.
export function useCheckInBookingFromList(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<string, Error, string>({
    mutationFn: (bookingId) => posBookingRepository.checkInBooking(businessId as string, bookingId),
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
