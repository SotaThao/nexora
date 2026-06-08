import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { apiAuthAdapter } from '../apiAuthAdapter'
import { tokenStore } from '../../tokenStore'

describe('apiAuthAdapter', () => {
  beforeEach(() => {
    tokenStore.clear()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should sign in successfully, save tokens, and return reconstructed session', async () => {
    const mockSigninResponse = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      tokenType: 'Bearer',
      expiresIn: 3600,
    }

    const mockProfileResponse = {
      id: 'user-uuid',
      email: 'owner@salon.com',
      firstName: 'Mia',
      lastName: 'Tran',
      profileType: 'Merchant',
      status: 'kyb_approved',
    }

    // Mock signin
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockSigninResponse),
    })

    // Mock profile
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockProfileResponse),
    })

    const session = await apiAuthAdapter.login({ email: 'owner@salon.com', password: 'password123' })

    expect(tokenStore.get()).toEqual(mockSigninResponse)
    expect(session).toEqual({
      id: 'user-uuid',
      email: 'owner@salon.com',
      accountType: 'business',
      flag: '!business',
      displayName: 'Mia Tran',
      role: 'owner',
      staffId: null,
      accountStatus: 'kyb_approved',
      hasCompletedOnboarding: true,
      verificationStatus: 'kyb_approved',
      ssoPrefillData: null,
    })

    // Shape parity check
    const mockKeys = [
      'id',
      'email',
      'accountType',
      'flag',
      'displayName',
      'role',
      'staffId',
      'verificationStatus',
      'ssoPrefillData',
    ]
    mockKeys.forEach((key) => {
      expect(session).toHaveProperty(key)
    })
  })

  it('should map User profileType to staff/personal session', async () => {
    const mockSigninResponse = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    }

    const mockProfileResponse = {
      id: 'staff-uuid',
      email: 'staff@salon.com',
      firstName: 'Jane',
      lastName: 'Doe',
      profileType: 'User',
      status: 'active',
    }

    // Mock signin
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockSigninResponse),
    })

    // Mock profile
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockProfileResponse),
    })

    const session = await apiAuthAdapter.login({ email: 'staff@salon.com', password: 'password123' })

    expect(session).toEqual({
      id: 'staff-uuid',
      email: 'staff@salon.com',
      accountType: 'personal',
      flag: '!personal',
      displayName: 'Jane Doe',
      role: 'staff',
      staffId: null,
      accountStatus: 'active',
      hasCompletedOnboarding: undefined,
      verificationStatus: 'active',
      ssoPrefillData: null,
    })
  })

  it('should not treat an Active merchant profile as KYB approved', async () => {
    const mockSigninResponse = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    }

    const mockProfileResponse = {
      id: 'merchant-uuid',
      email: 'biz-owner@salon.com',
      firstName: 'Mia',
      lastName: 'Tran',
      profileType: 'Merchant',
      status: 'Active',
    }

    const mockVerifiedStatusResponse = {
      status: 'Active',
      isVerified: true,
    }

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockSigninResponse),
    })

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockProfileResponse),
    })

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockVerifiedStatusResponse),
    })

    const session = await apiAuthAdapter.login({ email: 'biz-owner@salon.com', password: 'password123' })

    expect(session).toEqual({
      id: 'merchant-uuid',
      email: 'biz-owner@salon.com',
      accountType: 'business',
      flag: '!business',
      displayName: 'Mia Tran',
      role: 'owner',
      staffId: null,
      accountStatus: 'Active',
      hasCompletedOnboarding: true,
      verificationStatus: 'basic',
      ssoPrefillData: null,
    })
  })

  it('should use explicit business KYB status when available', async () => {
    const mockSigninResponse = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    }

    const mockProfileResponse = {
      id: 'merchant-uuid',
      email: 'owner@salon.com',
      firstName: 'Mia',
      lastName: 'Tran',
      profileType: 'Merchant',
      status: 'Active',
    }

    const mockVerifiedStatusResponse = {
      businessKybStatus: 'Approved',
    }

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockSigninResponse),
    })

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockProfileResponse),
    })

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockVerifiedStatusResponse),
    })

    const session = await apiAuthAdapter.login({ email: 'owner@salon.com', password: 'password123' })

    expect(session.verificationStatus).toBe('kyb_approved')
    expect(session.accountStatus).toBe('Active')
    expect(session.hasCompletedOnboarding).toBe(true)
  })

  it('should return null on getSession if tokens are absent', async () => {
    const session = await apiAuthAdapter.getSession()
    expect(session).toBeNull()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('should restore session from tokens on getSession', async () => {
    tokenStore.set({ accessToken: 'access-123', refreshToken: 'refresh-456' })

    const mockProfileResponse = {
      id: 'user-uuid',
      email: 'owner@salon.com',
      firstName: 'Mia',
      lastName: 'Tran',
      profileType: 'Merchant',
      status: 'kyb_approved',
    }

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockProfileResponse),
    })

    const session = await apiAuthAdapter.getSession()
    expect(session).toEqual({
      id: 'user-uuid',
      email: 'owner@salon.com',
      accountType: 'business',
      flag: '!business',
      displayName: 'Mia Tran',
      role: 'owner',
      staffId: null,
      accountStatus: 'kyb_approved',
      hasCompletedOnboarding: true,
      verificationStatus: 'kyb_approved',
      ssoPrefillData: null,
    })
  })

  it('should clear tokenStore on logout', async () => {
    tokenStore.set({ accessToken: 'access-123', refreshToken: 'refresh-456' })
    expect(tokenStore.get()).not.toBeNull()

    await apiAuthAdapter.logout()
    expect(tokenStore.get()).toBeNull()
  })

  it('should propagate signup errors correctly', async () => {
    const errorBody = {
      errorCode: 'USER_EMAIL_ALREADY_EXISTS',
      errors: { email: ['Already exists'] },
    }

    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Headers(),
      text: async () => JSON.stringify(errorBody),
    })

    await expect(
      apiAuthAdapter.signup({
        email: 'taken@salon.com',
        password: 'password',
        confirmPassword: 'password',
        firstName: 'A',
        lastName: 'B',
        profileType: 'Merchant',
      })
    ).rejects.toEqual({
      status: 400,
      errorCode: 'USER_EMAIL_ALREADY_EXISTS',
      errors: { email: ['Already exists'] },
      retryAfter: null,
    })
  })
})
