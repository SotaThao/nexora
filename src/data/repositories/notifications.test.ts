import { describe, expect, it, vi } from 'vitest'
import { createNotificationsRepository } from './notifications'

describe('notificationsRepository', () => {
  it('maps paged notification items to UI records', async () => {
    const client = {
      get: vi.fn().mockResolvedValue({
        items: [{
          id: 'n1',
          type: 'tip_success',
          title: 'New tip',
          body: 'You received a $5 tip',
          isRead: false,
          createdAt: '2026-01-01T12:00:00.000Z',
        }],
        pageNumber: 1,
        totalPages: 1,
        totalCount: 1,
      }),
    }

    const repo = createNotificationsRepository(client as never)
    const list = await repo.list()

    expect(client.get).toHaveBeenCalledTimes(1)
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({
      id: 'n1',
      title: 'New tip',
      message: 'You received a $5 tip',
      body: 'You received a $5 tip',
      read: false,
    })
  })
})
