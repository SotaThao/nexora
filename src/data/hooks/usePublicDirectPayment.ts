import { useMutation, useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import publicDirectPaymentRepository from '../repositories/publicDirectPayment'
import type {
  CreateDirectPaymentResult,
  PublicDirectPaymentPage,
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

export function useCreateDirectPayment() {
  return useMutation<CreateDirectPaymentResult, Error, CreateDirectPaymentVars>({
    mutationFn: ({ businessId, businessPaymentMethodId, amount }) =>
      publicDirectPaymentRepository.createPayment(businessId, {
        businessPaymentMethodId,
        amount,
      }),
  })
}

export function useConfirmDirectPayment() {
  return useMutation<void, Error, string>({
    mutationFn: (paymentId) => publicDirectPaymentRepository.confirmPayment(paymentId),
  })
}
