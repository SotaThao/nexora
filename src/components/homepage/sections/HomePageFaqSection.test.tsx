import { fireEvent, render, screen } from '@testing-library/react'
import HomePageFaqSection from './HomePageFaqSection'

describe('HomePageFaqSection', () => {
  it('renders the Nexora Touch app introduction and ten FAQ items', () => {
    render(<HomePageFaqSection />)

    expect(screen.getByText('Nexora Touch FAQ')).toBeInTheDocument()
    expect(
      screen.getByText('Smart QR for tips, reviews, loyalty, and owner/staff dashboards.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/What You Should Know About Nexora Touch/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/More than a tipping QR/i)).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(10)
    expect(screen.getAllByRole('button')).toHaveLength(10)
    expect(screen.getByText('How is Nexora Touch different from regular tipping or QR apps?')).toBeInTheDocument()
    expect(screen.getByText('Does Nexora Touch only handle tips?')).toBeInTheDocument()
  })

  it('uses a compact FAQ eyebrow above the heading', () => {
    const { container } = render(<HomePageFaqSection />)
    const eyebrow = container.querySelector('[data-i18n="faq-eyebrow"]')

    expect(eyebrow).toBeInTheDocument()
    expect(eyebrow).toHaveTextContent('FAQ')
    expect(eyebrow).toHaveClass('text-[11px]')
    expect(eyebrow).not.toHaveTextContent(/Nexora Touch FAQ/i)
    expect(container.querySelector('.lucide-shield-check')).not.toBeInTheDocument()
  })

  it('uses a centered vertical accordion with one answer open at a time', () => {
    render(<HomePageFaqSection />)

    const firstQuestion = screen.getByRole('button', { name: /What is Nexora Touch/i })
    const secondQuestion = screen.getByRole('button', {
      name: /How is Nexora Touch different from regular tipping or QR apps/i,
    })

    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(secondQuestion).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText(/helps businesses manage direct tips/i)).not.toHaveAttribute('hidden')
    expect(screen.getByText(/Many tools only handle QR/i)).toHaveAttribute('hidden')

    fireEvent.click(secondQuestion)

    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false')
    expect(secondQuestion).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/helps businesses manage direct tips/i)).toHaveAttribute('hidden')
    expect(screen.getByText(/Many tools only handle QR/i)).not.toHaveAttribute('hidden')
  })

  it('keeps the FAQ focused on QR without mentioning NFC', () => {
    const { container } = render(<HomePageFaqSection />)

    expect(container.textContent).not.toMatch(/NFC/i)
  })

  it('keeps accordion rows clean without leading numbers or category badges', () => {
    const { container } = render(<HomePageFaqSection />)

    expect(container.textContent).not.toContain('01')
    expect(container.textContent).not.toContain('App Overview')
    expect(container.textContent).not.toContain('Why Nexora')
    expect(container.textContent).not.toContain('Direct Tips')
  })

  it('uses compact accordion row spacing', () => {
    render(<HomePageFaqSection />)

    const firstQuestion = screen.getByRole('button', { name: /What is Nexora Touch/i })

    expect(firstQuestion).toHaveClass('py-3')
    expect(firstQuestion).not.toHaveClass('py-4')
    expect(firstQuestion).not.toHaveClass('sm:py-5')
  })
})
