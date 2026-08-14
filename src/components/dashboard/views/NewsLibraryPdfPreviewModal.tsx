import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
} from 'react'
import { ExternalLink, Loader2, X } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'

import { useTranslation } from '../../../contexts/LanguageContext'

const PDF_WORKER_SRC = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()
pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC

let pdfWorkerPreloadPromise: Promise<void> | null = null

export function preloadPdfWorker(): Promise<void> {
  if (typeof fetch !== 'function') return Promise.resolve()

  if (!pdfWorkerPreloadPromise) {
    pdfWorkerPreloadPromise = fetch(PDF_WORKER_SRC, { cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to preload PDF worker.')
        return response.arrayBuffer()
      })
      .then(() => undefined)
      .catch(() => undefined)
  }

  return pdfWorkerPreloadPromise
}

const TK = 'components.dashboard.views.NewsLibraryView'
const MAX_PAGE_WIDTH = 900
const PAGE_RENDER_BATCH_SIZE = 3
const PAGE_LOAD_ROOT_MARGIN = '0px 0px 200px 0px'
const PDF_DOCUMENT_OPTIONS = {
  verbosity: pdfjs.VerbosityLevel.ERRORS,
}

type PdfDocumentState = {
  url: string
  numPages: number
  hasError: boolean
}

type VisiblePageState = {
  url: string
  count: number
}

export interface NewsLibraryPdfPreviewModalProps {
  open: boolean
  title: string
  url: string
  onClose: () => void
}

export default function NewsLibraryPdfPreviewModal({
  open,
  title,
  url,
  onClose,
}: NewsLibraryPdfPreviewModalProps): ReactElement | null {
  const { t } = useTranslation()
  const titleId = useId()
  const scrollBodyRef = useRef<HTMLDivElement>(null)
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [pageWidth, setPageWidth] = useState(0)
  const [documentState, setDocumentState] = useState<PdfDocumentState>(() => ({
    url,
    numPages: 0,
    hasError: false,
  }))
  const [visiblePageState, setVisiblePageState] = useState<VisiblePageState>(() => ({
    url,
    count: 0,
  }))
  const activeDocumentState = documentState.url === url
    ? documentState
    : { url, numPages: 0, hasError: false }
  const { numPages, hasError } = activeDocumentState
  const visiblePageCount = visiblePageState.url === url
    ? Math.min(visiblePageState.count, numPages)
    : 0

  const handleLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setDocumentState({ url, numPages, hasError: false })
    setVisiblePageState({
      url,
      count: typeof IntersectionObserver === 'undefined'
        ? numPages
        : Math.min(PAGE_RENDER_BATCH_SIZE, numPages),
    })
  }, [url])

  const handleLoadError = useCallback(() => {
    setDocumentState({ url, numPages: 0, hasError: true })
    setVisiblePageState({ url, count: 0 })
  }, [url])

  useEffect(() => {
    setDocumentState((current) => current.url === url
      ? current
      : { url, numPages: 0, hasError: false })
    setVisiblePageState((current) => current.url === url
      ? current
      : { url, count: 0 })
  }, [url])

  const loadNextPageBatch = useCallback(() => {
    setVisiblePageState((current) => {
      const currentCount = current.url === url ? current.count : 0

      return {
        url,
        count: Math.min(numPages, currentCount + PAGE_RENDER_BATCH_SIZE),
      }
    })
  }, [numPages, url])

  useEffect(() => {
    if (!open) return undefined

    const body = scrollBodyRef.current
    if (!body) return undefined

    const measure = () => {
      setPageWidth(Math.min(MAX_PAGE_WIDTH, Math.max(0, body.clientWidth - 32)))
    }

    measure()
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure)
      observer.observe(body)

      return () => observer.disconnect()
    }

    window.addEventListener('resize', measure)

    return () => window.removeEventListener('resize', measure)
  }, [open])

  useEffect(() => {
    if (
      !open
      || hasError
      || numPages === 0
      || visiblePageCount >= numPages
      || typeof IntersectionObserver === 'undefined'
    ) return undefined

    const sentinel = loadMoreSentinelRef.current
    const scrollBody = scrollBodyRef.current
    if (!sentinel || !scrollBody) return undefined

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadNextPageBatch()
    }, {
      root: scrollBody,
      rootMargin: PAGE_LOAD_ROOT_MARGIN,
    })

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasError, loadNextPageBatch, numPages, open, visiblePageCount])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    const returnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      returnFocus?.focus()
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 backdrop-blur-sm"
      style={{
        paddingTop: 'max(0.75rem, var(--app-safe-area-top))',
        paddingBottom: 'max(0.75rem, var(--app-safe-area-bottom))',
        paddingLeft: 'max(0.75rem, var(--app-safe-area-left))',
        paddingRight: 'max(0.75rem, var(--app-safe-area-right))',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="nexora-modal-card news-library-pdf-modal-card max-w-5xl overflow-hidden p-0"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-nexoraBorder px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-sm font-extrabold text-nexoraText">
              {title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label={t('common.cancel')}
            title={t('common.cancel')}
            onClick={onClose}
            className="nexora-icon-button shrink-0"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <div
          ref={scrollBodyRef}
          className="min-h-0 flex-1 overflow-y-auto bg-nexoraCanvas p-3 sm:p-4"
        >
          {hasError ? (
            <div className="grid min-h-72 place-items-center px-4 text-center">
              <div>
                <p className="text-sm font-bold text-nexoraDanger">
                  {t(`${TK}.pdfViewer.error`)}
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  {t(`${TK}.actions.openPdf`)}
                </a>
              </div>
            </div>
          ) : (
            <Document
              file={url}
              options={PDF_DOCUMENT_OPTIONS}
              onLoadSuccess={handleLoadSuccess}
              onLoadError={handleLoadError}
              loading={
                <div className="grid min-h-72 place-items-center text-nexoraMuted">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    {t(`${TK}.pdfViewer.loading`)}
                  </span>
                </div>
              }
            >
              <div className="space-y-3">
                {Array.from({ length: visiblePageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <section
                    key={pageNumber}
                    role="region"
                    aria-label={t(`${TK}.pdfViewer.pageAria`, {
                      page: pageNumber,
                      total: numPages,
                    })}
                    className="mx-auto w-fit max-w-full overflow-hidden rounded-lg bg-white shadow-nexora-card"
                  >
                    {pageWidth > 0 ? (
                      <Page
                        pageNumber={pageNumber}
                        width={pageWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onLoadError={handleLoadError}
                        onRenderError={handleLoadError}
                        loading={
                          <div className="grid min-h-72 place-items-center text-nexoraMuted">
                            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                          </div>
                        }
                      />
                    ) : (
                      <div className="grid min-h-72 place-items-center text-nexoraMuted">
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      </div>
                    )}
                  </section>
                ))}
                {visiblePageCount < numPages ? (
                  <div
                    ref={loadMoreSentinelRef}
                    aria-hidden="true"
                    className="h-px"
                  />
                ) : null}
              </div>
            </Document>
          )}
        </div>
      </div>
    </div>
  )
}
