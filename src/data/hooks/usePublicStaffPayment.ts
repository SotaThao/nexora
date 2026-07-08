import { useMutation, useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import publicStaffPaymentRepository from '../repositories/publicStaffPayment'
import type {
  CreateDirectPaymentResult,
  PublicStaffDirectPaymentPage,
} from '../../types/domain'
import type { CreateStaffDirectPaymentVars } from '../../types/hooks'

export function useStaffDirectPaymentPage(staffProfileId?: string | null) {
  return useQuery<PublicStaffDirectPaymentPage>({
    queryKey: qk.publicStaffDirectPaymentPage(staffProfileId ?? ''),
    queryFn: () => publicStaffPaymentRepository.getPaymentPage(staffProfileId!),
    enabled: Boolean(staffProfileId),
    retry: false,
  })
}

export function useCreateStaffDirectPayment() {
  return useMutation<CreateDirectPaymentResult, Error, CreateStaffDirectPaymentVars>({
    mutationFn: ({ staffProfileId, staffPaymentMethodId, amount }) =>
      publicStaffPaymentRepository.createPayment(staffProfileId, {
        staffPaymentMethodId,
        amount,
      }),
  })
}

export function useConfirmStaffDirectPayment() {
  return useMutation<void, Error, string>({
    mutationFn: (paymentId) => publicStaffPaymentRepository.confirmPayment(paymentId),
  })
}
