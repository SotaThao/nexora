import { useEffect, useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import communityJobsRepository from '../../../../data/repositories/communityJobs'
import { resetCommunityJobsMockStore } from '../../../../data/repositories/communityJobsMockClient'
import type { HiringFeedFilters, JobsBrowseKind, SeekingPost } from '../../../../types/communityJobs'
import type { PosJobPosting } from '../../../../types/posRecruitment'
import HiringFeedPanel from './HiringFeedPanel'
import StaffCommunityJobsView from './StaffCommunityJobsView'
import { collectFeedCities } from './staffJobsModel'

const demo = vi.hoisted(() => ({ mode: 'staff' as 'owner' | 'staff' | 'readOnly' }))

vi.mock('../../../community/jobs/CommunityJobsDemoContext', () => ({
  useCommunityJobsDemo: () => ({
    mode: demo.mode,
    staffKey: 'jessica',
    staffAccount: { name: 'Jessica', phone: '' },
    linkedBusinessIds: new Set<string>(),
    openInbox: vi.fn(),
    openBusinessChat: vi.fn(),
  }),
}))

function FeedHarness({ initialFilters = {} }: { initialFilters?: HiringFeedFilters }) {
  const [filters, setFilters] = useState<HiringFeedFilters>(initialFilters)
  const [kind, setKind] = useState<JobsBrowseKind>('all')
  const [postings, setPostings] = useState<PosJobPosting[]>([])
  const [seekingPosts, setSeekingPosts] = useState<SeekingPost[]>([])
  const [areaCities, setAreaCities] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      communityJobsRepository.listHiringFeed(filters),
      communityJobsRepository.listSeekingFeed(filters),
      communityJobsRepository.listHiringFeed({}),
      communityJobsRepository.listSeekingFeed({}),
    ]).then(([hiring, seeking, allHiring, allSeeking]) => {
      if (cancelled) return
      setPostings(hiring.items)
      setSeekingPosts(seeking.items)
      setAreaCities(collectFeedCities(allHiring.items, allSeeking.items))
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [filters])

  return (
    <HiringFeedPanel
      filters={filters}
      onFiltersChange={setFilters}
      kind={kind}
      onKindChange={setKind}
      postings={postings}
      seekingPosts={seekingPosts}
      areaCities={areaCities}
      isLoading={!loaded}
      isError={false}
      appliedPostingIds={new Set()}
      onOpenDetail={vi.fn()}
      onApply={vi.fn()}
      onChat={vi.fn()}
      onRetry={vi.fn()}
    />
  )
}

const HIRING_TITLE = 'Part-time pedicure specialist'
const SEEKING_TITLE = 'Experienced acrylic & dip tech looking for full-time'
const SEEKING_PHONE = '(713) 555-0111'

describe('HiringFeedPanel mixed browse feed', () => {
  beforeEach(() => {
    localStorage.setItem('nexora_lang', 'vi')
    resetCommunityJobsMockStore()
  })

  it('shows hiring and seeking posts together and switches kind with the pills', async () => {
    render(<FeedHarness />)

    expect(await screen.findByText(HIRING_TITLE)).toBeInTheDocument()
    expect(screen.getByText(SEEKING_TITLE)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Tất cả' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('8 tin phù hợp')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Tìm việc' }))
    expect(screen.getByRole('radio', { name: 'Tìm việc' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Tất cả' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText(SEEKING_TITLE)).toBeInTheDocument()
    expect(screen.queryByText(HIRING_TITLE)).not.toBeInTheDocument()
    expect(screen.getByText('4 tin phù hợp')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Tuyển thợ' }))
    expect(screen.getByText(HIRING_TITLE)).toBeInTheDocument()
    expect(screen.queryByText(SEEKING_TITLE)).not.toBeInTheDocument()
    expect(screen.getByText('4 tin phù hợp')).toBeInTheDocument()
  })

  it('filters both kinds by area through the custom select and resets with the clear button', async () => {
    render(<FeedHarness />)
    await screen.findByText(HIRING_TITLE)

    const combobox = screen.getByRole('combobox', { name: 'Khu vực' })
    expect(combobox).toHaveAttribute('aria-expanded', 'false')
    expect(combobox).toHaveAttribute('aria-haspopup', 'listbox')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    fireEvent.click(combobox)
    expect(combobox).toHaveAttribute('aria-expanded', 'true')
    const options = within(screen.getByRole('listbox')).getAllByRole('option')
    expect(options[0]).toHaveTextContent('Tất cả khu vực')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('option', { name: 'Houston' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(await screen.findByText('3 tin phù hợp')).toBeInTheDocument()
    expect(screen.queryByText(HIRING_TITLE)).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Khu vực' })).toHaveTextContent('Houston')

    fireEvent.click(screen.getByRole('radio', { name: 'Tìm việc' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }))

    expect(await screen.findByText(HIRING_TITLE)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Tất cả' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('combobox', { name: 'Khu vực' })).toHaveTextContent('Tất cả khu vực')
  })

  it('operates the area select with the keyboard and closes on Escape and outside click', async () => {
    render(<FeedHarness />)
    await screen.findByText(HIRING_TITLE)
    const combobox = screen.getByRole('combobox', { name: 'Khu vực' })

    fireEvent.keyDown(combobox, { key: 'ArrowDown' })
    expect(combobox).toHaveAttribute('aria-expanded', 'true')

    // Options are [all, Houston, Orlando, San Jose, Seattle]: two ArrowDown from "all" lands on Orlando.
    fireEvent.keyDown(combobox, { key: 'ArrowDown' })
    fireEvent.keyDown(combobox, { key: 'ArrowDown' })
    fireEvent.keyDown(combobox, { key: 'Enter' })
    expect(combobox).toHaveAttribute('aria-expanded', 'false')
    expect(combobox).toHaveTextContent('Orlando')
    expect(await screen.findByText('2 tin phù hợp')).toBeInTheDocument()

    fireEvent.keyDown(combobox, { key: 'ArrowUp' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Orlando' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(combobox, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    fireEvent.click(combobox)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('no longer renders the "more filters" toggle or the work type / skill selects', async () => {
    render(<FeedHarness />)
    await screen.findByText(HIRING_TITLE)

    expect(screen.queryByRole('button', { name: /Bộ lọc khác/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Hình thức làm việc' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Kỹ năng' })).not.toBeInTheDocument()
  })

  it('has no panel title and no post button of its own (the post action lives on the sub-tab row)', async () => {
    render(<FeedHarness />)
    await screen.findByText(HIRING_TITLE)
    expect(screen.queryByRole('heading', { name: 'Tin việc làm' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Đăng tin/ })).not.toBeInTheDocument()
  })

  it('renders seeking posts in the feed variant without phone, status chip or actions', async () => {
    render(<FeedHarness />)
    const title = await screen.findByText(SEEKING_TITLE)
    const card = title.closest('article') as HTMLElement

    expect(within(card).getByText('Tìm việc')).toBeInTheDocument()
    expect(within(card).getByText('Linh Tran')).toBeInTheDocument()
    expect(within(card).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText(SEEKING_PHONE)).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain('555-0')
    expect(document.body.textContent).not.toContain('TV-SEED')

    // showFullName=false on seed 002 -> neutral label instead of the real name.
    expect(screen.queryByText('Mai Nguyen')).not.toBeInTheDocument()
    expect(screen.getByText('Thợ ẩn danh')).toBeInTheDocument()
  })
})

describe('StaffCommunityJobsView header post button per role', () => {
  beforeEach(() => {
    localStorage.setItem('nexora_lang', 'vi')
    resetCommunityJobsMockStore()
  })

  const renderView = (props: { browseOnly?: boolean } = {}) =>
    render(<MemoryRouter><StaffCommunityJobsView {...props} /></MemoryRouter>)

  it('staff sees "Đăng tin tìm việc" and it opens the seeking composer', async () => {
    demo.mode = 'staff'
    renderView()
    await screen.findByText(HIRING_TITLE)
    fireEvent.click(screen.getByRole('button', { name: 'Đăng tin tìm việc' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('owner browse (browseOnly) renders no post button — the owner tab row owns "Post a Job"', async () => {
    demo.mode = 'owner'
    renderView({ browseOnly: true })
    await screen.findByText(HIRING_TITLE)
    expect(screen.queryByRole('button', { name: /Đăng tin/ })).not.toBeInTheDocument()
  })

  it('read-only guest sees no post button', async () => {
    demo.mode = 'readOnly'
    renderView()
    await screen.findByText(HIRING_TITLE)
    expect(screen.queryByRole('button', { name: /Đăng tin/ })).not.toBeInTheDocument()
  })
})
