import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import subscriptionPaymentsRepository, {
  SubscriptionPackageType,
  type PurchasableSubscriptionPlan,
  type PurchasePackageByIdResult,
  type PurchaseSubscriptionResult,
  type SubscriptionPackage,
  type SubscriptionPaymentMethod,
  type SubscriptionPurchaseHistoryItem,
} from '../repositories/subscriptionPayments'

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

/** Legacy Touch purchase — body `{ plan, symbol }`. */
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
