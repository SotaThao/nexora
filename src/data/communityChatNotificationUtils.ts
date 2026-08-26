import {
  COMMUNITY_CHAT_NOTIFICATION_LINK_TAB,
  COMMUNITY_CHAT_NOTIFICATION_TYPE,
  COMMUNITY_CHAT_SESSION_PATH_PREFIX,
  normalizeCommunityChatTypeKey,
} from '../constants/communityChat'

export interface CommunityChatNotificationLike {
  type?: string | null
  actionUrl?: string | null
  referenceId?: string | null
  chatSessionId?: string | null
  linkTab?: string | null
}

/** Extract session id from `/community-chat/sessions/{id}` (absolute or relative). */
export function extractCommunityChatSessionIdFromActionUrl(
  actionUrl: string | null | undefined,
): string | null {
  const raw = String(actionUrl ?? '').trim()
  if (!raw) return null

  const escapedPrefix = COMMUNITY_CHAT_SESSION_PATH_PREFIX.replace(/\//g, '\\/')
  const match = raw.match(new RegExp(`${escapedPrefix}\\/([^/?#]+)`, 'i'))
  return match?.[1]?.trim() || null
}

export function isCommunityNewChatMessageNotification(
  type: string | null | undefined,
): boolean {
  return normalizeCommunityChatTypeKey(type) === normalizeCommunityChatTypeKey(
    COMMUNITY_CHAT_NOTIFICATION_TYPE,
  )
}

export function isCommunityChatNotificationLinkTab(
  linkTab: string | null | undefined,
): boolean {
  return String(linkTab ?? '').trim() === COMMUNITY_CHAT_NOTIFICATION_LINK_TAB
}

export function resolveCommunityChatSessionIdFromNotification(
  notification: CommunityChatNotificationLike | null | undefined,
): string | null {
  if (!notification) return null

  const direct = String(notification.chatSessionId ?? '').trim()
  if (direct) return direct

  const fromUrl = extractCommunityChatSessionIdFromActionUrl(notification.actionUrl)
  if (fromUrl) return fromUrl

  if (!isCommunityNewChatMessageNotification(notification.type)) return null

  return String(notification.referenceId ?? '').trim() || null
}

export { COMMUNITY_CHAT_NOTIFICATION_LINK_TAB }
