import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CommunityChatInbox } from '../../src/components/community/CommunityChatInbox'

const mocks = vi.hoisted(() => ({
  directChannels: {
    data: [] as Array<Record<string, unknown>>,
    isLoading: false,
  },
  communities: {
    data: { items: [] as Array<Record<string, unknown>> },
    isLoading: false,
  },
  profileSearch: vi.fn(),
  openDirectChat: vi.fn(),
}))

vi.mock('../../src/components/community/CommunityAuth', () => ({
  CommunityPersonaSwitcher: () => <div data-testid="persona-switcher" />,
  useCommunityAuth: () => ({ user: { id: 'kayla' }, isAnonymous: false }),
}))

vi.mock('../../src/components/community/CommunityChatDock', () => ({
  useCommunityChatDock: () => ({ openDirectChat: mocks.openDirectChat }),
}))

vi.mock('../../src/components/community/demo/DemoStaffShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../../src/data/hooks/useDirectMessages', () => ({
  useDirectChannels: () => mocks.directChannels,
  useProfileSearch: (query: string) => mocks.profileSearch(query),
  useFindOrCreateDirectChannel: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('../../src/data/hooks/useCommunity', () => ({
  useMyCommunities: () => mocks.communities,
}))

function renderInbox() {
  return render(
    <MemoryRouter
      initialEntries={['/community/chat']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <CommunityChatInbox />
    </MemoryRouter>,
  )
}

describe('CommunityChatInbox', () => {
  beforeEach(() => {
    mocks.directChannels.data = [
      {
        id: 'dm-1',
        kind: 'direct',
        name: 'Direct',
        participantIds: ['kayla', 'jessica'],
        otherParticipant: { id: 'jessica', displayName: 'Jessica Nguyen', avatarPath: null },
        createdAt: '2026-07-22T22:31:00.000Z',
      },
    ]
    mocks.directChannels.isLoading = false
    mocks.communities.data = {
      items: [
        { id: 'group-1', name: 'Nexora Official', kind: 'public' },
        { id: 'group-2', name: 'Bitcoin Nail Bar Team', kind: 'salon' },
      ],
    }
    mocks.communities.isLoading = false
    mocks.profileSearch.mockReturnValue({ data: [], isLoading: false })
    mocks.openDirectChat.mockReset()
  })

  it('renders the compact header, DM list, and group tab without a visible title block', () => {
    renderInbox()

    const accessibleTitle = screen.getByRole('heading', { name: 'Hộp thư nhắn tin' })
    const backButton = screen.getByRole('button', { name: 'Quay lại Community' })
    const search = screen.getByRole('textbox', { name: 'Tìm kiếm người dùng' })

    expect(accessibleTitle).toHaveClass('sr-only')
    expect(screen.queryByText('Trò chuyện 1:1 và Chat nhóm Nexora')).not.toBeInTheDocument()
    expect(backButton.parentElement).toContainElement(search)
    expect(screen.getByRole('button', { name: 'Tin nhắn (1)' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: /Jessica Nguyen/ })).toHaveAttribute(
      'href',
      '/community/chat/dm/dm-1',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Nhóm Community (2)' }))
    expect(screen.getByRole('link', { name: /Nexora Official/ })).toHaveAttribute(
      'href',
      '/community/group-1/chat',
    )
    expect(screen.getByRole('link', { name: /Bitcoin Nail Bar Team/ })).toHaveAttribute(
      'href',
      '/community/group-2/chat',
    )
  })

  it('renders actionable empty states for direct messages and groups', () => {
    mocks.directChannels.data = []
    mocks.communities.data = { items: [] }

    renderInbox()

    expect(screen.getByRole('heading', { name: 'Chưa có tin nhắn trực tiếp' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Nhóm Community (0)' }))
    expect(screen.getByRole('heading', { name: 'Chưa tham gia nhóm nào' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Khám phá cộng đồng' })).toHaveAttribute('href', '/community')
  })

  it('switches to profile search only after two characters', () => {
    renderInbox()
    const search = screen.getByRole('textbox', { name: 'Tìm kiếm người dùng' })

    fireEvent.change(search, { target: { value: 'J' } })
    expect(screen.getByRole('button', { name: 'Tin nhắn (1)' })).toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'Je' } })
    expect(screen.getByText('Kết quả tìm kiếm (0)')).toBeInTheDocument()
    expect(screen.getByText('Không tìm thấy người dùng')).toBeInTheDocument()
  })
})
