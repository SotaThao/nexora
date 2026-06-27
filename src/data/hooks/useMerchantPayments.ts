import { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantPaymentsRepository from '../repositories/merchantPayments'
import { AuthContext } from '../../auth/AuthContext'
import type { MerchantPaymentQr } from '../../types/domain'

export function useMerchantPaymentQr({ enabled = true } = {}) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'

  return useQuery<MerchantPaymentQr>({
    queryKey: qk.merchantPaymentQr(),
    queryFn: () => merchantPaymentsRepository.getPaymentQr(),
    enabled: isOwner && enabled,
  })
}
