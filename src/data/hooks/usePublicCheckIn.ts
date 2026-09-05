/**
 * TanStack Query hooks for POS Public Check-In. Anonymous — no session/auth gating, same
 * as usePublicBooking.ts.
 */
import { useMutation, useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import publicCheckInRepository from '../repositories/publicCheckIn'
import type {
  PublicCheckInActiveVisitApiDto,
  PublicCheckInBookingApiDto,
  PublicCheckInBookingPayload,
  PublicCheckInCustomerApiDto,
  PublicCheckInOrderPayload,
  PublicCheckInOrderResultApiDto,
  PublicCheckInPageApiDto,
  PublicCheckInStatusApiDto,
} from '../../types/repositories'

// Same threshold as the public booking lookup — don't fire until a full national number
// has been entered.
const PHONE_LOOKUP_MIN_DIGITS = 10

/** Status page refresh cadence — matches the front desk's own 15s poll (§8.4). */
export const PUBLIC_CHECK_IN_STATUS_POLL_MS = 15000

function hasFullPhone(phone?: string) {
  return (phone ?? '').replace(/\D/g, '').length >= PHONE_LOOKUP_MIN_DIGITS
}

export function usePublicCheckInPage(businessSlug?: string) {
  return useQuery<PublicCheckInPageApiDto>({
    queryKey: qk.publicCheckInPage(businessSlug),
    queryFn: () => publicCheckInRepository.getCheckInPage(businessSlug as string),
    enabled: Boolean(businessSlug),
    retry: false,
  })
}

export function usePublicCheckInCustomerLookup(businessSlug?: string, phone?: string) {
  return useQuery<PublicCheckInCustomerApiDto | null>({
    queryKey: qk.publicCheckInCustomerLookup(businessSlug, phone),
    queryFn: () => publicCheckInRepository.getCustomerLookup(businessSlug as string, phone as string),
    enabled: Boolean(businessSlug) && hasFullPhone(phone),
    retry: false,
    staleTime: 30000,
  })
}

// Drives the "you already have an open visit" interstitial. Deliberately not cached across
// the submit — the guard that actually matters runs server-side inside the transaction.
export function usePublicCheckInActiveVisit(businessSlug?: string, phone?: string) {
  return useQuery<PublicCheckInActiveVisitApiDto | null>({
    queryKey: qk.publicCheckInActiveVisit(businessSlug, phone),
    queryFn: () => publicCheckInRepository.getActiveVisit(businessSlug as string, phone as string),
    enabled: Boolean(businessSlug) && hasFullPhone(phone),
    retry: false,
    staleTime: 0,
  })
}

export function usePublicCheckInBooking(businessSlug?: string, phone?: string) {
  return useQuery<PublicCheckInBookingApiDto | null>({
    queryKey: qk.publicCheckInBooking(businessSlug, phone),
    queryFn: () => publicCheckInRepository.getBooking(businessSlug as string, phone as string),
    enabled: Boolean(businessSlug) && hasFullPhone(phone),
    retry: false,
    staleTime: 0,
  })
}

export function useCreatePublicCheckInOrder(businessSlug?: string) {
  return useMutation<PublicCheckInOrderResultApiDto, Error, PublicCheckInOrderPayload>({
    mutationFn: (payload) => publicCheckInRepository.createOrder(businessSlug as string, payload),
  })
}

export function useCheckInPublicBooking(businessSlug?: string) {
  return useMutation<PublicCheckInOrderResultApiDto, Error, PublicCheckInBookingPayload>({
    mutationFn: (payload) => publicCheckInRepository.checkInBooking(businessSlug as string, payload),
  })
}

// Polls instead of pushing — no realtime in this pass (§8.4).
export function usePublicCheckInStatus(receiptToken?: string) {
  return useQuery<PublicCheckInStatusApiDto>({
    queryKey: qk.publicCheckInStatus(receiptToken),
    queryFn: () => publicCheckInRepository.getStatus(receiptToken as string),
    enabled: Boolean(receiptToken),
    retry: false,
    refetchInterval: PUBLIC_CHECK_IN_STATUS_POLL_MS,
    refetchIntervalInBackground: false,
  })
}
