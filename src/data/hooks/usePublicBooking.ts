/**
 * TanStack Query hook for POS Booking's Public Booking Page discovery (Ticket 4).
 * Anonymous — no session/auth gating, unlike every other data hook in this app.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import publicBookingRepository from '../repositories/publicBooking'
import type {
  CreatePublicBookingPayload,
  CreatePublicBookingResultApiDto,
  ManageBookingApiDto,
  ManageBookingReschedulePayload,
  PublicAvailabilityApiDto,
  PublicAvailabilityRequestPayload,
  PublicBookingPageApiDto,
} from '../../types/repositories'

export function usePublicBookingPage(businessSlug?: string) {
  return useQuery<PublicBookingPageApiDto>({
    queryKey: qk.publicBookingPage(businessSlug),
    queryFn: () => publicBookingRepository.getBookingPage(businessSlug as string),
    enabled: Boolean(businessSlug),
    retry: false,
  })
}

// Mutation, not a cached query — availability is fetched on demand each time the customer
// picks a date, not something that benefits from TanStack Query's cache/invalidation model.
export function usePublicAvailability(businessSlug?: string) {
  return useMutation<PublicAvailabilityApiDto, Error, PublicAvailabilityRequestPayload>({
    mutationFn: (payload) => publicBookingRepository.getAvailability(businessSlug as string, payload),
  })
}

export function useCreatePublicBooking(businessSlug?: string) {
  return useMutation<CreatePublicBookingResultApiDto, Error, CreatePublicBookingPayload>({
    mutationFn: (payload) => publicBookingRepository.createBooking(businessSlug as string, payload),
  })
}

export function useManageBooking(manageToken?: string) {
  return useQuery<ManageBookingApiDto>({
    queryKey: qk.manageBooking(manageToken),
    queryFn: () => publicBookingRepository.getManageBooking(manageToken as string),
    enabled: Boolean(manageToken),
    retry: false,
  })
}

export function useCancelManageBooking(manageToken?: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, void>({
    mutationFn: () => publicBookingRepository.cancelManageBooking(manageToken as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.manageBooking(manageToken) })
    },
  })
}

export function useRescheduleManageBooking(manageToken?: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, ManageBookingReschedulePayload>({
    mutationFn: (payload) => publicBookingRepository.rescheduleManageBooking(manageToken as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.manageBooking(manageToken) })
    },
  })
}
