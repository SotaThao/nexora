import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import HomePagePricingSection from './HomePagePricingSection'

const bridgeMock = vi.hoisted(() => ({
  hp: {},
  planCta: vi.fn(),
  onLogout: vi.fn(),
}))

vi.mock('../context/HomePageBridgeContext', () => ({
  useHomePageBridge: () => bridgeMock,
}))

function renderPricingSection() {
  render(
    <MemoryRouter>
      <HomePagePricingSection />
    </MemoryRouter>,
  )
}

describe('HomePagePricingSection', () => {
  it('keeps the existing Enterprise NFC station plaque copy outside the FAQ', () => {
    renderPricingSection()

    expect(screen.getByText('Premium solid brass NFC station plaques')).toBeInTheDocument()
  })
})
