import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import SettingsViewMobile from './SettingsView.mobile'

const { mutation } = vi.hoisted(() => ({
  mutation: () => ({
    isPending: false,
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  }),
}))

vi.mock('../contexts/LanguageContext', () => ({
  useTranslation: () => ({
    currentLanguage: 'en',
    setLanguage: vi.fn(),
    t: (key: string) => key === 'dashboard.menu.staff' ? 'Staff' : key,
  }),
}))

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({ showToast: vi.fn() }),
}))

vi.mock('../auth/useAuth', () => ({
  default: () => ({
    logout: vi.fn(),
    session: { accountType: 'business' },
  }),
}))

vi.mock('../data/hooks/useProfileSettings', () => ({
  useProfileSettings: () => ({ data: undefined }),
  useUpdateAddress: mutation,
  useUpdateAvatar: mutation,
  useUpdateBasicInfo: mutation,
  useUpdateUserProfile: mutation,
  useVerifiedStatus: () => ({ data: undefined }),
}))

vi.mock('../data/hooks/useMerchantSetup', () => ({
  useUpdateBusiness: mutation,
  useUpdateBusinessInfo: mutation,
  useUpdateBusinessLogo: mutation,
  useUpdateReviewLinks: mutation,
}))

vi.mock('./settings/tabs/ProfileTab', () => ({
  default: () => <div>Profile content</div>,
}))

vi.mock('./settings/tabs/KybTab', () => ({
  default: () => <div>KYB content</div>,
}))

describe('SettingsViewMobile Staff navigation', () => {
  it('opens the injected Staff content from the Settings menu', () => {
    const onTabChange = vi.fn()
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard/settings/profile']}>
          <SettingsViewMobile
            setupData={null}
            userEmail="owner@example.com"
            onKybRequired={vi.fn()}
            initialTab="profile"
            onTabChange={onTabChange}
            onKybSuccess={vi.fn()}
            staffContent={<div>Staff management content</div>}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Staff' }))

    expect(onTabChange).toHaveBeenCalledWith('staff')
    expect(screen.getByText('Staff management content')).toBeInTheDocument()
  })
})
