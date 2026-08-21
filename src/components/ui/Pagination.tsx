import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from '../../contexts/LanguageContext'
import { DEFAULT_PAGE_SIZE, PAGINATION_ELLIPSIS } from '../../constants/pagination'
import { isMobileScrollContext, scrollToPageTop } from '../../utils/scrollToPageTop'
import { buildPaginationRange, type PaginationRangeEllipsis } from '../../utils/paginationRange'

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

const PAGE_BUTTON_CLASS =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-xs font-bold transition'

function PaginationPageJumpPopover({
  ellipsis,
  totalPages,
  isLoading,
  onGo,
}: {
  ellipsis: PaginationRangeEllipsis
  totalPages: number
  isLoading: boolean
  onGo: (page: number) => void
}) {
  const { t } = useTranslation()
  const inputId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [draftPage, setDraftPage] = useState('')

  useEffect(() => {
    if (!open) return

    const midpoint = Math.floor((ellipsis.fromPage + ellipsis.toPage) / 2)
    setDraftPage(String(midpoint))

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [ellipsis.fromPage, ellipsis.toPage, open])

  const submit = () => {
    const parsed = Number.parseInt(draftPage, 10)
    if (!Number.isFinite(parsed)) return
    const nextPage = Math.min(Math.max(parsed, 1), totalPages)
    setOpen(false)
    onGo(nextPage)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t('common.pagination_go_to_page')}
        aria-expanded={open}
        disabled={isLoading}
        onClick={() => setOpen((prev) => !prev)}
        className={`${PAGE_BUTTON_CLASS} border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {PAGINATION_ELLIPSIS}
      </button>

      {open ? (
        <div className="absolute bottom-full right-0 z-20 mb-2 w-52 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <label htmlFor={inputId} className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {t('common.pagination_go_to_page')}
          </label>
          <p className="mt-1 text-[11px] font-medium text-slate-400">
            {t('common.pagination_hidden_pages', {
              from: ellipsis.fromPage,
              to: ellipsis.toPage,
            })}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              id={inputId}
              type="number"
              min={1}
              max={totalPages}
              value={draftPage}
              onChange={(event) => setDraftPage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  submit()
                }
                if (event.key === 'Escape') {
                  setOpen(false)
                }
              }}
              className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/15"
              placeholder={t('common.pagination_page_number_placeholder')}
            />
            <button
              type="button"
              onClick={submit}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-nexoraBrand px-3 text-xs font-bold text-white transition hover:bg-nexoraBrandDark"
            >
              {t('common.pagination_go')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
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
  const paginationItems = buildPaginationRange(pageNumber, effectiveTotalPages)

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
        <span className="inline-flex items-center gap-2 self-center text-xs font-semibold text-slate-500">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-nexoraBrand" /> : null}
          {t('staff_dashboard.tips.page_of', { page: pageNumber, total: effectiveTotalPages })}
        </span>
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

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between sm:gap-4">
        <p className="inline-flex min-w-0 items-center gap-2 text-xs text-slate-500 font-semibold">
          {isLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-nexoraBrand" /> : null}
          {t('common.pagination_showing')}{' '}
          <span className="font-extrabold text-slate-800">{rangeStart}</span> {t('common.pagination_to')}{' '}
          <span className="font-extrabold text-slate-800">{rangeEnd}</span> {t('common.pagination_of')}{' '}
          <span className="font-extrabold text-slate-800">{totalCount}</span> {t('common.pagination_results')}
        </p>

        <nav
          className="flex shrink-0 items-center gap-1.5"
          aria-label={t('common.pagination_nav')}
        >
          <button
            type="button"
            onClick={() => handlePageChange(pageNumber - 1)}
            disabled={!canGoPrev || isLoading}
            aria-label={t('common.previous')}
            className={`${PAGE_BUTTON_CLASS} border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {paginationItems.map((item) => {
            if (item.type === 'ellipsis') {
              return (
                <PaginationPageJumpPopover
                  key={item.key}
                  ellipsis={item}
                  totalPages={effectiveTotalPages}
                  isLoading={isLoading}
                  onGo={handlePageChange}
                />
              )
            }

            const isActive = item.page === pageNumber
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => handlePageChange(item.page)}
                disabled={isLoading}
                aria-current={isActive ? 'page' : undefined}
                className={`${PAGE_BUTTON_CLASS} ${
                  isActive
                    ? 'border-nexoraBrand bg-white text-nexoraBrand shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                } ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                {item.page}
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => handlePageChange(pageNumber + 1)}
            disabled={!canGoNext || isLoading}
            aria-label={t('common.next')}
            className={`${PAGE_BUTTON_CLASS} border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </div>
  )
}
