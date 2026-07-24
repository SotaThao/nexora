import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { supportedPaymentMethodsRepository } from '../repositories/supportedPaymentMethods'
import type { SupportedPaymentMethod } from '../repositories/supportedPaymentMethods'

export function useSupportedPaymentMethods({ enabled = true } = {}) {
  return useQuery<SupportedPaymentMethod[]>({
    queryKey: qk.supportedPaymentMethods(),
    queryFn: () => supportedPaymentMethodsRepository.getSupported(),
    enabled,
    staleTime: 1000 * 60 * 30, // Cache supported methods for 30 mins to eliminate duplicate network calls
  })
}
