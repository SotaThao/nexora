/**
 * Unit tests for merchant-staff TanStack Query hooks.
 *
 * Strategy:
 *   - Mock the repository modules so hooks are tested in isolation.
 *   - Wrap each renderHook in a fresh QueryClient + QueryClientProvider.
 *   - For mutations: assert the correct repository method is called AND that
 *     the merchantStaff query cache is invalidated on success.
 *
 * Coverage:
 *   useMerchantStaff()             — query returns staff list
 *   useInviteStaff()               — mutation calls repo.invite, invalidates cache
 *   useResendStaffInvite()         — mutation calls repo.resendInvite, invalidates
 *   useSearchMerchantStaff(q)      — query enabled only for non-empty q
 *   useSendStaffLinkRequest()      — mutation calls repo.sendLinkRequest, invalidates
 *   useUpdateMerchantStaffStatus() — mutation calls repo.updateStatus, invalidates
 *   useReorderMerchantStaff()      — mutation calls repo.reorder, invalidates
 *   useRemoveMerchantStaff()       — mutation calls repo.remove, invalidates
 *   useStaffInviteInfo(token)      — query enabled only when token is truthy
 *   useAcceptStaffInvite()         — mutation calls repo.acceptInvite
 */
import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { qk } from '@/data/queryKeys'

// ---------------------------------------------------------------------------
// Repository mocks — vi.mock is hoisted, factory must be inline.
// ---------------------------------------------------------------------------
vi.mock('@/data/repositories/merchantStaff', () => ({
  default: {
    list: vi.fn(),
    invite: vi.fn(),
    resendInvite: vi.fn(),
    search: vi.fn(),
    sendLinkRequest: vi.fn(),
    updateStatus: vi.fn(),
    reorder: vi.fn(),
    remove: vi.fn(),
  },
  merchantStaffRepository: {
    list: vi.fn(),
    invite: vi.fn(),
    resendInvite: vi.fn(),
    search: vi.fn(),
    sendLinkRequest: vi.fn(),
    updateStatus: vi.fn(),
    reorder: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@/data/repositories/staffInvites', () => ({
  default: {
    getInviteInfo: vi.fn(),
    acceptInvite: vi.fn(),
  },
  staffInvitesRepository: {
    getInviteInfo: vi.fn(),
    acceptInvite: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Import hooks AFTER mocks are defined
// ---------------------------------------------------------------------------
import {
  useMerchantStaff,
  useInviteStaff,
  useResendStaffInvite,
  useSearchMerchantStaff,
  useSendStaffLinkRequest,
  useUpdateMerchantStaffStatus,
  useReorderMerchantStaff,
  useRemoveMerchantStaff,
} from '@/data/hooks/useMerchantStaff'

import {
  useStaffInviteInfo,
  useAcceptStaffInvite,
} from '@/data/hooks/useStaffInvites'

// Import repository mocks for assertion/setup
import merchantStaffRepo from '@/data/repositories/merchantStaff'
import { staffInvitesRepository as staffInvitesRepo } from '@/data/repositories/staffInvites'

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

// ===========================================================================
// useMerchantStaff
// ===========================================================================
describe('useMerchantStaff', () => {
  beforeEach(() => vi.clearAllMocks())

  it('L2-H01: returns data from merchantStaffRepository.list()', async () => {
    const staffList = [
      { id: 'row-1', fullName: 'Jane', staffLinkId: 'link-1', isActive: true },
    ]
    merchantStaffRepo.list.mockResolvedValue(staffList)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useMerchantStaff(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(staffList)
    expect(merchantStaffRepo.list).toHaveBeenCalledTimes(1)
  })

  it('L2-H02: returns empty array when repository returns []', async () => {
    merchantStaffRepo.list.mockResolvedValue([])

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useMerchantStaff(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('L2-H03: does not fetch when enabled=false', async () => {
    merchantStaffRepo.list.mockResolvedValue([])

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useMerchantStaff({ enabled: false }),
      { wrapper }
    )

    // Give it a moment to confirm it stays idle
    await new Promise((r) => setTimeout(r, 50))
    expect(result.current.fetchStatus).toBe('idle')
    expect(merchantStaffRepo.list).not.toHaveBeenCalled()
  })

  it('L2-H04: surfaces error when repository rejects', async () => {
    const error = { status: 500, errorCode: 'INTERNAL_ERROR' }
    merchantStaffRepo.list.mockRejectedValue(error)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useMerchantStaff(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual(error)
  })
})

// ===========================================================================
// useInviteStaff
// ===========================================================================
describe('useInviteStaff', () => {
  beforeEach(() => vi.clearAllMocks())

  it('L2-H05: calls repo.invite and invalidates merchantStaff cache', async () => {
    merchantStaffRepo.invite.mockResolvedValue({ inviteId: 'inv-new' })
    merchantStaffRepo.list.mockResolvedValue([])

    const { queryClient, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useInviteStaff(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        name: 'John',
        email: 'john@example.com',
        phone: null,
        position: 'Nail Tech',
      })
    })

    expect(merchantStaffRepo.invite).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@example.com',
      phone: null,
      position: 'Nail Tech',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: qk.merchantStaff(),
    })
  })

  it('L2-H06: propagates error when repo.invite rejects', async () => {
    const error = { status: 400, errorCode: 'COMMON_VALIDATION_ERROR' }
    merchantStaffRepo.invite.mockRejectedValue(error)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useInviteStaff(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync({ name: '' })
      } catch (_) {
        // expected
      }
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual(error)
  })
})

// ===========================================================================
// useResendStaffInvite
// ===========================================================================
describe('useResendStaffInvite', () => {
  beforeEach(() => vi.clearAllMocks())

  it('L2-H07: calls repo.resendInvite and invalidates cache', async () => {
    merchantStaffRepo.resendInvite.mockResolvedValue(null)
    merchantStaffRepo.list.mockResolvedValue([])

    const { queryClient, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useResendStaffInvite(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync('inv-42')
    })

    expect(merchantStaffRepo.resendInvite).toHaveBeenCalledWith('inv-42')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: qk.merchantStaff(),
    })
  })
})

// ===========================================================================
// useSearchMerchantStaff
// ===========================================================================
describe('useSearchMerchantStaff', () => {
  beforeEach(() => vi.clearAllMocks())

  it('L2-H08: returns search results for non-empty query', async () => {
    const searchResults = [
      { staffProfileId: 'sp-1', fullName: 'Jane', avatar: null, position: 'Nail Tech' },
    ]
    merchantStaffRepo.search.mockResolvedValue(searchResults)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useSearchMerchantStaff('Jane'),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(searchResults)
    expect(merchantStaffRepo.search).toHaveBeenCalledWith('Jane')
  })

  it('L2-H09: does NOT fire when query is empty string', async () => {
    merchantStaffRepo.search.mockResolvedValue([])

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useSearchMerchantStaff(''),
      { wrapper }
    )

    await new Promise((r) => setTimeout(r, 50))
    expect(result.current.fetchStatus).toBe('idle')
    expect(merchantStaffRepo.search).not.toHaveBeenCalled()
  })

  it('L2-H10: does NOT fire when query is whitespace only', async () => {
    merchantStaffRepo.search.mockResolvedValue([])

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useSearchMerchantStaff('   '),
      { wrapper }
    )

    await new Promise((r) => setTimeout(r, 50))
    expect(result.current.fetchStatus).toBe('idle')
    expect(merchantStaffRepo.search).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// useSendStaffLinkRequest
// ===========================================================================
describe('useSendStaffLinkRequest', () => {
  beforeEach(() => vi.clearAllMocks())

  it('L2-H11: calls repo.sendLinkRequest and invalidates cache', async () => {
    merchantStaffRepo.sendLinkRequest.mockResolvedValue(null)
    merchantStaffRepo.list.mockResolvedValue([])

    const { queryClient, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useSendStaffLinkRequest(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync('sp-42')
    })

    expect(merchantStaffRepo.sendLinkRequest).toHaveBeenCalledWith('sp-42')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: qk.merchantStaff(),
    })
  })
})

// ===========================================================================
// useUpdateMerchantStaffStatus
// ===========================================================================
describe('useUpdateMerchantStaffStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('L2-H12: calls repo.updateStatus with staffLinkId + status and invalidates cache', async () => {
    merchantStaffRepo.updateStatus.mockResolvedValue(null)
    merchantStaffRepo.list.mockResolvedValue([])

    const { queryClient, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateMerchantStaffStatus(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ staffLinkId: 'link-1', status: 'Inactive' })
    })

    expect(merchantStaffRepo.updateStatus).toHaveBeenCalledWith('link-1', 'Inactive')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: qk.merchantStaff(),
    })
  })
})

// ===========================================================================
// useReorderMerchantStaff
// ===========================================================================
describe('useReorderMerchantStaff', () => {
  beforeEach(() => vi.clearAllMocks())

  it('L2-H13: calls repo.reorder and invalidates cache', async () => {
    merchantStaffRepo.reorder.mockResolvedValue(null)
    merchantStaffRepo.list.mockResolvedValue([])

    const { queryClient, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const items = [
      { staffLinkId: 'link-1', sortOrder: 0 },
      { staffLinkId: 'link-2', sortOrder: 1 },
    ]

    const { result } = renderHook(() => useReorderMerchantStaff(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(items)
    })

    expect(merchantStaffRepo.reorder).toHaveBeenCalledWith(items)
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: qk.merchantStaff(),
    })
  })
})

// ===========================================================================
// useRemoveMerchantStaff
// ===========================================================================
describe('useRemoveMerchantStaff', () => {
  beforeEach(() => vi.clearAllMocks())

  it('L2-H14: calls repo.remove and invalidates cache', async () => {
    merchantStaffRepo.remove.mockResolvedValue(null)
    merchantStaffRepo.list.mockResolvedValue([])

    const { queryClient, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRemoveMerchantStaff(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync('link-99')
    })

    expect(merchantStaffRepo.remove).toHaveBeenCalledWith('link-99')
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: qk.merchantStaff(),
    })
  })

  it('L2-H15: propagates error when repo.remove rejects', async () => {
    const error = { status: 404, errorCode: 'COMMON_NOT_FOUND' }
    merchantStaffRepo.remove.mockRejectedValue(error)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useRemoveMerchantStaff(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync('link-missing')
      } catch (_) {
        // expected
      }
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual(error)
  })
})

// ===========================================================================
// useStaffInviteInfo
// ===========================================================================
describe('useStaffInviteInfo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('L2-H16: returns invite info for valid token', async () => {
    const inviteInfo = {
      invitedName: 'Lisa Tran',
      invitedPosition: 'Nail Tech',
      businessName: 'Pretty Nails',
    }
    staffInvitesRepo.getInviteInfo.mockResolvedValue(inviteInfo)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useStaffInviteInfo('abc-token-123'),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(inviteInfo)
    expect(staffInvitesRepo.getInviteInfo).toHaveBeenCalledWith('abc-token-123')
  })

  it('L2-H17: does NOT fire when token is null', async () => {
    staffInvitesRepo.getInviteInfo.mockResolvedValue({})

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useStaffInviteInfo(null),
      { wrapper }
    )

    await new Promise((r) => setTimeout(r, 50))
    expect(result.current.fetchStatus).toBe('idle')
    expect(staffInvitesRepo.getInviteInfo).not.toHaveBeenCalled()
  })

  it('L2-H18: does NOT fire when token is undefined', async () => {
    staffInvitesRepo.getInviteInfo.mockResolvedValue({})

    const { wrapper } = makeWrapper()
    const { result } = renderHook(
      () => useStaffInviteInfo(undefined),
      { wrapper }
    )

    await new Promise((r) => setTimeout(r, 50))
    expect(result.current.fetchStatus).toBe('idle')
    expect(staffInvitesRepo.getInviteInfo).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// useAcceptStaffInvite
// ===========================================================================
describe('useAcceptStaffInvite', () => {
  beforeEach(() => vi.clearAllMocks())

  it('L2-H19: calls repo.acceptInvite with token and body', async () => {
    staffInvitesRepo.acceptInvite.mockResolvedValue(undefined)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAcceptStaffInvite(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        token: 'token-xyz',
        displayName: 'Lisa Tran',
        position: 'Nail Tech',
        bio: 'Gel specialist',
        photoUrl: 'https://example.com/photo.jpg',
      })
    })

    expect(staffInvitesRepo.acceptInvite).toHaveBeenCalledWith(
      'token-xyz',
      {
        displayName: 'Lisa Tran',
        position: 'Nail Tech',
        bio: 'Gel specialist',
        photoUrl: 'https://example.com/photo.jpg',
      }
    )
  })

  it('L2-H20: propagates error when repo.acceptInvite rejects', async () => {
    const error = { status: 400, errorCode: 'INVITE_EXPIRED' }
    staffInvitesRepo.acceptInvite.mockRejectedValue(error)

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAcceptStaffInvite(), { wrapper })

    await act(async () => {
      try {
        await result.current.mutateAsync({
          token: 'expired-token',
          displayName: 'Nobody',
        })
      } catch (_) {
        // expected
      }
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error).toEqual(error)
  })
})
