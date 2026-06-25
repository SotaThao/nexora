import '@testing-library/jest-dom'
import React, { type ReactElement, type ReactNode } from 'react'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { RenderOptions, RenderResult } from '@testing-library/react'
import { LanguageProvider } from './contexts/LanguageContext'

vi.mock('./contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: ReactNode }) => children,
  useNotification: () => ({
    showToast: vi.fn(),
    showConfirm: vi.fn(() => Promise.resolve(true)),
  }),
}))

const DOMAIN_QUERY_KEYS: Record<string, string[]> = {
  nexora_notifications: ['notifications'],
  nexora_transactions: ['transactions'],
  nexora_reviews: ['reviews'],
  nexora_merchant_setup: ['merchantSetup'],
  nexora_profile_settings: ['profileSettings'],
  nexora_pending_accounts: ['pendingAccounts'],
}

vi.mock('@testing-library/react', async (importActual) => {
  const actual = await importActual<typeof import('@testing-library/react')>()

  function makeTestQueryClient() {
    return new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0, gcTime: 0 },
        mutations: { retry: false },
      },
    })
  }

  function seedCacheFromLocalStorage(queryClient: QueryClient) {
    for (const [storageKey, queryKey] of Object.entries(DOMAIN_QUERY_KEYS)) {
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw !== null) {
          queryClient.setQueryData(queryKey, JSON.parse(raw))
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  function wrappedRender(ui: ReactElement, options: RenderOptions = {}): RenderResult {
    const testQueryClient = makeTestQueryClient()
    seedCacheFromLocalStorage(testQueryClient)
    const { wrapper: UserWrapper, ...rest } = options
    const Wrapper = ({ children }: { children: ReactNode }) => {
      const inner = UserWrapper
        ? React.createElement(UserWrapper, null, children)
        : children
      return React.createElement(
        LanguageProvider,
        null,
        React.createElement(QueryClientProvider, { client: testQueryClient }, inner),
      )
    }
    return actual.render(ui, { ...rest, wrapper: Wrapper })
  }

  return {
    ...actual,
    render: wrappedRender,
  }
})
