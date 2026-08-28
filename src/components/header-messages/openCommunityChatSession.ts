import type { CommunityChatNotificationLike } from '../../data/communityChatNotificationUtils'
import {
  resolveCommunityChatSessionIdFromNotification,
} from '../../data/communityChatNotificationUtils'

export const OPEN_COMMUNITY_CHAT_SESSION_EVENT = 'nexora:open-community-chat-session' as const
export const OPEN_STAFF_COMMUNITY_CHAT_EVENT = 'nexora:open-staff-community-chat' as const

export interface OpenCommunityChatSessionDetail {
  sessionId: string
}

/** Open (or replace) the single desktop messenger window for a staff peer. */
export interface OpenStaffCommunityChatDetail {
  peerUserProfileId: string
  displayName: string
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

/**
 * Ask the header messenger to open a 1:1 staff chat by peer profile id.
 * Mobile (non-header entry) → immersive fullscreen chat. Desktop → floating window.
 */
export function openStaffCommunityChat(
  detail: OpenStaffCommunityChatDetail | null | undefined,
): void {
  if (typeof window === 'undefined') return
  const peerUserProfileId = String(detail?.peerUserProfileId ?? '').trim()
  if (!peerUserProfileId) return
  const displayName = String(detail?.displayName ?? '').trim() || peerUserProfileId

  window.dispatchEvent(
    new CustomEvent<OpenStaffCommunityChatDetail>(OPEN_STAFF_COMMUNITY_CHAT_EVENT, {
      detail: { peerUserProfileId, displayName },
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
