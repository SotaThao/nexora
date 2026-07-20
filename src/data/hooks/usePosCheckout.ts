/**
 * TanStack Query hooks for POS Merchant Ops: Checkout (US-14 / US-025).
 * Usable by both Owner and Staff sessions (gated server-side via
 * IPosOperationsAccessService) — see usePosAccess for the FE show/hide check.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { useSessionRole } from '../../auth/useSessionRole'
import posCheckoutRepository from '../repositories/posCheckout'
import type {
  CheckoutServiceCatalogItemApiDto,
  ChargeTicketPayload,
  ChargeTicketResultApiDto,
  ReadyTicketApiDto,
  TicketDetailApiDto,
} from '../../types/repositories'

export function useReadyTickets(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<ReadyTicketApiDto[]>({
    queryKey: qk.merchantPosReadyTickets(businessId),
    queryFn: () => posCheckoutRepository.getReadyTickets(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
    // Ready-for-checkout list should stay fresh without a manual refresh.
    refetchInterval: 15000,
  })
}

export function useTicketDetail(businessId?: string, ticketId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<TicketDetailApiDto>({
    queryKey: qk.merchantPosTicketDetail(businessId, ticketId),
    queryFn: () => posCheckoutRepository.getTicketDetail(businessId as string, ticketId as string),
    enabled: isAuthenticated && Boolean(businessId) && Boolean(ticketId),
    retry: false,
  })
}

export function useCheckoutServiceCatalog(businessId?: string) {
  const { isAuthenticated } = useSessionRole()
  return useQuery<CheckoutServiceCatalogItemApiDto[]>({
    queryKey: qk.merchantPosCheckoutServiceCatalog(businessId),
    queryFn: () => posCheckoutRepository.getServiceCatalog(businessId as string),
    enabled: isAuthenticated && Boolean(businessId),
    retry: false,
  })
}

export function useAddTicketServiceLine(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<string, Error, { ticketId: string; posServiceId: string; quantity?: number }>({
    mutationFn: ({ ticketId, posServiceId, quantity }) =>
      posCheckoutRepository.addTicketServiceLine(businessId as string, ticketId, posServiceId, quantity),
    onSuccess: (_result, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTicketDetail(businessId, ticketId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosReadyTickets(businessId) })
    },
  })
}

// US-14 — opens Checkout for a ticket coming straight off the Turn Board
// (InService -> Ready). Must invalidate Waitlist/Turn Board/Ready Tickets together
// since it changes what each of those three views shows.
export function useMarkTicketReady(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, string>({
    mutationFn: (ticketId) => posCheckoutRepository.markTicketReady(businessId as string, ticketId),
    onSuccess: (_result, ticketId) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosReadyTickets(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTicketDetail(businessId, ticketId) })
    },
  })
}

export function useSetTicketTip(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<boolean, Error, { ticketId: string; tipAmount: number }>({
    mutationFn: ({ ticketId, tipAmount }) =>
      posCheckoutRepository.setTicketTip(businessId as string, ticketId, tipAmount),
    onSuccess: (_result, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTicketDetail(businessId, ticketId) })
    },
  })
}

// Charge is the terminal action for a ticket — it releases the station and removes
// the ticket from both Ready Tickets and Turn Board, so all three caches (plus
// Waitlist, since a busy front desk may be checking it) must refresh together.
export function useChargeTicket(businessId?: string) {
  const queryClient = useQueryClient()
  return useMutation<ChargeTicketResultApiDto, Error, { ticketId: string; payload: ChargeTicketPayload }>({
    mutationFn: ({ ticketId, payload }) =>
      posCheckoutRepository.chargeTicket(businessId as string, ticketId, payload),
    onSuccess: (_result, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: qk.merchantPosReadyTickets(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
      queryClient.invalidateQueries({ queryKey: qk.merchantPosTicketDetail(businessId, ticketId) })
    },
  })
}
