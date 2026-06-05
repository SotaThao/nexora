import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('./contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }) => children,
  useNotification: () => ({
    showToast: vi.fn(),
    showConfirm: vi.fn(() => Promise.resolve(true))
  })
}));

// ---------------------------------------------------------------------------
// Patch @testing-library/react so every render() gets a QueryClientProvider.
//
// @testing-library/react v16 has no global `wrapper` config option, so we
// intercept the module export via vi.mock + importActual.
//
// The wrapper also pre-populates the QueryClient cache from localStorage for
// the domain keys (matching the storage-adapter prefix = '' in test env).
// This ensures tests that seed localStorage before render() see the data
// immediately — preserving the same behaviour as the old direct-storage reads.
// ---------------------------------------------------------------------------
const DOMAIN_QUERY_KEYS = {
  nexora_notifications:    ['notifications'],
  nexora_transactions:     ['transactions'],
  nexora_reviews:          ['reviews'],
  nexora_merchant_setup:   ['merchantSetup'],
  nexora_profile_settings: ['profileSettings'],
  nexora_pending_accounts: ['pendingAccounts'],
}

vi.mock('@testing-library/react', async (importActual) => {
  const actual = await importActual();

  function makeTestQueryClient() {
    return new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0, gcTime: 0 },
        mutations: { retry: false },
      },
    });
  }

  function seedCacheFromLocalStorage(queryClient) {
    for (const [storageKey, queryKey] of Object.entries(DOMAIN_QUERY_KEYS)) {
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw !== null) {
          queryClient.setQueryData(queryKey, JSON.parse(raw))
        }
      } catch (_e) {
        // ignore parse errors
      }
    }
  }

  function wrappedRender(ui, options = {}) {
    const testQueryClient = makeTestQueryClient();
    seedCacheFromLocalStorage(testQueryClient);
    const { wrapper: UserWrapper, ...rest } = options;
    const Wrapper = ({ children }) => {
      const inner = UserWrapper
        ? React.createElement(UserWrapper, null, children)
        : children;
      return React.createElement(QueryClientProvider, { client: testQueryClient }, inner);
    };
    return actual.render(ui, { ...rest, wrapper: Wrapper });
  }

  return {
    ...actual,
    render: wrappedRender,
  };
});
