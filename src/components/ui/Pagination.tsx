import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from '../../contexts/LanguageContext'
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination'
import { isMobileScrollContext, scrollToPageTop } from '../../utils/scrollToPageTop'

type PaginationProps = {
  pageNumber: number
  pageSize?: number
  totalPages: number
  totalCount?: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  onPageChange: (page: number) => void
  isLoading?: boolean
  variant?: 'simple' | 'detailed'
  className?: string
}

export default function Pagination({
  pageNumber,
  pageSize = DEFAULT_PAGE_SIZE,
  totalPages,
  totalCount = 0,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  isLoading = false,
  variant = 'detailed',
  className = '',
}: PaginationProps) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollAfterPageChangeRef = useRef(false)

  const effectiveTotalPages = Math.max(1, totalPages || 1)
  const canGoPrev = hasPreviousPage ?? pageNumber > 1
  const canGoNext = hasNextPage ?? (effectiveTotalPages > 0 && pageNumber < effectiveTotalPages)
  const rangeStart = totalCount > 0 ? (pageNumber - 1) * pageSize + 1 : 0
  const rangeEnd = totalCount > 0 ? Math.min(pageNumber * pageSize, totalCount) : 0

  useEffect(() => {
    if (!scrollAfterPageChangeRef.current) return
    scrollAfterPageChangeRef.current = false
    scrollToPageTop(rootRef.current)
  }, [pageNumber])

  const handlePageChange = (page: number) => {
    if (isLoading || page === pageNumber) return
    if (isMobileScrollContext()) {
      scrollAfterPageChangeRef.current = true
    }
    onPageChange(page)
  }

  if (variant === 'simple') {
    return (
      <div ref={rootRef} className={`flex items-center justify-between gap-3 border-t border-nexoraBorder pt-3 ${className}`}>
        <button
          type="button"
          disabled={!canGoPrev || isLoading}
          onClick={() => handlePageChange(pageNumber - 1)}
          className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-nexoraMuted transition hover:bg-nexoraCanvas disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && !canGoPrev ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            t('common.back')
          )}
        </button>
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold text-nexoraSubtle">
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-nexoraBrand" /> : null}
          {t('staff_dashboard.tips.page_of', { page: pageNumber, total: effectiveTotalPages })}
        </span>
        <button
          type="button"
          disabled={!canGoNext || isLoading}
          onClick={() => handlePageChange(pageNumber + 1)}
          className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-nexoraMuted transition hover:bg-nexoraCanvas disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && canGoNext ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            t('common.next')
          )}
        </button>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={`flex items-center justify-between border-t border-slate-100 px-4 py-4 sm:px-6 ${className}`}>
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          type="button"
          onClick={() => handlePageChange(pageNumber - 1)}
          disabled={!canGoPrev || isLoading}
          className={`relative inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 ${
            !canGoPrev || isLoading ? 'opacity-50 cursor-not-allowed active:scale-100' : ''
          }`}
        >
          {t('common.previous')}
        </button>
        <button
          type="button"
          onClick={() => handlePageChange(pageNumber + 1)}
          disabled={!canGoNext || isLoading}
          className={`relative ml-3 inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 ${
            !canGoNext || isLoading ? 'opacity-50 cursor-not-allowed active:scale-100' : ''
          }`}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.next')}
        </button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2 text-xs text-slate-500 font-semibold">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-nexoraBrand" /> : null}
          {t('common.pagination_showing')}{' '}
          <span className="font-extrabold text-slate-800">{rangeStart}</span> {t('common.pagination_to')}{' '}
          <span className="font-extrabold text-slate-800">{rangeEnd}</span> {t('common.pagination_of')}{' '}
          <span className="font-extrabold text-slate-800">{totalCount}</span> {t('common.pagination_results')}
        </p>

        <nav
          className="isolate inline-flex -space-x-px rounded-lg shadow-sm border border-slate-200 overflow-hidden bg-white"
          aria-label="Pagination"
        >
          <button
            type="button"
            onClick={() => handlePageChange(pageNumber - 1)}
            disabled={!canGoPrev || isLoading}
            className={`relative inline-flex items-center px-3 py-2 text-slate-400 hover:bg-slate-50 transition ${
              !canGoPrev || isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: effectiveTotalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => handlePageChange(page)}
              disabled={isLoading}
              className={`relative inline-flex items-center px-3.5 py-2 text-xs font-bold transition ${
                page === pageNumber
                  ? 'bg-nexoraBrand text-white'
                  : 'text-slate-700 hover:bg-slate-50 border-l border-slate-100'
              } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handlePageChange(pageNumber + 1)}
            disabled={!canGoNext || isLoading}
            className={`relative inline-flex items-center px-3 py-2 text-slate-400 hover:bg-slate-50 transition border-l border-slate-100 ${
              !canGoNext || isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </div>
  )
}
