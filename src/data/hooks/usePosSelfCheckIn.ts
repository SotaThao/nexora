/**
 * TanStack Query hooks for the Self Check-In kiosk.
 *
 * None of these check `isAuthenticated` — the kiosk has no user session by design. What gates them
 * is the device token, and the client turns its rejection into the revoked screen, so a hook here
 * only has to care whether it has the argument it needs.
 *
 * `retry: false` throughout: a customer standing at the tablet gets an answer or an error, not a
 * silent multi-second retry loop.
 */
import { useMutation, useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import posSelfCheckInRepository, {
  type CheckInSelfCheckInBookingPayload,
  type CreateSelfCheckInOrderPayload,
} from '../repositories/posSelfCheckIn'
import type {
  PosPromotionApiDto,
  SelfCheckInBookingApiDto,
  SelfCheckInOrderResultApiDto,
  SelfCheckInServiceApiDto,
  SelfCheckInTechnicianApiDto,
} from '../../types/repositories'

// The service menu barely changes during a shift, and the tablet stays open all day.
const CATALOG_STALE_MS = 5 * 60 * 1000

export function useSelfCheckInCatalog(enabled = true) {
  return useQuery<SelfCheckInServiceApiDto[]>({
    queryKey: qk.posSelfCheckInCatalog(),
    queryFn: () => posSelfCheckInRepository.getCatalog(),
    enabled,
    retry: false,
    staleTime: CATALOG_STALE_MS,
  })
}

export function useSelfCheckInCustomerName(phone?: string) {
  return useQuery<string | null>({
    queryKey: qk.posSelfCheckInCustomerName(phone),
    queryFn: () => posSelfCheckInRepository.lookupCustomerName(phone as string),
    enabled: Boolean(phone),
    retry: false,
    // Never cached beyond the visit it belongs to: the next customer must not see a name resolved
    // for the person before them.
    gcTime: 0,
    staleTime: 0,
  })
}

export function useSelfCheckInTodaysBooking(phone?: string) {
  return useQuery<SelfCheckInBookingApiDto | null>({
    queryKey: qk.posSelfCheckInBooking(phone),
    queryFn: () => posSelfCheckInRepository.getTodaysBooking(phone as string),
    enabled: Boolean(phone),
    retry: false,
    gcTime: 0,
    staleTime: 0,
  })
}

export function useSelfCheckInActiveVisit(phone?: string) {
  return useQuery<string | null>({
    queryKey: qk.posSelfCheckInActiveVisit(phone),
    queryFn: () => posSelfCheckInRepository.getActiveVisitOrderNumber(phone as string),
    enabled: Boolean(phone),
    retry: false,
    gcTime: 0,
    staleTime: 0,
  })
}

export function useSelfCheckInTechnicians(enabled = true) {
  return useQuery<SelfCheckInTechnicianApiDto[]>({
    queryKey: qk.posSelfCheckInTechnicians(),
    queryFn: () => posSelfCheckInRepository.getTechnicians(),
    enabled,
    retry: false,
    // Who is clocked in changes through the day, and a customer must not be offered someone who
    // went home an hour ago.
    staleTime: 0,
  })
}

/** Keypad promo banners — soft-empty when BE has not shipped the endpoint yet (404 → []). */
export function useKioskPromotions(enabled = true) {
  return useQuery<PosPromotionApiDto[]>({
    queryKey: qk.posSelfCheckInPromotions(),
    queryFn: () => posSelfCheckInRepository.getPromotions(),
    enabled,
    retry: false,
    staleTime: CATALOG_STALE_MS,
  })
}

export function useCreateSelfCheckInOrder() {
  return useMutation<SelfCheckInOrderResultApiDto, Error, CreateSelfCheckInOrderPayload>({
    mutationFn: (payload) => posSelfCheckInRepository.createOrder(payload),
    retry: false,
  })
}

export function useCheckInSelfCheckInBooking() {
  return useMutation<SelfCheckInOrderResultApiDto, Error, CheckInSelfCheckInBookingPayload>({
    mutationFn: (payload) => posSelfCheckInRepository.checkInBooking(payload),
    retry: false,
  })
}
