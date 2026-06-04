import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/data/repositories/pendingAccounts', () => ({
  default: {
    list: vi.fn(),
    add: vi.fn(),
    findByEmail: vi.fn(),
    replaceAll: vi.fn(),
  },
}))

import pendingAccountsRepository from '../../src/data/repositories/pendingAccounts'
import { mockAuthAdapter } from '../../src/auth/adapters/mockAuthAdapter'
import AuthProvider from '../../src/auth/AuthProvider'
import { useAuth } from '../../src/auth/useAuth'

const businessAccount = {
  email: 'owner@example.com',
  password: 'secret123',
  role: 'business',
  fullName: 'Owner Example',
  isVerified: true,
  verificationStatus: 'kyb_approved',
  kybDetails: {
    legalName: 'Owner Example LLC',
    businessType: 'LLC',
    bankAccount: '00001234',
  },
}

const staffAccount = {
  email: 'mia@example.com',
  password: 'secret123',
  role: 'staff',
  fullName: 'Mia Tran',
  staffId: 'NEX-STAFF-MIA0123',
  isVerified: true,
}

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('mockAuthAdapter', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    pendingAccountsRepository.list.mockResolvedValue([])
    await mockAuthAdapter.logout()
  })

  it('rejects missing credentials with the stable error code', async () => {
    await expect(mockAuthAdapter.login({ email: '', password: '' })).rejects.toThrow('missing_credentials')
  })

  it('rejects incorrect passwords for registered accounts', async () => {
    pendingAccountsRepository.list.mockResolvedValue([businessAccount])

    await expect(mockAuthAdapter.login({
      email: businessAccount.email,
      password: 'wrong-password',
    })).rejects.toThrow('incorrect_password')
  })

  it('returns a business session with KYB prefill and no password field', async () => {
    pendingAccountsRepository.list.mockResolvedValue([businessAccount])

    const session = await mockAuthAdapter.login({
      email: businessAccount.email,
      password: businessAccount.password,
    })

    expect(session).toMatchObject({
      email: businessAccount.email,
      accountType: 'business',
      flag: '!business',
      role: 'owner',
      verificationStatus: 'kyb_approved',
    })
    expect(session.ssoPrefillData).toMatchObject({
      name: businessAccount.kybDetails.legalName,
      paymentAccounts: { vlinkpay: 'VLP-1234' },
    })
    expect(session).not.toHaveProperty('password')
  })

  it('returns a personal/staff session with staff identity and no password field', async () => {
    pendingAccountsRepository.list.mockResolvedValue([staffAccount])

    const session = await mockAuthAdapter.login({
      email: staffAccount.email,
      password: staffAccount.password,
    })

    expect(session).toMatchObject({
      email: staffAccount.email,
      accountType: 'personal',
      flag: '!personal',
      role: 'staff',
      staffId: staffAccount.staffId,
    })
    expect(session).not.toHaveProperty('password')
  })

  it('returns SSO no-KYB sessions with route-to-dashboard metadata', async () => {
    pendingAccountsRepository.list.mockResolvedValue([])

    const session = await mockAuthAdapter.login({
      email: '',
      password: '',
      ssoType: 'sso_no_kyb',
      simulatedStatus: 'basic',
    })

    expect(session).toMatchObject({
      email: 'sso_no_kyb@gmail.com',
      accountType: 'business',
      flag: '!business',
      role: 'owner',
      verificationStatus: 'basic',
      clearMerchantSetup: true,
      clearProfileSettings: true,
      routeToDashboard: true,
    })
    expect(session.ssoPrefillData).toMatchObject({
      email: 'sso_no_kyb@gmail.com',
      name: 'Golden Glow Nails',
    })
  })

  it('routes fallback logins to staff when merchant setup contains the email', async () => {
    pendingAccountsRepository.list.mockResolvedValue([])
    localStorage.setItem('nexora_merchant_setup', JSON.stringify({
      staffList: [
        { id: 'NEX-STAFF-LISA1102', email: 'lisa@example.com', fullName: 'Lisa Tran' },
      ],
    }))

    const session = await mockAuthAdapter.login({
      email: 'lisa@example.com',
      password: 'secret123',
    })

    expect(session).toMatchObject({
      email: 'lisa@example.com',
      flag: '!business',
      role: 'staff',
      staffId: 'NEX-STAFF-LISA1102',
      displayName: 'Lisa Tran',
    })
  })
})

describe('AuthProvider/useAuth', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    pendingAccountsRepository.list.mockResolvedValue([])
    await mockAuthAdapter.logout()
  })

  it('restores anonymous state, logs in, and logs out through useAuth', async () => {
    pendingAccountsRepository.list.mockResolvedValue([staffAccount])

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.status).toBe('anonymous')
      expect(result.current.session).toBeNull()
    })

    await act(async () => {
      await result.current.login({
        email: staffAccount.email,
        password: staffAccount.password,
      })
    })

    expect(result.current.status).toBe('authenticated')
    expect(result.current.session).toMatchObject({
      email: staffAccount.email,
      role: 'staff',
      staffId: staffAccount.staffId,
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.status).toBe('anonymous')
    expect(result.current.session).toBeNull()
  })
})
