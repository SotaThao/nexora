/**
 * TanStack Query hook for POS Booking's Public Booking Page discovery (Ticket 4).
 * Anonymous — no session/auth gating, unlike every other data hook in this app.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import publicBookingRepository from '../repositories/publicBooking'
import type {
  BookingConsentApiDto,
  CreatePublicBookingPayload,
  CreatePublicBookingResultApiDto,
  CustomerLookupResultApiDto,
  ManageBookingApiDto,
  ManageBookingReschedulePayload,
  PublicAvailabilityApiDto,
  PublicAvailabilityRequestPayload,
  PublicBookingPageApiDto,
} from '../../types/repositories'

// Matches the Merchant check-in lookup's threshold (usePosOrders.ts) — don't fire until a
// full national number has been entered.
const CUSTOMER_LOOKUP_MIN_DIGITS = 10

export function usePublicBookingPage(businessSlug?: string) {
  return useQuery<PublicBookingPageApiDto>({
    queryKey: qk.publicBookingPage(businessSlug),
    queryFn: () => publicBookingRepository.getBookingPage(businessSlug as string),
    enabled: Boolean(businessSlug),
    retry: false,
  })
}

// Returning-customer contact-step prefill (Customer entity unification) — anonymous, so no
// session gating unlike useCustomerLookupByPhone (the Merchant/authenticated equivalent).
export function usePublicBookingCustomerLookup(businessSlug?: string, phone?: string) {
  const digitCount = (phone ?? '').replace(/\D/g, '').length
  return useQuery<CustomerLookupResultApiDto | null>({
    queryKey: qk.publicBookingCustomerLookup(businessSlug, phone),
    queryFn: () => publicBookingRepository.getCustomerLookup(businessSlug as string, phone as string),
    enabled: Boolean(businessSlug) && digitCount >= CUSTOMER_LOOKUP_MIN_DIGITS,
    retry: false,
    staleTime: 30000,
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

export function useManageBookingConsent(manageToken?: string) {
  return useQuery<BookingConsentApiDto>({
    queryKey: qk.manageBookingConsent(manageToken),
    queryFn: () => publicBookingRepository.getBookingConsent(manageToken as string),
    enabled: Boolean(manageToken),
    retry: false,
  })
}

export function useUpdateManageBookingConsent(manageToken?: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, BookingConsentApiDto>({
    mutationFn: (payload) => publicBookingRepository.updateBookingConsent(manageToken as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.manageBookingConsent(manageToken) })
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
