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

  it('maps direct payment notification to payments tab with paymentId', async () => {
    const client = {
      get: vi.fn().mockResolvedValue({
        items: [{
          id: 'n2',
          type: 'payment_received',
          title: 'Nhận được thanh toán',
          body: 'Tiệm nhận được thanh toán $50.00 qua Zelle',
          actionUrl: '/merchant/payments/abc-123',
          isRead: false,
          createdAt: '2026-06-26T10:05:00.000Z',
        }],
        pageNumber: 1,
        totalPages: 1,
        totalCount: 1,
      }),
    }

    const repo = createNotificationsRepository(client as never)
    const list = await repo.list()

    expect(list[0]).toMatchObject({
      linkTab: 'reports',
      paymentId: 'abc-123',
    })
  })

  it('maps the real backend TipReceived enum value to Reports > Tips with a transactionId to auto-open (issue #419)', async () => {
    const client = {
      get: vi.fn().mockResolvedValue({
        items: [{
          id: 'n3',
          type: 'TipReceived',
          title: 'New tip',
          body: 'You received a $5 tip',
          referenceId: 'tip-guid-1',
          isRead: false,
          createdAt: '2026-07-13T12:00:00.000Z',
        }],
        pageNumber: 1,
        totalPages: 1,
        totalCount: 1,
      }),
    }

    const repo = createNotificationsRepository(client as never)
    const list = await repo.list()

    // Must land on the 'reports' screen (the actual Transactions list with a
    // detail modal) — NOT the legacy top-level 'tips' screen, which is a
    // different "My Tips" earnings summary page with no transaction detail.
    expect(list[0]).toMatchObject({
      linkTab: 'reports',
      reportsTab: 'tips',
      transactionId: 'tip-guid-1',
    })
  })

  it('maps the real backend DirectPaymentReceived enum value to the reports tab', async () => {
    const client = {
      get: vi.fn().mockResolvedValue({
        items: [{
          id: 'n4',
          type: 'DirectPaymentReceived',
          title: 'Nhận được thanh toán',
          body: 'Tiệm nhận được thanh toán $50.00',
          actionUrl: '/merchant/payments/xyz-789',
          isRead: false,
          createdAt: '2026-07-13T12:00:00.000Z',
        }],
        pageNumber: 1,
        totalPages: 1,
        totalCount: 1,
      }),
    }

    const repo = createNotificationsRepository(client as never)
    const list = await repo.list()

    expect(list[0]).toMatchObject({
      linkTab: 'reports',
      paymentId: 'xyz-789',
    })
  })
})
