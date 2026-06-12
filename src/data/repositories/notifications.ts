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

/**
 * Notification types that should navigate to the staff tab and open
 * the approve/review modal. Matched case-insensitively.
 */
const STAFF_NOTIFICATION_TYPES = new Set([
  'staff_accepted_invite',
  'staffacceptedinvite',
  'stafflinkrequest',
  'staff_link_request',
  'staff_joined',
  'staffjoined',
])

/**
 * Notification types that map to a specific dashboard tab (linkTab).
 * Add new mappings here as the API introduces new notification types.
 */
const TYPE_TO_LINK_TAB: Record<string, string> = {
  tip_success: 'tips',
  tip: 'tips',
  review_good: 'reviews',
  review: 'reviews',
  feedback_alert: 'reviews',
}

/**
 * Extract a staffId/referenceId from the notification's actionUrl.
 * Supports patterns like:
 *   /staff/{id}, /staff/links/{id}, /merchant/staff/{id}
 */
function extractStaffIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const match = url.match(/\/(?:merchant\/)?staff(?:\/links)?\/([^/?#]+)/i)
  return match?.[1] || null
}

function normalizeNotification(item: NotificationApiDto): NotificationRecord {
  const isRead = Boolean(item.isRead || item.read)
  const body = item.body || item.message || ''
  const createdAt = item.createdAt || new Date().toISOString()
  const type = item.type || 'info'
  const typeLower = type.toLowerCase()

  // Derive linkTab and staffId for navigation on click
  let linkTab: string | undefined
  let staffId: string | undefined

  if (STAFF_NOTIFICATION_TYPES.has(typeLower)) {
    linkTab = 'staff'
    staffId = item.referenceId || extractStaffIdFromUrl(item.actionUrl) || undefined
  } else if (TYPE_TO_LINK_TAB[typeLower]) {
    linkTab = TYPE_TO_LINK_TAB[typeLower]
  } else if (item.actionUrl) {
    // Fallback: try to derive linkTab from actionUrl path
    const urlMatch = item.actionUrl.match(/\/dashboard\/([^/?#]+)/i)
    if (urlMatch) linkTab = urlMatch[1]
  }

  return {
    id: item.id ?? '',
    type,
    title: item.title || '',
    body,
    actionUrl: item.actionUrl ?? null,
    referenceId: item.referenceId ?? null,
    isRead,
    createdAt,
    read: isRead,
    message: body,
    time: new Date(createdAt).toLocaleString(),
    ...(linkTab ? { linkTab } : {}),
    ...(staffId ? { staffId } : {}),
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
