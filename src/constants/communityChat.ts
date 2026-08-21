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

/** Scroll distance from top (px) that triggers loading the next older page. */
export const COMMUNITY_CHAT_THREAD_SCROLL_LOAD_THRESHOLD_PX = 72

/** Max group title length (characters). */
export const COMMUNITY_CHAT_MAX_TITLE_LENGTH = 200

/** Max image upload size in bytes (10 MB). */
export const COMMUNITY_CHAT_MAX_IMAGE_BYTES = 10_000_000

/** Allowed image extensions for chat uploads. */
export const COMMUNITY_CHAT_ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'] as const

/** Allowed MIME types for chat image uploads. */
export const COMMUNITY_CHAT_ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const

/** `<input accept>` value for chat image uploads. */
export const COMMUNITY_CHAT_IMAGE_ACCEPT = [
  ...COMMUNITY_CHAT_ALLOWED_IMAGE_EXTENSIONS,
  ...COMMUNITY_CHAT_ALLOWED_IMAGE_MIME_TYPES,
].join(',')

export function isAllowedCommunityChatImageFile(file: File | null | undefined): boolean {
  if (!file) return false
  if (file.size <= 0 || file.size > COMMUNITY_CHAT_MAX_IMAGE_BYTES) return false

  const name = file.name.toLowerCase()
  const hasAllowedExtension = COMMUNITY_CHAT_ALLOWED_IMAGE_EXTENSIONS.some((ext) => (
    name.endsWith(ext)
  ))
  const type = String(file.type ?? '').toLowerCase()
  const hasAllowedMime = (COMMUNITY_CHAT_ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(type)
  return hasAllowedExtension || hasAllowedMime
}

/** Client-only conversation id until POST /community/chat/sessions runs. */
export const COMMUNITY_CHAT_PENDING_SESSION_ID_PREFIX = 'pending:' as const

export function buildPendingCommunityChatSessionId(windowKey: string): string {
  return `${COMMUNITY_CHAT_PENDING_SESSION_ID_PREFIX}${windowKey}`
}

export function isPendingCommunityChatSessionId(sessionId: string | null | undefined): boolean {
  return String(sessionId ?? '').startsWith(COMMUNITY_CHAT_PENDING_SESSION_ID_PREFIX)
}

/** Deep-link path segment for push notification actionUrl. */
export const COMMUNITY_CHAT_SESSION_PATH_PREFIX = '/community-chat/sessions'

/** OneSignal / NotificationType.CommunityNewChatMessage (backend enum value = 25). */
export const COMMUNITY_CHAT_NOTIFICATION_TYPE = 'CommunityNewChatMessage'

/**
 * Dashboard notification `linkTab` for CommunityNewChatMessage —
 * opens header messenger (not a sidebar route).
 */
export const COMMUNITY_CHAT_NOTIFICATION_LINK_TAB = 'messages' as const

/** Recommended client-side typing indicator timeout (server has no auto-stop). */
export const COMMUNITY_CHAT_TYPING_INDICATOR_TIMEOUT_MS = 5_000

export function normalizeCommunityChatTypeKey(value: string | null | undefined): string {
  return String(value ?? '').toLowerCase().replace(/[\s_-]+/g, '')
}
