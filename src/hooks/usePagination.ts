import { useCallback, useState } from 'react'
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from '../constants/pagination'

export function usePagination({
  initialPage = DEFAULT_PAGE_NUMBER,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  initialPage?: number
  pageSize?: number
} = {}) {
  const [pageNumber, setPageNumber] = useState(initialPage)

  const setPage = useCallback((page: number) => {
    setPageNumber(Math.max(1, page))
  }, [])

  const reset = useCallback(() => {
    setPageNumber(initialPage)
  }, [initialPage])

  const goNext = useCallback(() => {
    setPageNumber((current) => current + 1)
  }, [])

  const goPrev = useCallback(() => {
    setPageNumber((current) => Math.max(1, current - 1))
  }, [])

  return {
    pageNumber,
    pageSize,
    setPage,
    reset,
    goNext,
    goPrev,
  }
}
