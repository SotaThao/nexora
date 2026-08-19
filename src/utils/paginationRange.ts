export type PaginationRangePage = {
  type: 'page'
  page: number
}

export type PaginationRangeEllipsis = {
  type: 'ellipsis'
  key: string
  /** First hidden page number (inclusive). */
  fromPage: number
  /** Last hidden page number (inclusive). */
  toPage: number
}

export type PaginationRangeItem = PaginationRangePage | PaginationRangeEllipsis

function range(start: number, end: number): number[] {
  if (end < start) return []
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

/**
 * Compact page list for long paginated lists.
 * Example (page 1 of 62): 1, 2, …, 62
 * Example (page 30 of 62): 1, …, 29, 30, 31, …, 62
 */
export function buildPaginationRange(
  currentPage: number,
  totalPages: number,
): PaginationRangeItem[] {
  const total = Math.max(1, totalPages)
  const current = Math.min(Math.max(1, currentPage), total)

  if (total <= 5) {
    return range(1, total).map((page) => ({ type: 'page', page }))
  }

  const items: PaginationRangeItem[] = [{ type: 'page', page: 1 }]
  const windowStart = Math.max(2, current - 1)
  const windowEnd = Math.min(total - 1, current + 1)

  if (windowStart > 2) {
    items.push({
      type: 'ellipsis',
      key: 'left',
      fromPage: 2,
      toPage: windowStart - 1,
    })
  } else {
    for (const page of range(2, windowStart - 1)) {
      items.push({ type: 'page', page })
    }
  }

  for (const page of range(windowStart, windowEnd)) {
    items.push({ type: 'page', page })
  }

  if (windowEnd < total - 1) {
    items.push({
      type: 'ellipsis',
      key: 'right',
      fromPage: windowEnd + 1,
      toPage: total - 1,
    })
  } else {
    for (const page of range(windowEnd + 1, total - 1)) {
      items.push({ type: 'page', page })
    }
  }

  if (total > 1) {
    items.push({ type: 'page', page: total })
  }

  return items
}
