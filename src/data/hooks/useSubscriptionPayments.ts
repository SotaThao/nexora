import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import subscriptionPaymentsRepository, {
  SubscriptionBillingCycle,
  SubscriptionPackageType,
  SubscriptionPaymentStatus,
  type InitializeCardPaymentResult,
  type PurchasePackageByIdResult,
  type PurchaseSubscriptionResult,
  type SubscriptionPackage,
  type SubscriptionMyPackage,
  type SubscriptionPaymentMethod,
  type SubscriptionPurchaseHistoryItem,
  type SubscriptionPurchaseHistoryPage,
  type SubscriptionPurchaseHistoryQuery,
  type UpdateSubscriptionAutoRenewResult,
} from '../repositories/subscriptionPayments'

/** Page size used when polling purchase-history for a single order status. */
const ORDER_STATUS_POLL_HISTORY_PAGE_SIZE = 50

const CARD_PAYMENT_POLL_INTERVAL_MS = 2_000

/** Bust caches shared by TipPlatform wallet + card checkout success paths. */
export function invalidateSubscriptionPurchaseQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: qk.userProfile() })
  void queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionPaymentMethods() })
  void queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionPurchaseHistory() })
  void queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionMyPackages() })
}

export function findPurchaseHistoryItemByOrderRef(
  items: SubscriptionPurchaseHistoryItem[],
  orderRef: string,
): SubscriptionPurchaseHistoryItem | undefined {
  return items.find(
    (item) => item.orderId === orderRef || item.referenceId === orderRef,
  )
}

/** TanStack Query cache knobs shared by subscription list hooks. */
export type SubscriptionQueryCacheOptions = {
  staleTime?: number
  refetchOnMount?: boolean | 'always'
  gcTime?: number
}

function withOptionalGcTime(options: SubscriptionQueryCacheOptions): SubscriptionQueryCacheOptions {
  const { staleTime, refetchOnMount, gcTime } = options
  return {
    ...(staleTime !== undefined ? { staleTime } : {}),
    ...(refetchOnMount !== undefined ? { refetchOnMount } : {}),
    ...(gcTime !== undefined ? { gcTime } : {}),
  }
}

function patchMyPackagesAutoRenew(
  packages: SubscriptionMyPackage[] | undefined,
  subscriptionId: string,
  autoRenew: boolean,
): SubscriptionMyPackage[] {
  return (packages ?? []).map((pkg) =>
    pkg.id === subscriptionId ? { ...pkg, autoRenew } : pkg,
  )
}

export function useSubscriptionPackages({
  enabled = true,
  packageType,
  staleTime = 60_000,
  refetchOnMount,
  gcTime,
}: {
  enabled?: boolean
  packageType?: SubscriptionPackageType
} & SubscriptionQueryCacheOptions = {}) {
  return useQuery<SubscriptionPackage[]>({
    queryKey: qk.merchantSubscriptionPackages(packageType),
    queryFn: () => subscriptionPaymentsRepository.getPackages(packageType),
    enabled,
    staleTime,
    ...withOptionalGcTime({ refetchOnMount, gcTime }),
  })
}

/** GET `/api/v1/merchant/subscriptions/my-packages`. */
export function useSubscriptionMyPackages({
  enabled = true,
  staleTime = 30_000,
  refetchOnMount = true,
  gcTime,
}: {
  enabled?: boolean
} & SubscriptionQueryCacheOptions = {}) {
  return useQuery<SubscriptionMyPackage[]>({
    queryKey: qk.merchantSubscriptionMyPackages(),
    queryFn: () => subscriptionPaymentsRepository.getMyPackages(),
    enabled,
    ...withOptionalGcTime({ staleTime, refetchOnMount, gcTime }),
  })
}

/** PATCH `/api/v1/merchant/subscriptions/{id}/auto-renew`. */
export function useUpdateSubscriptionAutoRenew() {
  const queryClient = useQueryClient()
  const myPackagesKey = qk.merchantSubscriptionMyPackages()

  return useMutation<
    UpdateSubscriptionAutoRenewResult,
    Error,
    { subscriptionId: string; autoRenew: boolean },
    { previous: SubscriptionMyPackage[] | undefined }
  >({
    mutationFn: ({ subscriptionId, autoRenew }) =>
      subscriptionPaymentsRepository.updateAutoRenew(subscriptionId, autoRenew),
    onMutate: async ({ subscriptionId, autoRenew }) => {
      await queryClient.cancelQueries({ queryKey: myPackagesKey })
      const previous = queryClient.getQueryData<SubscriptionMyPackage[]>(myPackagesKey)
      queryClient.setQueryData<SubscriptionMyPackage[]>(myPackagesKey, (current) =>
        patchMyPackagesAutoRenew(current, subscriptionId, autoRenew),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (!context) return
      queryClient.setQueryData(myPackagesKey, context.previous)
    },
    onSuccess: (result) => {
      queryClient.setQueryData<SubscriptionMyPackage[]>(myPackagesKey, (current) =>
        patchMyPackagesAutoRenew(current, result.subscriptionId, result.autoRenew),
      )
    },
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
    // Balances change after purchases — always refetch on mount, never reuse stale cache.
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

/** GET `/api/v1/merchant/subscriptions/purchase-history` (server-paged). */
export function useSubscriptionPurchaseHistory({
  enabled = true,
  pageNumber = 1,
  pageSize = 10,
  staleTime = 30_000,
  refetchOnMount,
  gcTime,
}: {
  enabled?: boolean
  pageNumber?: number
  pageSize?: number
} & SubscriptionQueryCacheOptions = {}) {
  const query: SubscriptionPurchaseHistoryQuery = { pageNumber, pageSize }
  return useQuery<SubscriptionPurchaseHistoryPage>({
    queryKey: qk.merchantSubscriptionPurchaseHistory({ pageNumber, pageSize }),
    queryFn: () => subscriptionPaymentsRepository.getPurchaseHistory(query),
    enabled,
    placeholderData: keepPreviousData,
    ...withOptionalGcTime({ staleTime, refetchOnMount, gcTime }),
  })
}

/** Tip Platform wallet purchase — body `{ packageId, symbol, billingCycle? }`. */
export function usePurchaseSubscription() {
  const queryClient = useQueryClient()
  return useMutation<
    PurchaseSubscriptionResult,
    Error,
    { packageId: string; symbol: string; billingCycle?: SubscriptionBillingCycle }
  >({
    mutationFn: ({ packageId, symbol, billingCycle }) =>
      subscriptionPaymentsRepository.purchase(packageId, symbol, billingCycle),
    onSuccess: () => {
      invalidateSubscriptionPurchaseQueries(queryClient)
    },
  })
}

/**
 * After VoiceAI plan Paid: refresh profile/packages and tenant status so AI Hub
 * unlocks Booking / Customers / Call log / SMS / Settings (gated on hasVoiceTenant).
 */
export function invalidateVoiceAiPlanPurchaseQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: qk.userProfile() })
  queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionPaymentMethods() })
  queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionPurchaseHistory() })
  queryClient.invalidateQueries({
    queryKey: qk.merchantSubscriptionPackages(SubscriptionPackageType.VoiceAI),
  })
  queryClient.invalidateQueries({ queryKey: qk.merchantVoiceCreditWallet() })
  queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionMyPackages() })
  queryClient.invalidateQueries({ queryKey: qk.merchantVoiceTenantStatus() })
  queryClient.invalidateQueries({ queryKey: qk.merchantVoiceMyTenant() })
}

/** VoiceAI MD purchase — body `{ packageId, symbol, billingCycle? }`. */
export function usePurchaseVoiceAiPackage() {
  const queryClient = useQueryClient()
  return useMutation<
    PurchasePackageByIdResult,
    Error,
    { packageId: string; symbol: string; billingCycle?: SubscriptionBillingCycle }
  >({
    mutationFn: ({ packageId, symbol, billingCycle }) =>
      subscriptionPaymentsRepository.purchaseByPackageId(packageId, symbol, billingCycle),
    onSuccess: () => {
      invalidateVoiceAiPlanPurchaseQueries(queryClient)
    },
  })
}

/**
 * Refresh wallet / history after VoiceSms or VoiceCallMinutes top-up
 * (wallet purchase mutation or card order Paid).
 */
export function invalidateCreditTopUpQueries(
  queryClient: QueryClient,
  packageType: SubscriptionPackageType,
) {
  queryClient.invalidateQueries({ queryKey: qk.userProfile() })
  queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionPaymentMethods() })
  queryClient.invalidateQueries({ queryKey: qk.merchantSubscriptionPurchaseHistory() })
  queryClient.invalidateQueries({
    queryKey: qk.merchantSubscriptionPackages(packageType),
  })
  queryClient.invalidateQueries({ queryKey: qk.merchantVoiceCreditWallet() })
  queryClient.invalidateQueries({ queryKey: qk.merchantVoiceUsageActivityRoot() })

  if (packageType === SubscriptionPackageType.VoiceSms) {
    queryClient.invalidateQueries({ queryKey: qk.merchantVoiceSmsCampaignDashboard() })
    queryClient.invalidateQueries({ queryKey: qk.merchantVoiceSmsCreditsRoot() })
  }
}

export function usePurchaseCreditTopUp(packageType: SubscriptionPackageType) {
  const queryClient = useQueryClient()
  return useMutation<
    PurchasePackageByIdResult,
    Error,
    { packageId: string; symbol: string }
  >({
    mutationFn: ({ packageId, symbol }) =>
      subscriptionPaymentsRepository.purchaseByPackageId(packageId, symbol),
    onSuccess: () => {
      invalidateCreditTopUpQueries(queryClient, packageType)
    },
  })
}

export function useInitializeCardPayment() {
  return useMutation<
    InitializeCardPaymentResult,
    Error,
    { packageId: string; billingCycle?: SubscriptionBillingCycle }
  >({
    mutationFn: ({ packageId, billingCycle }) =>
      subscriptionPaymentsRepository.initializeCardPayment(packageId, billingCycle),
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
      // Newest orders land on page 1 — enough to resolve card webhook status.
      const history = await subscriptionPaymentsRepository.getPurchaseHistory({
        pageNumber: 1,
        pageSize: ORDER_STATUS_POLL_HISTORY_PAGE_SIZE,
      })
      return findPurchaseHistoryItemByOrderRef(history.items, orderId ?? '')
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
