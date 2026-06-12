export function buildStaffReviewSummary(reviews, staffId, filters) {
  const reviewsList = staffId ? reviews.filter((review) => review.staffId === staffId) : []
  const averageRating = reviewsList.length
    ? Math.round((reviewsList.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviewsList.length) * 10) / 10
    : 0

  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviewsList.forEach((review) => {
    const rating = Math.round(Number(review.rating) || 0)
    if (rating >= 1 && rating <= 5) {
      starCounts[rating] += 1
    }
  })

  const filteredReviewsList = reviewsList.filter((review) => {
    if (filters.rating !== 'all' && Number(review.rating) !== Number(filters.rating)) {
      return false
    }
    if (filters.source !== 'all') {
      const source = review.category?.toLowerCase() || ''
      if (filters.source === 'google' && !source.includes('google')) return false
      if (filters.source === 'yelp' && !source.includes('yelp')) return false
      if (filters.source === 'internal' && (source.includes('google') || source.includes('yelp'))) return false
    }
    if (filters.onlyCommented && !review.comment?.trim()) {
      return false
    }
    return true
  })

  return { reviewsList, averageRating, starCounts, filteredReviewsList }
}
