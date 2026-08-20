/**
 * Community Chat — domain enums and limits.
 * Matches backend Nexora.Domain.Enums.Community.* (US-101 → US-107).
 */

export enum CommunityChatType {
  OneOnOne = 'OneOnOne',
  Group = 'Group',
}

export enum CommunityChatStatus {
  Active = 'Active',
  Archived = 'Archived',
}

export enum CommunityChatMessageType {
  Text = 'Text',
  Image = 'Image',
  File = 'File',
  System = 'System',
}

/** REST base route segment (appended to VITE_API_BASE_URL). */
export const COMMUNITY_CHAT_REST_BASE = '/api/v1/community/chat'

/** SignalR hub path (appended to VITE_API_BASE_URL). */
export const COMMUNITY_CHAT_HUB_PATH = '/hubs/community-chat'

/** SignalR group name prefix — server joins clients to `ChatSession_{sessionId}`. */
export const COMMUNITY_CHAT_SIGNALR_GROUP_PREFIX = 'ChatSession_'

/** Default page size for message history (matches backend default). */
export const COMMUNITY_CHAT_DEFAULT_PAGE_SIZE = 20

/** Max group title length (characters). */
export const COMMUNITY_CHAT_MAX_TITLE_LENGTH = 200

/** Max image upload size in bytes (10 MB). */
export const COMMUNITY_CHAT_MAX_IMAGE_BYTES = 10_000_000

/** Allowed image extensions for chat uploads. */
export const COMMUNITY_CHAT_ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'] as const

/** Deep-link path segment for push notification actionUrl. */
export const COMMUNITY_CHAT_SESSION_PATH_PREFIX = '/community-chat/sessions'

/** OneSignal / NotificationType.CommunityNewChatMessage (backend enum value = 25). */
export const COMMUNITY_CHAT_NOTIFICATION_TYPE = 'CommunityNewChatMessage'

/** Recommended client-side typing indicator timeout (server has no auto-stop). */
export const COMMUNITY_CHAT_TYPING_INDICATOR_TIMEOUT_MS = 5_000
