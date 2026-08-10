import { useMerchantSetup } from './useMerchantSetup'

/**
 * Same gate as dashboard overview `hasSetup`:
 * store setup is complete when GET /api/v1/merchant/business returns data.
 */
export function useHasStoreSetup({ enabled = true }: { enabled?: boolean } = {}) {
  const { data, isLoading, isFetched, isError } = useMerchantSetup({ enabled })

  return {
    hasSetup: Boolean(data),
    isLoading: enabled && isLoading,
    /** True once we know whether setup exists (or the query is disabled). */
    isResolved: !enabled || isFetched || isError,
  }
}
