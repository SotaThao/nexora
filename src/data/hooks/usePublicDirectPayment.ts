import { useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import publicDirectPaymentRepository from '../repositories/publicDirectPayment'
import { toTipConstraints, toTipStaffList } from '../repositories/tipStaffDto'
import { useCustomerTouchPage } from './usePublicTouch'
import type {
  CreateDirectPaymentResult,
  PublicDirectPaymentPage,
  PublicDirectPaymentStaff,
  TipConstraints,
} from '../../types/domain'
import type { CreateDirectPaymentVars } from '../../types/hooks'

export function useDirectPaymentPage(businessId?: string | null) {
  return useQuery<PublicDirectPaymentPage>({
    queryKey: qk.publicDirectPaymentPage(businessId ?? ''),
    queryFn: () => publicDirectPaymentRepository.getPaymentPage(businessId!),
    enabled: Boolean(businessId),
    retry: false,
  })
}

export interface DirectPaymentTipContext {
  staff: PublicDirectPaymentStaff[]
  touchPointId: string
  tipConstraints: TipConstraints
  isLoading: boolean
}

/**
 * Tippable staff + touch point for the /pay screen.
 *
 * Preferred source is the payment page itself; when it carries no tip block the
 * hook falls back to the touch page the customer came from (slugs forwarded as
 * query params by the touchpoint redirect).
 */
export function useDirectPaymentTipContext({
  page,
  businessSlug,
  touchPointSlug,
  sessionId,
}: {
  page?: PublicDirectPaymentPage | null
  businessSlug?: string | null
  touchPointSlug?: string | null
  sessionId?: string | null
}): DirectPaymentTipContext {
  const hasPageTipBlock = Boolean(page?.staff?.length && page?.touchPointId)

  // Slugs from the URL (touchpoint redirect) first, then whatever the page itself carries.
  const resolvedBusinessSlug = businessSlug || page?.businessSlug || ''
  const resolvedTouchPointSlug = touchPointSlug || page?.touchPointSlug || ''

  const touchQuery = useCustomerTouchPage({
    businessSlug: hasPageTipBlock ? '' : resolvedBusinessSlug,
    touchPointSlug: hasPageTipBlock ? '' : resolvedTouchPointSlug,
    sessionId: hasPageTipBlock ? '' : (sessionId || ''),
  })

  return useMemo(() => {
    if (hasPageTipBlock && page) {
      return {
        staff: page.staff,
        touchPointId: page.touchPointId ?? '',
        tipConstraints: page.tipConstraints,
        isLoading: false,
      }
    }

    const touchData = touchQuery.data ?? null
    return {
      staff: toTipStaffList(touchData),
      touchPointId: String((touchData?.touchPoint as LooseObject | undefined)?.id ?? ''),
      tipConstraints: toTipConstraints(touchData),
      isLoading: touchQuery.isLoading,
    }
  }, [hasPageTipBlock, page, touchQuery.data, touchQuery.isLoading])
}

export function useCreateDirectPayment() {
  return useMutation<CreateDirectPaymentResult, Error, CreateDirectPaymentVars>({
    mutationFn: ({ businessId, businessPaymentMethodId, amount, cryptoSymbol }) =>
      publicDirectPaymentRepository.createPayment(businessId, {
        businessPaymentMethodId,
        amount,
        cryptoSymbol,
      }),
  })
}

export function useConfirmDirectPayment() {
  return useMutation<void, Error, string>({
    mutationFn: (paymentId) => publicDirectPaymentRepository.confirmPayment(paymentId),
  })
}
