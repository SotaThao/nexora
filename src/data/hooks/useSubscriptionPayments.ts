import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import subscriptionPaymentsRepository, {
  type InitializeCardPaymentResult,
  type PurchaseSubscriptionResult,
  type SubscriptionPackage,
  type SubscriptionPaymentMethod,
  type SubscriptionPurchaseHistoryItem,
} from '../repositories/subscriptionPayments'

const CARD_PAYMENT_POLL_INTERVAL_MS = 3_000

export function useSubscriptionPackages({ enabled = true } = {}) {
  return useQuery<SubscriptionPackage[]>({
    queryKey: qk.merchantSubscriptionPackages(),
    queryFn: () => subscriptionPaymentsRepository.getPackages(),
    enabled,
    staleTime: 60_000,
  })
}

export function usePublicSubscriptionPackages({ enabled = true } = {}) {
  return useQuery<SubscriptionPackage[]>({
    queryKey: qk.publicSubscriptionPackages(),
    queryFn: () => subscriptionPaymentsRepository.getPublicPackages(),
    enabled,
    staleTime: 60_000,
  })
}

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
    { packageId: string; symbol: string }
  >({
    mutationFn: ({ packageId, symbol }) => subscriptionPaymentsRepository.purchase(packageId, symbol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.userProfile() })
      queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionPaymentMethods() })
    },
  })
}

export function useInitializeCardPayment() {
  return useMutation<InitializeCardPaymentResult, Error, string>({
    mutationFn: (packageId) => subscriptionPaymentsRepository.initializeCardPayment(packageId),
  })
}

/**
 * Polls purchase-history for a specific order until Stripe's webhook has
 * flipped it to Paid/Failed (or the caller gives up by disabling `enabled`).
 * Card confirmation succeeds client-side before the backend's async webhook
 * activates the subscription, so the UI needs to wait for that separately.
 */
export function useSubscriptionOrderStatusPoll(orderId: string | null, { enabled = true } = {}) {
  return useQuery<SubscriptionPurchaseHistoryItem | undefined>({
    queryKey: qk.merchantSubscriptionOrderStatus(orderId ?? ''),
    queryFn: async () => {
      const history = await subscriptionPaymentsRepository.getPurchaseHistory()
      return history.find((item) => item.orderId === orderId)
    },
    enabled: enabled && !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.paymentStatus
      return status === 'Paid' || status === 'Failed' ? false : CARD_PAYMENT_POLL_INTERVAL_MS
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  })
}
