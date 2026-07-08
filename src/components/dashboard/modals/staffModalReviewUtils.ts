import { staffRecordMatchesMember } from '../../../utils/staffRecordMatch'

export function buildStaffReviewSummary(
  reviews: LooseObject[],
  staffMember: LooseObject | null | undefined,
  filters: LooseObject,
) {
  const reviewsList = staffMember
    ? reviews.filter((review) => staffRecordMatchesMember(staffMember, review))
    : []

  let averageRating = 0
  if (reviewsList.length > 0) {
    averageRating =
      Math.round(
        (reviewsList.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviewsList.length) * 10,
      ) / 10
  } else {
    const rosterRating = Number(staffMember?.averageRating ?? 0)
    if (rosterRating > 0) averageRating = rosterRating
  }

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
