/**
 * usePublicTouch — TanStack Query hooks for the public customer touch domain.
 *
 * These hooks wrap the publicTouchRepository and publicBusinessesRepository
 * so that UI components never call repositories directly.
 *
 * Hooks:
 *   useCustomerTouchPage()          → useQuery  — fetch landing page data
 *   useCreateTip()                  → useMutation
 *   useConfirmTip()                 → useMutation (invalidates customerTouch)
 *   useSkipTip()                    → useMutation
 *   useCreateReview()               → useMutation
 *   useTrackGoogle()                → useMutation
 *   useTrackYelp()                  → useMutation
 *   usePublicBusinessPaymentMethods → useQuery  — fetch payment methods
 *   useCreateMultiStaffTip()        → useMutation
 *   useConfirmMultiStaffTip()       → useMutation (invalidates customerTouch)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { qk } from '../queryKeys'
import publicTouchRepository from '../repositories/publicTouch'
import publicBusinessesRepository from '../repositories/publicBusinesses'

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch the customer touch-point landing page.
 *
 * @param {object} args
 * @param {string} args.businessSlug   - URL-safe business identifier
 * @param {string} args.touchPointSlug - URL-safe touch-point identifier
 * @param {string} args.sessionId      - Unique session UUID
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useCustomerTouchPage({ businessSlug, touchPointSlug, sessionId }) {
  return useQuery({
    queryKey: qk.customerTouch(businessSlug, touchPointSlug, sessionId),
    queryFn: () =>
      publicTouchRepository.getTouchPage({ businessSlug, touchPointSlug, sessionId }),
    enabled: Boolean(businessSlug && touchPointSlug && sessionId),
  })
}

/**
 * Fetch payment methods available for a business (public endpoint).
 *
 * @param {string} businessId - Business UUID
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function usePublicBusinessPaymentMethods(businessId) {
  return useQuery({
    queryKey: qk.publicBusinessPaymentMethods(businessId),
    queryFn: () => publicBusinessesRepository.getPaymentMethods(businessId),
    enabled: Boolean(businessId),
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new tip.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCreateTip() {
  return useMutation({
    /**
     * @param {object} args
     * @param {string} args.touchPointId
     * @param {string} args.staffProfileId
     * @param {number} args.amount
     * @param {string} args.paymentMethod
     * @param {string} args.sessionId
     */
    mutationFn: (args) => publicTouchRepository.createTip(args),
  })
}

/**
 * Confirm a previously-created tip.
 * Invalidates the customerTouch query so the UI reflects the updated state.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useConfirmTip() {
  const queryClient = useQueryClient()
  return useMutation({
    /** @param {string} tipId */
    mutationFn: (tipId) => publicTouchRepository.confirmTip(tipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerTouch'] })
    },
  })
}

/**
 * Skip tipping for the current session.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useSkipTip() {
  return useMutation({
    /**
     * @param {object} args
     * @param {string} args.touchPointId
     * @param {string} args.staffProfileId
     * @param {string} args.sessionId
     */
    mutationFn: (args) => publicTouchRepository.skipTip(args),
  })
}

/**
 * Submit a customer review.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCreateReview() {
  return useMutation({
    /**
     * @param {object} args
     * @param {string}  args.touchPointId
     * @param {string}  [args.tipId]
     * @param {string}  args.staffProfileId
     * @param {number}  args.rating
     * @param {string}  [args.comment]
     * @param {string}  [args.customerEmail]
     * @param {string}  [args.customerName]
     */
    mutationFn: (args) => publicTouchRepository.createReview(args),
  })
}

/**
 * Track a Google Reviews click-through.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useTrackGoogle() {
  return useMutation({
    /** @param {string} reviewId */
    mutationFn: (reviewId) => publicTouchRepository.trackGoogle(reviewId),
  })
}

/**
 * Track a Yelp Reviews click-through.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useTrackYelp() {
  return useMutation({
    /** @param {string} reviewId */
    mutationFn: (reviewId) => publicTouchRepository.trackYelp(reviewId),
  })
}

/**
 * Create a multi-staff tip.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useCreateMultiStaffTip() {
  return useMutation({
    /**
     * @param {object} args
     * @param {string} args.businessId
     * @param {string} args.touchPointId
     * @param {string} args.businessPaymentMethodId
     * @param {Array<{staffProfileId: string, amount: number}>} args.tipItems
     */
    mutationFn: (args) => publicBusinessesRepository.createMultiStaffTip(args),
  })
}

/**
 * Confirm a multi-staff tip.
 * Invalidates the customerTouch query so the UI reflects the updated state.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useConfirmMultiStaffTip() {
  const queryClient = useQueryClient()
  return useMutation({
    /** @param {string} tipId */
    mutationFn: (tipId) => publicBusinessesRepository.confirmMultiStaffTip(tipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerTouch'] })
    },
  })
}
