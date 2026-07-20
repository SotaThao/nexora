/**
 * TanStack Query hooks for POS Merchant Ops: Check-in & Waitlist (US-12).
 * Usable by both Owner and Staff sessions (gated server-side via
 * IPosOperationsAccessService) — see usePosAccess for the FE show/hide check.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posTicketsRepository from '../repositories/posTickets'
import type { CheckInTicketPayload, PosWaitlistTicketApiDto } from '../../types/repositories'

export function useWaitlist(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<PosWaitlistTicketApiDto[]>({
    queryKey: qk.merchantPosWaitlist(businessId),
    queryFn: () => posTicketsRepository.getWaitlist(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
    // Wait time displayed to the front desk should stay fresh without a manual refresh.
    refetchInterval: 15000,
  })
}

export function useCheckInTicket(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CheckInTicketPayload>({
    mutationFn: (payload) => posTicketsRepository.checkInTicket(businessId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
    },
  })
}

export function useCancelTicket(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, string>({
    mutationFn: (ticketId) => posTicketsRepository.cancelTicket(businessId as string, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
    },
  })
}

// US-13 — moves a ticket out of the Waitlist onto a station (auto-picked when
// posStaffProfileId is omitted), so both caches must be invalidated together.
export function useAssignTicketToStation(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { ticketId: string; posStaffProfileId?: string }>({
    mutationFn: ({ ticketId, posStaffProfileId }) =>
      posTicketsRepository.assignTicketToStation(businessId as string, ticketId, posStaffProfileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
    },
  })
}
