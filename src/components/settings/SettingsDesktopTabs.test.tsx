import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import SettingsDesktopTabs, {
  type SettingsDesktopTabItem,
} from './SettingsDesktopTabs'

const tabs: SettingsDesktopTabItem[] = [
  { key: 'account', label: 'Account' },
  { key: 'staff', label: 'Staff' },
  { key: 'kyb', label: 'KYB' },
  { key: 'affiliate', label: 'Affiliate' },
  { key: 'privacy', label: 'Privacy' },
]

function Harness() {
  const [activeTab, setActiveTab] = useState('account')
  return (
    <SettingsDesktopTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      ariaLabel="Settings sections"
    >
      <div>{activeTab} content</div>
    </SettingsDesktopTabs>
  )
}

describe('SettingsDesktopTabs', () => {
  it('renders text-only tabs and an unpadded transparent panel without shadow', () => {
    render(<Harness />)
    const tablist = screen.getByRole('tablist', { name: 'Settings sections' })
    const renderedTabs = within(tablist).getAllByRole('tab')

    expect(renderedTabs.map((tab) => tab.textContent)).toEqual([
      'Account',
      'Staff',
      'KYB',
      'Affiliate',
      'Privacy',
    ])
    renderedTabs.forEach((tab) => expect(tab.querySelector('svg')).toBeNull())
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveClass(
      'bg-nexoraBrand',
      'text-white',
    )
    expect(screen.getByRole('tab', { name: 'Staff' })).toHaveClass(
      'bg-nexoraSurface',
    )
    expect(tablist.parentElement).toHaveClass('mx-auto', 'max-w-6xl')
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveClass('rounded-lg', 'border-nexoraBorder')
    expect(panel).not.toHaveClass('bg-nexoraSurface', 'shadow-nexora-card')
    expect(panel.firstElementChild).not.toHaveClass('p-4', 'sm:p-5')
  })

  it('activates, focuses, and wraps adjacent tabs with Left and Right arrows', () => {
    render(<Harness />)
    const accountTab = screen.getByRole('tab', { name: 'Account' })
    accountTab.focus()
    fireEvent.keyDown(accountTab, { key: 'ArrowRight' })

    const staffTab = screen.getByRole('tab', { name: 'Staff' })
    expect(staffTab).toHaveFocus()
    expect(staffTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('staff content')

    fireEvent.keyDown(staffTab, { key: 'ArrowLeft' })
    expect(accountTab).toHaveFocus()
    expect(accountTab).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(accountTab, { key: 'ArrowLeft' })
    const privacyTab = screen.getByRole('tab', { name: 'Privacy' })
    expect(privacyTab).toHaveFocus()
    expect(privacyTab).toHaveAttribute('aria-selected', 'true')
  })
})
