import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardHeaderDesktop from './DashboardHeader.desktop'

vi.mock('../../../contexts/LanguageContext', () => ({
  useTranslation: () => ({
    currentLanguage: 'en',
    t: (key: string) => key,
  }),
}))

vi.mock('../../ui/LanguageSwitcher', () => ({ default: () => null }))
vi.mock('./HeaderEcosystem', () => ({ default: () => null }))

it('opens one Staff detail destination without navigating back to the Staff list', () => {
  const onViewStaffDetail = vi.fn()
  const onNavigateMenu = vi.fn()
  render(
    <MemoryRouter>
      <DashboardHeaderDesktop
        searchQuery="alex"
        setSearchQuery={vi.fn()}
        onAddTouchpoint={vi.fn()}
        profile={{}}
        businessName="Nail Salon"
        notifications={[]}
        setNotifications={vi.fn()}
        onMarkAllNotificationsRead={vi.fn()}
        isNotiDropdownOpen={false}
        setIsNotiDropdownOpen={vi.fn()}
        onNavigateMenu={onNavigateMenu}
        staff={[
          {
            id: 'staff-1',
            fullName: 'Alex Lee',
            nickname: 'Alex',
            position: 'Nail Artist',
          },
        ]}
        transactions={[]}
        reviews={[]}
        touchpoints={[]}
        onViewStaffDetail={onViewStaffDetail}
        onApproveStaff={vi.fn()}
        onNavigateSettingsTab={vi.fn()}
        onLogout={vi.fn()}
        onOpenMobileMenu={vi.fn()}
        onToggleSidebar={vi.fn()}
      />
    </MemoryRouter>,
  )

  fireEvent.focus(screen.getByPlaceholderText('dashboard.header.search_placeholder'))
  fireEvent.click(screen.getByText('Alex Lee').closest('button') as HTMLButtonElement)

  expect(onViewStaffDetail).toHaveBeenCalledWith('staff-1')
  expect(onNavigateMenu).not.toHaveBeenCalledWith('staff')
})
