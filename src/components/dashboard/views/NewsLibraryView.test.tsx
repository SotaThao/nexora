import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import NewsLibraryView from './NewsLibraryView'

const PDF_URL = 'https://cdn.example.com/library/owner-guide.pdf'

const pdfViewerBoundary = vi.hoisted(() => ({
  preloadWorker: vi.fn(),
}))

vi.mock('./NewsLibraryPdfPreviewModal', () => ({
  default: ({ open, title }: { open: boolean; title: string }) => open
    ? <div role="dialog" aria-label={title} />
    : null,
  preloadPdfWorker: pdfViewerBoundary.preloadWorker,
}))

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  })
}

function stubCoarsePointer(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation(() => ({
      matches,
      media: '',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

function stubNewsLibraryContent(content: Record<string, unknown> = {
  planTopics: [
    {
      title: 'Owner guide',
      description: 'PDF overview',
      url: PDF_URL,
    },
  ],
}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(content),
    }),
  )
}

describe('NewsLibraryView mobile PDF topics', () => {
  beforeEach(() => {
    pdfViewerBoundary.preloadWorker.mockReset()
    window.history.replaceState(
      null,
      '',
      '/dashboard/news-library?tab=compensation-plan',
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('hides the view heading on mobile where the dashboard shell already shows it', async () => {
    setViewportWidth(430)
    stubCoarsePointer(false)
    stubNewsLibraryContent()

    render(<NewsLibraryView />)

    expect(
      await screen.findByRole('heading', { name: 'News & Library' }),
    ).toHaveClass('hidden', 'sm:block')
  })

  it('shows the view heading on mobile when requested by the public shell', async () => {
    setViewportWidth(430)
    stubCoarsePointer(false)
    stubNewsLibraryContent()

    render(<NewsLibraryView showMobileHeading />)

    expect(
      await screen.findByRole('heading', { name: 'News & Library' }),
    ).not.toHaveClass('hidden')
  })

  it('gives inactive tabs a readable hover surface', async () => {
    window.history.replaceState(null, '', '/news-library?tab=news')
    stubNewsLibraryContent()

    render(<NewsLibraryView showMobileHeading />)

    expect(
      await screen.findByRole('tab', { name: 'Event & Zoom Schedule' }),
    ).toHaveClass('hover:bg-nexoraSurfaceMuted', 'hover:text-nexoraText')
  })

  it('keeps paired event actions equal-width on mobile', async () => {
    window.history.replaceState(
      null,
      '',
      '/news-library?tab=event-zoom-schedule',
    )
    stubNewsLibraryContent({
      upcomingSessions: [
        {
          day: 'Weekly',
          date: 'Tuesday',
          time: '9:00 PM',
          title: 'Agent training',
          link: 'https://zoom.us/j/123456789',
          htmlContent: '<p>Session details</p>',
          primaryAction: 'Join Zoom',
          secondaryAction: 'View Details',
        },
      ],
    })

    render(<NewsLibraryView showMobileHeading />)

    const joinAction = await screen.findByRole('link', { name: 'Join Zoom' })
    const detailsAction = screen.getByRole('button', { name: 'View Details' })

    expect(joinAction.parentElement).toHaveClass('grid', 'grid-cols-2', 'sm:flex')
    expect(joinAction).toHaveClass('h-9', 'w-full', 'sm:w-auto')
    expect(detailsAction).toHaveClass('h-9', 'w-full', 'sm:w-auto')
  })

  it('preloads the shared PDF runtime after News Library content is ready', async () => {
    stubNewsLibraryContent()

    render(<NewsLibraryView />)

    await screen.findByRole('button', { name: /owner guide/i })
    await waitFor(() => {
      expect(pdfViewerBoundary.preloadWorker).toHaveBeenCalledTimes(1)
    })
    expect(
      vi.mocked(globalThis.fetch).mock.calls.some(([input]) => input === PDF_URL),
    ).toBe(false)
  })

  it('opens a Core topic PDF inside the web viewer on compact touch viewports', async () => {
    setViewportWidth(430)
    stubCoarsePointer(false)
    stubNewsLibraryContent()

    render(<NewsLibraryView />)

    fireEvent.click(await screen.findByRole('button', { name: /owner guide/i }))

    expect(await screen.findByRole('dialog', { name: 'Owner guide' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /owner guide/i })).not.toBeInTheDocument()
  })

  it('keeps the in-app PDF preview on desktop viewports', async () => {
    setViewportWidth(1280)
    stubCoarsePointer(false)
    stubNewsLibraryContent()

    render(<NewsLibraryView />)

    fireEvent.click(
      await screen.findByRole('button', { name: /owner guide/i }),
    )

    expect(await screen.findByRole('dialog', { name: 'Owner guide' })).toBeInTheDocument()
  })

  it('opens the in-web PDF viewer on wider coarse-pointer devices', async () => {
    setViewportWidth(1024)
    stubCoarsePointer(true)
    stubNewsLibraryContent()

    render(<NewsLibraryView />)

    fireEvent.click(await screen.findByRole('button', { name: /owner guide/i }))

    expect(await screen.findByRole('dialog', { name: 'Owner guide' })).toBeInTheDocument()
  })

  it('does not change mobile PDF behavior outside Core topics', async () => {
    window.history.replaceState(null, '', '/dashboard/news-library?tab=news')
    setViewportWidth(430)
    stubCoarsePointer(false)
    stubNewsLibraryContent({
      featuredVideos: [
        {
          title: 'News guide',
          description: 'Featured PDF',
          url: PDF_URL,
        },
      ],
    })

    render(<NewsLibraryView />)

    expect(
      await screen.findByRole('button', { name: /news guide/i }),
    ).toBeInTheDocument()
  })
})
