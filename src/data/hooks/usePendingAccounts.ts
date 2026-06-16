/**
 * usePendingAccounts — no-op hooks (API-only mode).
 *
 * The pendingAccounts domain was a storage-mode simulation construct for
 * tracking locally registered accounts. In API mode, registration is
 * handled server-side and this data is not needed.
 *
 * These hooks return empty data / no-op mutations to preserve the interface
 * consumed by existing components without breaking imports.
 */

export function usePendingAccounts() {
  return { data: [], isLoading: false, isError: false, error: null }
}

export function useAddPendingAccount() {
  return { mutate: () => {}, mutateAsync: async (account) => account }
}

export function useReplaceAllPendingAccounts() {
  return {
    mutate: (_list?: unknown) => {},
    mutateAsync: async (_list?: unknown) => {},
  }
}
