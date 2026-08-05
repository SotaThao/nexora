import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import subscriptionPaymentsRepository, {
  SubscriptionPackageType,
  SubscriptionPaymentStatus,
  type InitializeCardPaymentResult,
  type PurchasePackageByIdResult,
  type PurchaseSubscriptionResult,
  type SubscriptionPackage,
  type SubscriptionPaymentMethod,
  type SubscriptionPurchaseHistoryItem,
} from '../repositories/subscriptionPayments'

const CARD_PAYMENT_POLL_INTERVAL_MS = 2_000

export function useSubscriptionPackages({
  enabled = true,
  packageType,
  staleTime = 60_000,
  refetchOnMount,
}: {
  enabled?: boolean
  packageType?: SubscriptionPackageType
  staleTime?: number
  refetchOnMount?: boolean | 'always'
} = {}) {
  return useQuery<SubscriptionPackage[]>({
    queryKey: qk.merchantSubscriptionPackages(packageType),
    queryFn: () => subscriptionPaymentsRepository.getPackages(packageType),
    enabled,
    staleTime,
    refetchOnMount,
  })
}

export function usePublicSubscriptionPackages({
  enabled = true,
  packageType,
}: {
  enabled?: boolean
  packageType?: SubscriptionPackageType
} = {}) {
  return useQuery<SubscriptionPackage[]>({
    queryKey: qk.publicSubscriptionPackages(packageType),
    queryFn: () => subscriptionPaymentsRepository.getPublicPackages(packageType),
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

/** GET `/api/v1/merchant/subscriptions/purchase-history` */
export function useSubscriptionPurchaseHistory({ enabled = true } = {}) {
  return useQuery<SubscriptionPurchaseHistoryItem[]>({
    queryKey: qk.merchantSubscriptionPurchaseHistory(),
    queryFn: () => subscriptionPaymentsRepository.getPurchaseHistory(),
    enabled,
    staleTime: 30_000,
  })
}

/** Tip Platform wallet purchase — body `{ packageId, symbol }`. */
export function usePurchaseSubscription() {
  const queryClient = useQueryClient()
  return useMutation<
    PurchaseSubscriptionResult,
    Error,
    { packageId: string; symbol: string }
  >({
    mutationFn: ({ packageId, symbol }) =>
      subscriptionPaymentsRepository.purchase(packageId, symbol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.userProfile() })
      queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionPaymentMethods() })
      queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionPurchaseHistory() })
    },
  })
}

/** VoiceAI MD purchase — body `{ packageId, symbol }`. */
export function usePurchaseVoiceAiPackage() {
  const queryClient = useQueryClient()
  return useMutation<
    PurchasePackageByIdResult,
    Error,
    { packageId: string; symbol: string }
  >({
    mutationFn: ({ packageId, symbol }) =>
      subscriptionPaymentsRepository.purchaseByPackageId(packageId, symbol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.userProfile() })
      queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionPaymentMethods() })
      queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionPurchaseHistory() })
      queryClient.invalidateQueries({
        queryKey: qk.merchantSubscriptionPackages(SubscriptionPackageType.VoiceAI),
      })
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceCreditWallet() })
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
      return status === SubscriptionPaymentStatus.Paid ||
        status === SubscriptionPaymentStatus.Failed
        ? false
        : CARD_PAYMENT_POLL_INTERVAL_MS
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  })
}
