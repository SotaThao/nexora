import { useEffect, type ReactNode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { pdfjs } from 'react-pdf'

import NewsLibraryPdfPreviewModal from './NewsLibraryPdfPreviewModal'

const pdfBoundary = vi.hoisted(() => ({
  mode: 'success' as 'success' | 'error',
  numPages: 3,
  pageRenderError: false,
}))

vi.mock('react-pdf', () => ({
  pdfjs: {
    GlobalWorkerOptions: { workerSrc: '' },
    VerbosityLevel: { ERRORS: 0 },
  },
  Document: ({
    children,
    onLoadSuccess,
    onLoadError,
    loading,
  }: {
    children: ReactNode
    onLoadSuccess: (value: { numPages: number }) => void
    onLoadError: (error: Error) => void
    loading: ReactNode
  }) => {
    useEffect(() => {
      if (pdfBoundary.mode === 'error') onLoadError(new Error('invalid pdf'))
      else onLoadSuccess({ numPages: pdfBoundary.numPages })
    }, [onLoadError, onLoadSuccess])

    return <div>{pdfBoundary.mode === 'success' ? children : loading}</div>
  },
  Page: ({
    pageNumber,
    onRenderError,
  }: {
    pageNumber: number
    onRenderError?: (error: Error) => void
  }) => {
    useEffect(() => {
      if (pdfBoundary.pageRenderError && pageNumber === 2) {
        onRenderError?.(new Error('page render failed'))
      }
    }, [onRenderError, pageNumber])

    return <canvas data-testid={`pdf-canvas-${pageNumber}`} />
  },
}))

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const intersectionCallbacks: IntersectionObserverCallback[] = []

class IntersectionObserverStub {
  constructor(callback: IntersectionObserverCallback) {
    intersectionCallbacks.push(callback)
  }

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
  readonly root = null
  readonly rootMargin = '0px'
  readonly thresholds = [0]
}

function intersectLatestSentinel() {
  const callback = intersectionCallbacks[intersectionCallbacks.length - 1]
  if (!callback) throw new Error('Expected a progressive-render observer.')

  act(() => {
    callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
  })
}

describe('NewsLibraryPdfPreviewModal', () => {
  beforeEach(() => {
    pdfBoundary.mode = 'success'
    pdfBoundary.numPages = 3
    pdfBoundary.pageRenderError = false
    intersectionCallbacks.length = 0
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders every PDF page in one labelled vertical document', async () => {
    render(
      <NewsLibraryPdfPreviewModal
        open
        title="Owner guide"
        url="https://cdn.example.com/owner-guide.pdf"
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Owner guide' })).toBeInTheDocument()
    expect(screen.queryByText('owner-guide.pdf')).not.toBeInTheDocument()
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toContain(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    )
    expect(await screen.findByRole('region', { name: 'Page 1 of 3' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Page 2 of 3' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Page 3 of 3' })).toBeInTheDocument()
  })

  it('renders a ten-page PDF progressively in batches of three', async () => {
    pdfBoundary.numPages = 10
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)

    render(
      <NewsLibraryPdfPreviewModal
        open
        title="Owner guide"
        url="https://cdn.example.com/owner-guide.pdf"
        onClose={vi.fn()}
      />,
    )

    expect(await screen.findByRole('region', { name: 'Page 3 of 10' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Page 4 of 10' })).not.toBeInTheDocument()

    intersectLatestSentinel()
    expect(await screen.findByRole('region', { name: 'Page 6 of 10' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Page 7 of 10' })).not.toBeInTheDocument()

    intersectLatestSentinel()
    expect(await screen.findByRole('region', { name: 'Page 9 of 10' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Page 10 of 10' })).not.toBeInTheDocument()

    intersectLatestSentinel()
    expect(await screen.findByRole('region', { name: 'Page 10 of 10' })).toBeInTheDocument()
    expect(screen.getAllByRole('region', { name: /Page \d+ of 10/ })).toHaveLength(10)
  })

  it('continues three-page batches beyond ten pages without a hard limit', async () => {
    pdfBoundary.numPages = 25
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)

    render(
      <NewsLibraryPdfPreviewModal
        open
        title="Long guide"
        url="https://cdn.example.com/long-guide.pdf"
        onClose={vi.fn()}
      />,
    )

    expect(await screen.findByRole('region', { name: 'Page 3 of 25' })).toBeInTheDocument()

    for (const pageCount of [6, 9, 12, 15, 18, 21, 24, 25]) {
      intersectLatestSentinel()
      expect(
        await screen.findByRole('region', { name: `Page ${pageCount} of 25` }),
      ).toBeInTheDocument()
    }

    expect(screen.getAllByRole('region', { name: /Page \d+ of 25/ })).toHaveLength(25)
    expect(screen.getByRole('region', { name: 'Page 1 of 25' })).toBeInTheDocument()
  })

  it('renders every page when IntersectionObserver is unavailable', async () => {
    pdfBoundary.numPages = 10

    render(
      <NewsLibraryPdfPreviewModal
        open
        title="Owner guide"
        url="https://cdn.example.com/owner-guide.pdf"
        onClose={vi.fn()}
      />,
    )

    expect(await screen.findByRole('region', { name: 'Page 10 of 10' })).toBeInTheDocument()
  })

  it('resets progressive rendering when the PDF URL changes', async () => {
    pdfBoundary.numPages = 10
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)

    const { rerender } = render(
      <NewsLibraryPdfPreviewModal
        open
        title="First guide"
        url="https://cdn.example.com/first.pdf"
        onClose={vi.fn()}
      />,
    )

    await screen.findByRole('region', { name: 'Page 3 of 10' })
    intersectLatestSentinel()
    await screen.findByRole('region', { name: 'Page 6 of 10' })

    pdfBoundary.numPages = 8
    rerender(
      <NewsLibraryPdfPreviewModal
        open
        title="Second guide"
        url="https://cdn.example.com/second.pdf"
        onClose={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByRole('region', { name: /Page \d+ of 8/ })).toHaveLength(3)
    })
    expect(screen.queryByRole('region', { name: 'Page 4 of 8' })).not.toBeInTheDocument()
  })

  it('preloads the PDF worker into the browser cache before the viewer opens', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response())
    vi.stubGlobal('fetch', fetchMock)
    const modalModule = await import('./NewsLibraryPdfPreviewModal')

    await modalModule.preloadPdfWorker()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('pdfjs-dist/legacy/build/pdf.worker.min.mjs'),
      { cache: 'force-cache' },
    )
  })

  it('shows the original PDF link when PDF.js cannot load the document', async () => {
    pdfBoundary.mode = 'error'

    render(
      <NewsLibraryPdfPreviewModal
        open
        title="Owner guide"
        url="https://cdn.example.com/owner-guide.pdf"
        onClose={vi.fn()}
      />,
    )

    expect(await screen.findByText('Unable to display this document.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open PDF' })).toHaveAttribute(
      'href',
      'https://cdn.example.com/owner-guide.pdf',
    )
    expect(screen.queryByRole('region', { name: /Page 1/ })).not.toBeInTheDocument()
  })

  it('shows the original PDF link when an individual page cannot render', async () => {
    pdfBoundary.pageRenderError = true

    render(
      <NewsLibraryPdfPreviewModal
        open
        title="Owner guide"
        url="https://cdn.example.com/owner-guide.pdf"
        onClose={vi.fn()}
      />,
    )

    expect(await screen.findByText('Unable to display this document.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open PDF' })).toHaveAttribute(
      'href',
      'https://cdn.example.com/owner-guide.pdf',
    )
  })

  it('locks background scroll, closes with Escape, and restores focus', () => {
    const onClose = vi.fn()
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const { unmount } = render(
      <NewsLibraryPdfPreviewModal
        open
        title="Owner guide"
        url="https://cdn.example.com/owner-guide.pdf"
        onClose={onClose}
      />,
    )

    expect(document.body.style.overflow).toBe('hidden')
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    unmount()
    expect(document.body.style.overflow).toBe('')
    expect(trigger).toHaveFocus()
    trigger.remove()
  })
})
