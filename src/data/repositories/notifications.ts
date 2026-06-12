/**
 * notificationsRepository — API-only implementation.
 */

import httpClient from '../../lib/httpClient'
import type { NotificationRecord } from '../../types/domain'
import type { NotificationApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

interface NotificationsListResponse {
  items?: NotificationApiDto[]
  data?: NotificationApiDto[]
}

interface UnreadCountResponse {
  count?: number
}

function normalizeNotification(item: NotificationApiDto): NotificationRecord {
  const isRead = Boolean(item.isRead || item.read)
  const body = item.body || item.message || ''
  const createdAt = item.createdAt || new Date().toISOString()
  return {
    id: item.id ?? '',
    type: item.type || 'info',
    title: item.title || '',
    body,
    isRead,
    createdAt,
    read: isRead,
    message: body,
    time: new Date(createdAt).toLocaleString(),
  }
}

export function createNotificationsRepository(client: HttpClient = httpClient) {
  return {
    async list(): Promise<NotificationRecord[]> {
      const response = await client.get<NotificationApiDto[] | NotificationsListResponse>(
        '/api/v1/notifications',
      )
      const items = Array.isArray(response) ? response : (response.items || response.data || [])
      return items.map(normalizeNotification)
    },

    async unreadCount(): Promise<number> {
      const response = await client.get<number | UnreadCountResponse>('/api/v1/notifications/unread-count')
      return typeof response === 'number' ? response : (response.count || 0)
    },

    async markRead(id: string): Promise<void> {
      await client.put(`/api/v1/notifications/${id}/read`)
    },

    async markAllRead(): Promise<void> {
      await client.put('/api/v1/notifications/read-all')
    },

    async add(notification: NotificationRecord): Promise<NotificationRecord> {
      return notification
    },

    async replaceAll(_list: NotificationRecord[]): Promise<void> {
      // no-op
    },
  }
}

export const notificationsRepository = createNotificationsRepository()
export default notificationsRepository
