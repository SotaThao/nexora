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
    message,
    body: message,
    actionUrl: item.actionUrl ?? null,
    isRead,
    read: isRead,
    message: body,
    time: new Date(createdAt).toLocaleString(),
    ...(linkTab ? { linkTab } : {}),
    ...(staffId ? { staffId } : {}),
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
