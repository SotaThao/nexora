import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CommunityNotificationBell,
  CommunityNotificationsProvider,
} from '../../src/components/community/CommunityNotifications'

const mocks = vi.hoisted(() => ({
  useCommunityNotifications: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  useNotifications: vi.fn(),
  useUnreadCount: vi.fn(),
  useMarkNotificationRead: vi.fn(),
  useMarkAllNotificationsRead: vi.fn(),
}))

vi.mock('../../src/data/hooks/useCommunityNotifications', () => ({
  useCommunityNotifications: mocks.useCommunityNotifications,
}))

vi.mock('../../src/data/hooks/useNotifications', () => ({
  useNotifications: mocks.useNotifications,
  useUnreadCount: mocks.useUnreadCount,
  useMarkNotificationRead: mocks.useMarkNotificationRead,
  useMarkAllNotificationsRead: mocks.useMarkAllNotificationsRead,
}))

function renderBell() {
  return render(
    <MemoryRouter
      initialEntries={['/community']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <CommunityNotificationsProvider>
        <CommunityNotificationBell />
      </CommunityNotificationsProvider>
    </MemoryRouter>,
  )
}

describe('CommunityNotificationBell', () => {
  beforeEach(() => {
    mocks.markRead.mockReset().mockResolvedValue(undefined)
    mocks.markAllRead.mockReset().mockResolvedValue(undefined)
    mocks.useCommunityNotifications.mockReset().mockReturnValue({
      notifications: [
        {
          id: 'community-notification-1',
          userId: 'kayla',
          type: 'comment',
          payload: {},
          readAt: null,
          createdAt: '2026-07-27T01:00:00.000Z',
        },
      ],
      unreadCount: 1,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      isReconnecting: false,
      error: null,
      markRead: mocks.markRead,
      markAllRead: mocks.markAllRead,
      isMarkingRead: false,
      isMarkingAllRead: false,
      markReadError: null,
      loadMore: vi.fn(),
      retry: vi.fn(),
    })
  })

  it('uses only the Community notification source and never mounts legacy REST hooks', () => {
    renderBell()

    expect(mocks.useNotifications).not.toHaveBeenCalled()
    expect(mocks.useUnreadCount).not.toHaveBeenCalled()
    expect(mocks.useMarkNotificationRead).not.toHaveBeenCalled()
    expect(mocks.useMarkAllNotificationsRead).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '1 thông báo chưa đọc' }))
    const message = screen.getByText('Có bình luận mới trên bài viết của bạn.')
    const notificationButton = message.closest('button')
    expect(notificationButton).not.toBeNull()
    fireEvent.click(notificationButton!)

    expect(mocks.markRead).toHaveBeenCalledWith('community-notification-1')
    expect(screen.queryByText(/Web \+ Community/)).not.toBeInTheDocument()
  })
})
