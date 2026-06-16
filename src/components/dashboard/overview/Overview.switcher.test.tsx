import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock the platform hook and both variants so we test only the switch wiring.
const isMobileMock = vi.fn(() => false)
vi.mock('../../../hooks/useIsMobileUI', () => ({
  useIsMobileUI: () => isMobileMock(),
}))
vi.mock('./Overview.desktop', () => ({ default: () => <div>DESKTOP_OVERVIEW</div> }))
vi.mock('./Overview.mobile', () => ({ default: () => <div>MOBILE_OVERVIEW</div> }))

import Overview from './Overview'

describe('Overview platform switcher', () => {
  it('renders the desktop (dev) variant on wide viewport', () => {
    isMobileMock.mockReturnValue(false)
    render(<Overview />)
    expect(screen.getByText('DESKTOP_OVERVIEW')).toBeInTheDocument()
    expect(screen.queryByText('MOBILE_OVERVIEW')).not.toBeInTheDocument()
  })

  it('renders the mobile (app-master) variant on native / narrow viewport', () => {
    isMobileMock.mockReturnValue(true)
    render(<Overview />)
    expect(screen.getByText('MOBILE_OVERVIEW')).toBeInTheDocument()
    expect(screen.queryByText('DESKTOP_OVERVIEW')).not.toBeInTheDocument()
  })
})
