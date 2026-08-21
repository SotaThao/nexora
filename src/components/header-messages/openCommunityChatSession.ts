import type { CommunityChatNotificationLike } from '../../data/communityChatNotificationUtils'
import {
  resolveCommunityChatSessionIdFromNotification,
} from '../../data/communityChatNotificationUtils'

export const OPEN_COMMUNITY_CHAT_SESSION_EVENT = 'nexora:open-community-chat-session' as const

export interface OpenCommunityChatSessionDetail {
  sessionId: string
}

export type {
  CommunityChatNotificationLike,
} from '../../data/communityChatNotificationUtils'

export {
  extractCommunityChatSessionIdFromActionUrl,
  isCommunityChatNotificationLinkTab,
  isCommunityNewChatMessageNotification,
  resolveCommunityChatSessionIdFromNotification,
} from '../../data/communityChatNotificationUtils'

/** Ask the header messenger (merchant/staff) to open a chat session window. */
export function openCommunityChatSession(sessionId: string | null | undefined): void {
  const id = String(sessionId ?? '').trim()
  if (!id || typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent<OpenCommunityChatSessionDetail>(OPEN_COMMUNITY_CHAT_SESSION_EVENT, {
      detail: { sessionId: id },
    }),
  )
}

/** Resolve + open from a notification record. Returns true when a session open was requested. */
export function openCommunityChatFromNotification(
  notification: CommunityChatNotificationLike | null | undefined,
): boolean {
  const sessionId = resolveCommunityChatSessionIdFromNotification(notification)
  if (!sessionId) return false
  openCommunityChatSession(sessionId)
  return true
}
