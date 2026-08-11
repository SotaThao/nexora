import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import NewsLibraryView from './NewsLibraryView'

describe('NewsLibraryView', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '/dashboard/news-library')
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)))
    document.title = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the requested page title and description', () => {
    render(<NewsLibraryView />)

    expect(document.title).toBe('NEXORA TOUCH - News & Library')
    expect(
      screen.getByRole('heading', { name: 'News & Library' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Keep NEXORA TOUCH news and Zoom schedules in one owner workspace.',
      ),
    ).toBeInTheDocument()
  })

  it('renders the news library tabs from the HTML source', async () => {
    render(<NewsLibraryView />)

    expect(
      screen.getByRole('tablist', { name: 'News and library sections' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /news/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      screen.getByRole('tab', { name: /event & zoom schedule/i }),
    ).toHaveAttribute('aria-selected', 'false')
    expect(
      screen.getByRole('tab', { name: /compensation plan/i }),
    ).toHaveAttribute('aria-selected', 'false')

    fireEvent.click(
      screen.getByRole('tab', { name: /event & zoom schedule/i }),
    )

    expect(
      screen.getByRole('tab', { name: /event & zoom schedule/i }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('tabpanel', { name: /event & zoom schedule/i }),
    ).toBeVisible()
  })

  it('loads the English news library data for the English language', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ featuredVideos: [] }),
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<NewsLibraryView />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/vlink-group/VlinkPay/main/news-library/nexora-news-library-data.json',
        expect.objectContaining({ cache: 'no-store' }),
      )
    })
  })

  it('loads the Vietnamese news library data for the Vietnamese language', async () => {
    localStorage.setItem('nexora_lang', 'vi')
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ featuredVideos: [] }),
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<NewsLibraryView />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'https://raw.githubusercontent.com/vlink-group/VlinkPay/main/news-library/nexora-news-library-data-vi.json',
        expect.objectContaining({ cache: 'no-store' }),
      )
    })
  })

  it('opens event details with Swal.fire', async () => {
    const fireMock = vi.fn()
    vi.stubGlobal('Swal', { fire: fireMock })
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              upcomingSessions: [
                {
                  day: 'MON',
                  date: '12',
                  time: '10:00 AM',
                  type: 'Zoom',
                  title: 'Owner onboarding',
                  description: 'Live setup walkthrough',
                  htmlContent: '<p>Bring your setup checklist.</p>',
                  secondaryAction: 'Details',
                },
              ],
            }),
        }),
      ),
    )

    render(<NewsLibraryView />)
    fireEvent.click(screen.getByRole('tab', { name: /event & zoom schedule/i }))
    fireEvent.click(await screen.findByRole('button', { name: /details/i }))

    await waitFor(() => {
      expect(fireMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Owner onboarding',
          html: expect.stringContaining('Bring your setup checklist.'),
          showCloseButton: true,
          showConfirmButton: false,
        }),
      )
    })
  })

  it('opens PDF media in the full document preview modal', async () => {
    const pdfBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })
    const createObjectURL = vi.fn(() => 'blob:http://localhost/owner-guide')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    })
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url === 'https://cdn.example.com/library/owner-guide.pdf') {
          return Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(pdfBlob),
          })
        }

        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              featuredVideos: [
                {
                  title: 'Owner guide',
                  description: 'PDF overview',
                  url: 'https://cdn.example.com/library/owner-guide.pdf',
                },
              ],
            }),
        })
      }),
    )

    render(<NewsLibraryView />)
    fireEvent.click(await screen.findByRole('button', { name: /owner guide/i }))

    expect(screen.getAllByRole('heading', { name: 'Owner guide' })).toHaveLength(2)
    await waitFor(() => {
      expect(screen.queryByText('owner-guide.pdf')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalledWith(pdfBlob)
      expect(screen.getByTitle('owner-guide.pdf')).toHaveAttribute(
        'src',
        'blob:http://localhost/owner-guide',
      )
    })
    expect(
      screen.getByRole('link', { name: /open pdf/i }),
    ).toHaveAttribute('href', 'https://cdn.example.com/library/owner-guide.pdf')
  })

  it('opens YouTube media in the library video modal', async () => {
    const fireMock = vi.fn()
    vi.stubGlobal('Swal', { fire: fireMock })
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              featuredVideos: [
                {
                  title: 'Nexora intro',
                  description: 'Watch the owner intro',
                  url: 'https://www.youtube.com/watch?v=abc123XYZ_0',
                },
              ],
            }),
        }),
      ),
    )

    render(<NewsLibraryView />)
    fireEvent.click(await screen.findByRole('button', { name: /nexora intro/i }))

    await waitFor(() => {
      expect(fireMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Nexora intro',
          html: expect.stringContaining(
            'https://www.youtube.com/embed/abc123XYZ_0?autoplay=1&amp;rel=0',
          ),
          showCloseButton: true,
          showConfirmButton: false,
        }),
      )
    })
  })
})
