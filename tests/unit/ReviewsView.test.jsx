import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ReviewsView from '../../src/components/dashboard/views/ReviewsView'
import { LanguageProvider } from '../../src/contexts/LanguageContext'

const MOCK_REVIEWS = [
  { id: 'R-1', rating: 5, comment: 'Mia is great!', staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', category: 'Good (Google)', date: '2026-05-25' },
  { id: 'R-2', rating: 4, comment: 'Good service', staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', category: 'Good (Yelp)', date: '2026-05-25' },
  { id: 'R-3', rating: 2, comment: 'Too slow', staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', category: 'Internal Feedback', date: '2026-05-24' }
]

const MOCK_STAFF = [
  { id: 'NEX-STAFF-MIA0123', nickname: 'Mia T.' },
  { id: 'NEX-STAFF-VL8893', nickname: 'Vivian L.' },
  { id: 'NEX-STAFF-ASH0155', nickname: 'Ashley P.' }
]

describe('ReviewsView Component Unit Tests', () => {
  it('renders ReviewsView header and stats correctly', () => {
    render(
      <LanguageProvider>
        <ReviewsView
          reviews={MOCK_REVIEWS}
          staff={MOCK_STAFF}
          filter="all"
          setFilter={vi.fn()}
          setupData={null}
        />
      </LanguageProvider>
    )

    expect(screen.getByRole('heading', { level: 2, name: /Reviews/i })).toBeInTheDocument()
    expect(screen.getByText(/3.7/i)).toBeInTheDocument() // (5+4+2)/3 = 3.7
    expect(screen.getByText(/Mia is great!/i)).toBeInTheDocument()
    expect(screen.getByText(/Good service/i)).toBeInTheDocument()
    expect(screen.getByText(/Too slow/i)).toBeInTheDocument()
  })

  it('renders source filters with correct dynamic counts', () => {
    render(
      <LanguageProvider>
        <ReviewsView
          reviews={MOCK_REVIEWS}
          staff={MOCK_STAFF}
          filter="all"
          setFilter={vi.fn()}
          setupData={null}
        />
      </LanguageProvider>
    )

    // Check source tabs with counts using specific anchored name matchers to avoid overlap with dropdowns
    expect(screen.getByRole('button', { name: /^All\s*\(3\)$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Google.*\(1\)$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Yelp.*\(1\)$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^3★.*\(1\)$/i })).toBeInTheDocument()
  })

  it('filters reviews by source selection', () => {
    render(
      <LanguageProvider>
        <ReviewsView
          reviews={MOCK_REVIEWS}
          staff={MOCK_STAFF}
          filter="all"
          setFilter={vi.fn()}
          setupData={null}
        />
      </LanguageProvider>
    )

    // Click Google filter
    const googleBtn = screen.getByRole('button', { name: /^Google.*\(1\)$/i })
    fireEvent.click(googleBtn)

    expect(screen.getByText(/Mia is great!/i)).toBeInTheDocument()
    expect(screen.queryByText(/Good service/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Too slow/i)).not.toBeInTheDocument()
  })
})
