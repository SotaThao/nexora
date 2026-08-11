import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  NEWS_LIBRARY_DATA_URLS,
  getNewsLibraryDataUrl,
} from '../../../constants/newsLibrary'
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

  it('resolves the News Library JSON data source from shared config', () => {
    expect(getNewsLibraryDataUrl('vi')).toBe(NEWS_LIBRARY_DATA_URLS.vi)
    expect(getNewsLibraryDataUrl('en')).toBe(NEWS_LIBRARY_DATA_URLS.en)
    expect(getNewsLibraryDataUrl('fr')).toBe(NEWS_LIBRARY_DATA_URLS.en)
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
        NEWS_LIBRARY_DATA_URLS.en,
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
        NEWS_LIBRARY_DATA_URLS.vi,
        expect.objectContaining({ cache: 'no-store' }),
      )
    })
  })

  it('renders News Library static UI copy in Vietnamese', async () => {
    localStorage.setItem('nexora_lang', 'vi')
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              featuredVideos: [
                {
                  title: 'Video giới thiệu',
                  description: 'Nội dung video',
                  url: 'https://www.youtube.com/watch?v=abc123XYZ_0',
                },
              ],
              channelVideos: [
                {
                  title: 'Tài liệu PDF',
                  description: 'Tải tài liệu',
                  url: 'https://cdn.example.com/library/news.pdf',
                },
              ],
              planTopics: [
                {
                  title: 'Tổng quan hoa hồng',
                  description: 'Tài liệu PDF',
                  url: 'https://cdn.example.com/library/plan.pdf',
                },
              ],
              upcomingSessions: [
                {
                  day: 'T2',
                  date: '12',
                  time: '10:00',
                  type: 'Zoom',
                  title: 'Đào tạo chủ tiệm',
                  description: 'Buổi hướng dẫn live',
                  link: 'https://zoom.example.com/join',
                  htmlContent: '<p>Chi tiết</p>',
                },
              ],
            }),
        }),
      ),
    )

    render(<NewsLibraryView />)

    expect(document.title).toBe('NEXORA TOUCH - Tin tức & Thư viện')
    expect(
      screen.getByRole('main', { name: 'Nội dung Tin tức & Thư viện' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Tin tức & Thư viện' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Cập nhật tin tức NEXORA TOUCH và lịch Zoom trong một không gian dành cho chủ tiệm.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /tin tức/i })).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: /lịch sự kiện & zoom/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: /kế hoạch thưởng/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Video nổi bật' })).toBeInTheDocument()
    expect(screen.getByText('Xem')).toBeInTheDocument()
    expect(screen.getByText('Mở PDF')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /kế hoạch thưởng/i }))
    expect(screen.getByRole('heading', { name: 'Chủ đề chính' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /lịch sự kiện & zoom/i }))
    expect(
      screen.getByRole('heading', { name: 'Các buổi Zoom sắp tới' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Tham gia')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /chi tiết/i })).toBeInTheDocument()
  })

  it('shows only duration metadata on video media cards', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              featuredVideos: [
                {
                  badge: 'FEATURED',
                  duration: '4:08',
                  timeAgo: '2 days ago',
                  views: '4 views',
                  title: 'Owner welcome',
                  description: 'Intro video',
                  url: 'https://www.youtube.com/watch?v=abc123XYZ_0',
                },
              ],
              channelVideos: [
                {
                  duration: '5:12',
                  timeAgo: 'Yesterday',
                  views: '20 views',
                  title: 'Training replay',
                  description: 'Replay video',
                  url: 'https://www.youtube.com/watch?v=def456XYZ_0',
                },
              ],
            }),
        }),
      ),
    )

    render(<NewsLibraryView />)

    expect(await screen.findByText('4:08')).toBeInTheDocument()
    const featureDuration = screen.getByLabelText('Duration 4:08')
    expect(featureDuration).toBeInTheDocument()
    expect(featureDuration.querySelector('.lucide-clock')).toBeInTheDocument()
    expect(screen.getByLabelText('Duration 5:12')).toBeInTheDocument()
    expect(screen.queryByText('FEATURED')).not.toBeInTheDocument()
    expect(screen.queryByText('2 days ago')).not.toBeInTheDocument()
    expect(screen.queryByText('4 views')).not.toBeInTheDocument()
    expect(screen.queryByText('Yesterday')).not.toBeInTheDocument()
    expect(screen.queryByText('20 views')).not.toBeInTheDocument()
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
