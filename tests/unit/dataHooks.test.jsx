/**
 * Unit tests for per-domain TanStack Query hooks.
 *
 * Strategy:
 *   - Mock each repository module so hooks are tested in isolation without
 *     touching real storage.
 *   - Wrap the rendered hook in a fresh QueryClientProvider per test to keep
 *     cache state isolated.
 *   - Use @testing-library/react `renderHook` + `waitFor` for async assertions.
 *
 * Coverage (representative, not exhaustive):
 *   - useTransactions()       → query returns repository data
 *   - useAddTransaction()     → mutation calls repo.add, then invalidates
 *   - useUpdateTransaction()  → mutation calls repo.update, then invalidates
 *   - useMerchantSetup()      → query returns repository data
 *   - useSaveMerchantSetup()  → mutation calls repo.saveSetup
 *   - useProfileSettings()    → query returns repository data
 *   - useReviews()            → query returns repository data
 *   - useNotifications()      → query returns repository data
 *   - useStaffAccount(id)     → query calls repo.get(staffId)
 *   - useSaveStaffAccount()   → mutation calls repo.save(staffId, data)
 *   - usePendingAccounts()    → query returns repository data
 */
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Repository mocks — vi.mock is hoisted, factory must be inline.
// Each mock exposes every method used by the corresponding hook.
// ---------------------------------------------------------------------------
vi.mock('../../src/data/repositories/transactions', () => ({
  default: {
    list: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../../src/data/repositories/merchants', () => ({
  default: {
    getSetup: vi.fn(),
    saveSetup: vi.fn(),
    getStaffList: vi.fn(),
    saveStaffList: vi.fn(),
  },
}))

vi.mock('../../src/data/repositories/profileSettings', () => ({
  default: {
    get: vi.fn(),
    save: vi.fn(),
  },
}))

vi.mock('../../src/data/repositories/reviews', () => ({
  default: {
    list: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('../../src/data/repositories/notifications', () => ({
  default: {
    list: vi.fn(),
    add: vi.fn(),
    markRead: vi.fn(),
    replaceAll: vi.fn(),
  },
}))

vi.mock('../../src/data/repositories/staffAccounts', () => ({
  default: {
    get: vi.fn(),
    save: vi.fn(),
    getAll: vi.fn(),
  },
}))

vi.mock('../../src/data/repositories/pendingAccounts', () => ({
  default: {
    list: vi.fn(),
    add: vi.fn(),
    replaceAll: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Import hooks AFTER mocks are defined.
// ---------------------------------------------------------------------------
import { useTransactions, useAddTransaction, useUpdateTransaction } from '../../src/data/hooks/useTransactions'
import { useMerchantSetup, useSaveMerchantSetup } from '../../src/data/hooks/useMerchantSetup'
import { useProfileSettings } from '../../src/data/hooks/useProfileSettings'
import { useReviews } from '../../src/data/hooks/useReviews'
import { useNotifications } from '../../src/data/hooks/useNotifications'
import { useStaffAccount, useSaveStaffAccount } from '../../src/data/hooks/useStaffAccount'
import { usePendingAccounts } from '../../src/data/hooks/usePendingAccounts'

// Import repository mocks for assertion/setup
import transactionsRepository from '../../src/data/repositories/transactions'
import merchantsRepository from '../../src/data/repositories/merchants'
import profileSettingsRepository from '../../src/data/repositories/profileSettings'
import reviewsRepository from '../../src/data/repositories/reviews'
import notificationsRepository from '../../src/data/repositories/notifications'
import staffAccountsRepository from '../../src/data/repositories/staffAccounts'
import pendingAccountsRepository from '../../src/data/repositories/pendingAccounts'

// ---------------------------------------------------------------------------
// Helper: create a fresh QueryClient + wrapper per test
// ---------------------------------------------------------------------------
function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

// ---------------------------------------------------------------------------
// useTransactions
// ---------------------------------------------------------------------------
describe('useTransactions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns data from transactionsRepository.list()', async () => {
    const txList = [{ id: 'TX-1', amount: 10 }]
    transactionsRepository.list.mockResolvedValue(txList)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useTransactions(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(txList)
    expect(transactionsRepository.list).toHaveBeenCalledTimes(1)
  })

  it('returns empty array when repository returns []', async () => {
    transactionsRepository.list.mockResolvedValue([])

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useTransactions(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// useAddTransaction
// ---------------------------------------------------------------------------
describe('useAddTransaction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls transactionsRepository.add with the given transaction', async () => {
    const tx = { id: 'TX-2', amount: 50 }
    transactionsRepository.add.mockResolvedValue(tx)
    transactionsRepository.list.mockResolvedValue([tx])

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAddTransaction(), { wrapper })

    result.current.mutate(tx)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(transactionsRepository.add).toHaveBeenCalledWith(tx)
  })
})

// ---------------------------------------------------------------------------
// useUpdateTransaction
// ---------------------------------------------------------------------------
describe('useUpdateTransaction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls transactionsRepository.update with id and patch', async () => {
    transactionsRepository.update.mockResolvedValue(undefined)
    transactionsRepository.list.mockResolvedValue([])

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateTransaction(), { wrapper })

    result.current.mutate({ id: 'TX-1', patch: { status: 'Success' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(transactionsRepository.update).toHaveBeenCalledWith('TX-1', { status: 'Success' })
  })
})

// ---------------------------------------------------------------------------
// useMerchantSetup
// ---------------------------------------------------------------------------
describe('useMerchantSetup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns data from merchantsRepository.getSetup()', async () => {
    const setup = { businessInfo: { name: 'Golden Glow' }, staffList: [] }
    merchantsRepository.getSetup.mockResolvedValue(setup)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useMerchantSetup(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(setup)
  })

  it('returns null when no setup exists', async () => {
    merchantsRepository.getSetup.mockResolvedValue(null)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useMerchantSetup(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// useSaveMerchantSetup
// ---------------------------------------------------------------------------
describe('useSaveMerchantSetup', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls merchantsRepository.saveSetup with the setup blob', async () => {
    const setup = { businessInfo: { name: 'Spa' } }
    merchantsRepository.saveSetup.mockResolvedValue(undefined)
    merchantsRepository.getSetup.mockResolvedValue(setup)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSaveMerchantSetup(), { wrapper })

    result.current.mutate(setup)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(merchantsRepository.saveSetup).toHaveBeenCalledWith(setup)
  })
})

// ---------------------------------------------------------------------------
// useProfileSettings
// ---------------------------------------------------------------------------
describe('useProfileSettings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns data from profileSettingsRepository.get()', async () => {
    const settings = { theme: 'dark', language: 'en' }
    profileSettingsRepository.get.mockResolvedValue(settings)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useProfileSettings(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(settings)
  })
})

// ---------------------------------------------------------------------------
// useReviews
// ---------------------------------------------------------------------------
describe('useReviews', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns data from reviewsRepository.list()', async () => {
    const reviews = [{ id: 'R-1', rating: 5 }]
    reviewsRepository.list.mockResolvedValue(reviews)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useReviews(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(reviews)
  })
})

// ---------------------------------------------------------------------------
// useNotifications
// ---------------------------------------------------------------------------
describe('useNotifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns data from notificationsRepository.list()', async () => {
    const notifications = [{ id: 'N-1', message: 'Hello', read: false }]
    notificationsRepository.list.mockResolvedValue(notifications)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useNotifications(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(notifications)
  })
})

// ---------------------------------------------------------------------------
// useStaffAccount
// ---------------------------------------------------------------------------
describe('useStaffAccount', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls staffAccountsRepository.get with the given staffId', async () => {
    const account = { fullName: 'Mia', pin: '1234' }
    staffAccountsRepository.get.mockResolvedValue(account)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useStaffAccount('s-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(account)
    expect(staffAccountsRepository.get).toHaveBeenCalledWith('s-1')
  })

  it('returns null when staffId is not found', async () => {
    staffAccountsRepository.get.mockResolvedValue(null)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useStaffAccount('unknown'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// useSaveStaffAccount
// ---------------------------------------------------------------------------
describe('useSaveStaffAccount', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls staffAccountsRepository.save with staffId and data', async () => {
    staffAccountsRepository.save.mockResolvedValue(undefined)
    staffAccountsRepository.get.mockResolvedValue({ fullName: 'Mia', pin: '9999' })

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useSaveStaffAccount(), { wrapper })

    result.current.mutate({ staffId: 's-1', data: { pin: '9999' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(staffAccountsRepository.save).toHaveBeenCalledWith('s-1', { pin: '9999' })
  })
})

// ---------------------------------------------------------------------------
// usePendingAccounts
// ---------------------------------------------------------------------------
describe('usePendingAccounts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns data from pendingAccountsRepository.list()', async () => {
    const accounts = [{ email: 'owner@test.com' }]
    pendingAccountsRepository.list.mockResolvedValue(accounts)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePendingAccounts(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(accounts)
  })

  it('returns empty array when no accounts exist', async () => {
    pendingAccountsRepository.list.mockResolvedValue([])

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePendingAccounts(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})
