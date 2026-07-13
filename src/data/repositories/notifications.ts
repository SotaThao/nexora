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
 *
 * Real backend values (see NotificationType enum in the live Swagger spec,
 * https://test-api.nexoratouch.com/api/specification.json) are PascalCase,
 * e.g. `StaffLinkApproved`, `StaffLinkRequestAccepted`. Older snake_case
 * entries are kept as harmless aliases in case of legacy/mocked data.
 */
const STAFF_NOTIFICATION_TYPES = new Set([
  'staff_accepted_invite',
  'staffacceptedinvite',
  'staffinviteaccepted', // StaffInviteAccepted
  'stafflinkrequest', // StaffLinkRequest
  'staff_link_request',
  'staffpublicjoinrequest', // StaffPublicJoinRequest
  'staff_joined',
  'staffjoined',
  'stafflinkapproved', // StaffLinkApproved
  'stafflinkrejected', // StaffLinkRejected
  'stafflinkrequestaccepted', // StaffLinkRequestAccepted
  'stafflinkrequestrejected', // StaffLinkRequestRejected
])

/**
 * Notification types that map to a specific dashboard tab (linkTab).
 * Add new mappings here as the API introduces new notification types.
 *
 * `tipreceived` / `directpaymentreceived` are the real backend enum values
 * (TipReceived / DirectPaymentReceived) — without them, tip and direct
 * payment notifications fell through with no linkTab and never navigated.
 *
 * Both tip and direct-payment notifications land on the 'reports' screen
 * (the actual Transactions list, `/dashboard/reports`) — NOT the legacy
 * top-level 'tips' screen (`/dashboard/tips`, the "My Tips" earnings
 * summary), which is a different page with no transaction list/modal.
 * `TYPE_TO_REPORTS_TAB` below picks which sub-tab opens within Reports.
 */
const TYPE_TO_LINK_TAB: Record<string, string> = {
  tipreceived: 'reports', // TipReceived
  tip_success: 'reports',
  tip: 'reports',
  review_good: 'reviews',
  review: 'reviews',
  reviewreply: 'reviews', // ReviewReply
  feedback_alert: 'reviews',
  payment_received: 'reports',
  paymentreceived: 'reports',
  direct_payment: 'reports',
  directpayment: 'reports',
  directpaymentreceived: 'reports', // DirectPaymentReceived
  payment: 'reports',
}

/**
 * When linkTab === 'reports', which sub-tab (Reports "Tips" vs "Direct
 * Payments") the notification should open.
 */
const TYPE_TO_REPORTS_TAB: Record<string, string> = {
  tipreceived: 'tips',
  tip_success: 'tips',
  tip: 'tips',
  payment_received: 'direct_payments',
  paymentreceived: 'direct_payments',
  direct_payment: 'direct_payments',
  directpayment: 'direct_payments',
  directpaymentreceived: 'direct_payments',
  payment: 'direct_payments',
}

/**
 * Extract a staffId/referenceId from the notification's actionUrl.
 * Supports patterns like:
 *   /staff/{id}, /staff/links/{id}, /merchant/staff/{id}
 */
function extractStaffIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const requestMatch = url.match(/\/merchant\/staff\/requests\/([^/?#]+)/i)
  if (requestMatch?.[1]) return requestMatch[1]
  const match = url.match(/\/(?:merchant\/)?staff(?:\/links)?\/([^/?#]+)/i)
  return match?.[1] || null
}

function extractPaymentIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const match = url.match(/\/(?:merchant\/)?payments\/([^/?#]+)/i)
  return match?.[1] || null
}

function normalizeNotificationType(type: string): string {
  return type.toLowerCase().replace(/[\s_-]+/g, '')
}

function normalizeNotification(item: NotificationApiDto): NotificationRecord {
  const isRead = Boolean(item.isRead ?? item.read)
  const body = item.body ?? item.message ?? ''
  const createdAt = item.createdAt ?? ''
  const type = item.type || 'info'
  const typeLower = normalizeNotificationType(type)

  // Derive linkTab and staffId for navigation on click
  let linkTab: string | undefined
  let staffId: string | undefined
  let paymentId: string | undefined
  let transactionId: string | undefined
  let reportsTab: string | undefined

  const paymentIdFromUrl = extractPaymentIdFromUrl(item.actionUrl)

  if (STAFF_NOTIFICATION_TYPES.has(typeLower)) {
    linkTab = 'staff'
    staffId = item.referenceId || extractStaffIdFromUrl(item.actionUrl) || undefined
  } else if (TYPE_TO_LINK_TAB[typeLower]) {
    linkTab = TYPE_TO_LINK_TAB[typeLower]
    if (linkTab === 'reports') {
      reportsTab = TYPE_TO_REPORTS_TAB[typeLower] || 'tips'
    }
  } else if (paymentIdFromUrl) {
    linkTab = 'reports'
  } else if (item.actionUrl) {
    // Fallback: try to derive linkTab from actionUrl path
    const urlMatch = item.actionUrl.match(/\/dashboard\/([^/?#]+)/i)
    if (urlMatch) linkTab = urlMatch[1]
    if (item.actionUrl.includes('/merchant/staff')) linkTab = 'staff'
  }

  if (linkTab === 'reports') {
    reportsTab = reportsTab || 'direct_payments'
    if (reportsTab === 'tips') {
      // No single-tip-by-id endpoint exists yet, so the Reports "Tips" tab
      // matches this against its currently loaded list client-side.
      transactionId = item.referenceId || undefined
    } else {
      paymentId = paymentIdFromUrl || item.referenceId || undefined
    }
  }

  return {
    id: item.id ?? '',
    type,
    title: item.title || '',
    message: body,
    body,
    actionUrl: item.actionUrl ?? null,
    isRead,
    read: isRead,
    createdAt: createdAt || undefined,
    time: createdAt,
    ...(linkTab ? { linkTab } : {}),
    ...(reportsTab ? { reportsTab } : {}),
    ...(staffId ? { staffId } : {}),
    ...(paymentId ? { paymentId } : {}),
    ...(transactionId ? { transactionId } : {}),
  }
}

function normalizeNotificationsPage(
  response: NotificationApiDto[] | NotificationsListResponse,
  pageNumber: number,
): NotificationsPage {
  if (Array.isArray(response)) {
    const items = response.map(normalizeNotification)
    return {
      items,
      pageNumber,
      totalPages: 1,
      totalCount: items.length,
      hasPreviousPage: false,
      hasNextPage: false,
    }
  }

  const items = (response.items ?? []).map(normalizeNotification)
  return {
    items,
    pageNumber: response.pageNumber ?? pageNumber,
    totalPages: response.totalPages ?? 1,
    totalCount: response.totalCount ?? items.length,
    hasPreviousPage: response.hasPreviousPage ?? false,
    hasNextPage: response.hasNextPage ?? false,
  }
}

export function createNotificationsRepository(client: HttpClient = httpClient) {
  return {
    async listPaged({
      pageNumber = 1,
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
      const page = await this.listPaged({ pageNumber: 1, pageSize: 50 })
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
