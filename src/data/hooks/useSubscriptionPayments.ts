import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import subscriptionPaymentsRepository, {
  type PurchasableSubscriptionPlan,
  type PurchaseSubscriptionResult,
  type SubscriptionPaymentMethod,
} from '../repositories/subscriptionPayments'

export function useSubscriptionPaymentMethods({ enabled = true } = {}) {
  return useQuery<SubscriptionPaymentMethod[]>({
    queryKey: qk.merchantSubscriptionPaymentMethods(),
    queryFn: () => subscriptionPaymentsRepository.getPaymentMethods(),
    enabled,
    staleTime: 60_000,
  })
}

export function usePurchaseSubscription() {
  const queryClient = useQueryClient()
  return useMutation<
    PurchaseSubscriptionResult,
    Error,
    { plan: PurchasableSubscriptionPlan; symbol: string }
  >({
    mutationFn: ({ plan, symbol }) => subscriptionPaymentsRepository.purchase(plan, symbol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.userProfile() })
      queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionPaymentMethods() })
    },
  })
}
