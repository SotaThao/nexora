import { render, screen } from '@testing-library/react'
import MobileBottomNav from './MobileBottomNav'

vi.mock('../../../contexts/LanguageContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

it('keeps Staff in the mobile bottom navigation', () => {
  render(<MobileBottomNav activeMenu="overview" onNavigate={vi.fn()} />)

  expect(
    screen.getByRole('button', { name: 'dashboard.owner_home.nav_staff' }),
  ).toBeInTheDocument()
})
