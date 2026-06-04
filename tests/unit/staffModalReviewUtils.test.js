import { describe, expect, it } from 'vitest'
import { buildStaffReviewSummary } from '../../src/components/dashboard/modals/staffModalReviewUtils'

describe('buildStaffReviewSummary', () => {
  const reviews = [
    { staffId: 'NEX-1', rating: 5, category: 'Google', comment: 'Great' },
    { staffId: 'NEX-1', rating: 4, category: 'Internal', comment: '' },
    { staffId: 'NEX-2', rating: 1, category: 'Yelp', comment: 'Bad' },
  ]

  it('summarizes reviews for the selected staff member', () => {
    const summary = buildStaffReviewSummary(reviews, 'NEX-1', {
      rating: 'all',
      source: 'all',
      onlyCommented: false,
    })

    expect(summary.reviewsList).toHaveLength(2)
    expect(summary.averageRating).toBe(4.5)
    expect(summary.starCounts[5]).toBe(1)
    expect(summary.starCounts[4]).toBe(1)
    expect(summary.filteredReviewsList).toHaveLength(2)
  })

  it('applies rating, source, and comment filters', () => {
    const summary = buildStaffReviewSummary(reviews, 'NEX-1', {
      rating: '5',
      source: 'google',
      onlyCommented: true,
    })

    expect(summary.filteredReviewsList).toEqual([
      { staffId: 'NEX-1', rating: 5, category: 'Google', comment: 'Great' },
    ])
  })
})
