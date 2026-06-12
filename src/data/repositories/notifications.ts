/**
 * notificationsRepository — API-only implementation.
 */

import httpClient from '../../lib/httpClient'
import type { NotificationRecord, NotificationsPage } from '../../types/domain'
import type { NotificationApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

const NOTIFICATIONS_BASE = '/api/v1/Notifications'

interface NotificationsListResponse {
  items?: NotificationApiDto[]
  pageNumber?: number
  totalPages?: number
  totalCount?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}

interface NotificationsListParams {
  pageNumber?: number
  pageSize?: number
  isRead?: boolean | null
}

interface UnreadCountResponse {
  count?: number
}

function normalizeNotification(item: NotificationApiDto): NotificationRecord {
  const isRead = Boolean(item.isRead ?? item.read)
  const message = item.message ?? item.body ?? ''
  const createdAt = item.createdAt ?? ''
  return {
    id: item.id ?? '',
    type: item.type || 'info',
    title: item.title || '',
    message,
    body: message,
    actionUrl: item.actionUrl ?? null,
    isRead,
    read: isRead,
    readAt: item.readAt ?? null,
    referenceId: item.referenceId ?? null,
    createdAt: createdAt || undefined,
    time: createdAt ? new Date(createdAt).toLocaleString() : '',
  }
}

function normalizeNotificationsPage(
  response: NotificationApiDto[] | NotificationsListResponse,
  fallbackPageNumber = 0,
): NotificationsPage {
  const items = Array.isArray(response) ? response : (response.items ?? [])
  const pageNumber = Array.isArray(response) ? fallbackPageNumber : (response.pageNumber ?? fallbackPageNumber)
  const totalPages = Array.isArray(response) ? 1 : (response.totalPages ?? 0)
  return {
    items: items.map(normalizeNotification),
    pageNumber,
    totalPages,
    totalCount: Array.isArray(response) ? items.length : (response.totalCount ?? items.length),
    hasPreviousPage: Array.isArray(response) ? false : Boolean(response.hasPreviousPage),
    hasNextPage: Array.isArray(response) ? false : Boolean(response.hasNextPage),
  }
}

export function createNotificationsRepository(client: HttpClient = httpClient) {
  return {
    async listPaged({
      pageNumber = 0,
      pageSize = 20,
      isRead = null,
    }: NotificationsListParams = {}): Promise<NotificationsPage> {
      const params: Record<string, string | number> = {
        PageNumber: pageNumber,
        PageSize: pageSize,
      }
      if (isRead !== null && isRead !== undefined) {
        params.IsRead = String(isRead)
      }
      const response = await client.get<NotificationApiDto[] | NotificationsListResponse>(
        NOTIFICATIONS_BASE,
        { params },
      )
      return normalizeNotificationsPage(response, pageNumber)
    },

    async list(): Promise<NotificationRecord[]> {
      const page = await this.listPaged({ pageNumber: 0, pageSize: 50 })
      return page.items
    },

    async unreadCount(): Promise<number> {
      const response = await client.get<number | UnreadCountResponse>(
        `${NOTIFICATIONS_BASE}/unread-count`,
      )
      if (typeof response === 'number') return response
      return response.count ?? 0
    },

    async markRead(id: string): Promise<void> {
      await client.put(`${NOTIFICATIONS_BASE}/${id}/read`)
    },

    async markAllRead(): Promise<void> {
      await client.put(`${NOTIFICATIONS_BASE}/read-all`)
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
