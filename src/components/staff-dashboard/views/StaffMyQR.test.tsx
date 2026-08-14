import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StaffMyQR from './StaffMyQR'

const staffAccountMock = vi.hoisted(() => ({
  useStaffAccount: vi.fn(),
}))

const profileSettingsMock = vi.hoisted(() => ({
  useProfileSettings: vi.fn(),
}))

const staffSelfMock = vi.hoisted(() => ({
  useStaffBusinessTipQrs: vi.fn(),
}))

const staffInvitesMock = vi.hoisted(() => ({
  useJoinPublicInvite: vi.fn(),
}))

const staffPaymentsMock = vi.hoisted(() => ({
  useStaffPaymentQr: vi.fn(),
}))

const staffPaymentMethodsMock = vi.hoisted(() => ({
  useStaffPaymentMethods: vi.fn(),
}))

vi.mock('../../../contexts/StaffAccountContext', () => staffAccountMock)
vi.mock('../../../data/hooks/useProfileSettings', () => profileSettingsMock)
vi.mock('../../../data/hooks/useStaffSelf', () => staffSelfMock)
vi.mock('../../../data/hooks/useStaffInvites', () => staffInvitesMock)
vi.mock('../../../data/hooks/useStaffPayments', () => staffPaymentsMock)
vi.mock('../../../data/hooks/useStaffPaymentMethods', () => staffPaymentMethodsMock)

describe('StaffMyQR payment payout settings', () => {
  beforeEach(() => {
    staffAccountMock.useStaffAccount.mockReturnValue({
      staffMember: {
        id: 'staff-1',
        nickname: 'Mia',
      },
      account: {
        staffCode: 'STF-001',
        defaultDisplayName: 'Mia Tran',
      },
    })
    profileSettingsMock.useProfileSettings.mockReturnValue({
      data: {
        referralCode: 'REF123',
      },
    })
    staffSelfMock.useStaffBusinessTipQrs.mockReturnValue({
      businessTipQrs: [],
      isLoading: false,
    })
    staffInvitesMock.useJoinPublicInvite.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    })
    staffPaymentsMock.useStaffPaymentQr.mockReturnValue({
      data: {
        staffProfileId: 'staff-1',
        paymentUrl: 'https://pay.example.com/staff/staff-1',
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    staffPaymentMethodsMock.useStaffPaymentMethods.mockReturnValue({
      data: [
        {
          id: 'spm-zelle',
          type: 'Zelle',
          uiKey: 'zelle',
          name: 'Zelle',
          accountInfo: 'mia@example.com',
          accountName: 'Mia Tran',
          imageUrl: 'https://cdn.example.com/zelle-qr.png',
          isActive: true,
          isConfigured: true,
        },
      ],
      isLoading: false,
    })
  })

  it('opens the existing payout detail modal from a payout settings method', async () => {
    render(
      <MemoryRouter
        initialEntries={['/staff/qr?tab=payment']}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <StaffMyQR />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Payout settings')).toBeInTheDocument()
    const methodName = screen.getByText('Zelle')
    const activeBadge = screen.getByText('Active').closest('span')

    expect(methodName.parentElement).toHaveTextContent('Active')
    expect(activeBadge?.querySelector('svg')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /view zelle payout details/i }))

    expect(await screen.findByRole('dialog', { name: 'Zelle' })).toBeInTheDocument()
    expect(screen.getByText('ZELLE REGISTERED NAME')).toBeInTheDocument()
    expect(screen.getByText('EMAIL OR PHONE')).toBeInTheDocument()
  })
})
