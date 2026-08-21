import { CommunityChatType } from '../../constants/communityChat'

export enum HeaderMessagesTab {
  Messages = 'messages',
  Groups = 'groups',
}

export enum HeaderMessagesVariant {
  Desktop = 'desktop',
  Mobile = 'mobile',
}

export enum HeaderMessagesEmptyVariant {
  Messages = 'messages',
  Groups = 'groups',
  Search = 'search',
}

export enum HeaderMessageListPreviewKey {
  Desktop = 'openDirectChat',
  Mobile = 'openDirectChatMobile',
}

export enum HeaderMessageChatLayout {
  Floating = 'floating',
  Fullscreen = 'fullscreen',
}

export enum HeaderChatMessageDirection {
  Incoming = 'incoming',
  Outgoing = 'outgoing',
}

export enum HeaderChatMessageReceiptStatus {
  Sent = 'sent',
  Read = 'read',
}

/** Floating message-actions menu (⋮) layout tokens. */
export const HEADER_MESSAGE_CHAT_MENU_PANEL_WIDTH_PX = 152
export const HEADER_MESSAGE_CHAT_MENU_GAP_PX = 6
export const HEADER_MESSAGE_CHAT_MENU_Z_INDEX = 100_000
export const HEADER_MESSAGE_CHAT_MENU_OPEN_ABOVE_MIN_TOP_PX = 120

export interface HeaderMessageConversation {
  id: string
  name: string
  initials: string
  chatType?: CommunityChatType
  /** Fallback list preview when no last message is available yet. */
  previewKey: HeaderMessageListPreviewKey
  /** i18n key under `dashboard.header.messages.chat` for the latest message preview. */
  lastMessagePreviewKey?: string
  /** Mock-only plain preview until API returns last message text. */
  lastMessagePreviewText?: string
  updatedAt: string
  unreadCount?: number
}

export interface HeaderChatMessageReplyTo {
  messageId: string
  senderName: string
  previewText: string
}

export interface HeaderChatThreadMessage {
  id: string
  direction: HeaderChatMessageDirection
  bodyKey?: string
  bodyText?: string
  imageUrl?: string
  replyTo?: HeaderChatMessageReplyTo
  sentAt: string
  /** Outgoing only — delivery/read receipt for the recipient. */
  receiptStatus?: HeaderChatMessageReceiptStatus
}

function applyMockOutgoingReceipts(messages: HeaderChatThreadMessage[]): HeaderChatThreadMessage[] {
  const lastOutgoingId = [...messages]
    .reverse()
    .find((message) => message.direction === HeaderChatMessageDirection.Outgoing)?.id

  return messages.map((message) => {
    if (message.direction !== HeaderChatMessageDirection.Outgoing) return message
    if (message.receiptStatus) return message

    return {
      ...message,
      receiptStatus: message.id === lastOutgoingId
        ? HeaderChatMessageReceiptStatus.Sent
        : HeaderChatMessageReceiptStatus.Read,
    }
  })
}

const MOCK_FIRST_NAMES = [
  'Kayla', 'Minh', 'Sarah', 'James', 'Emily', 'David', 'Linh', 'Alex', 'Maria', 'Chris',
  'Anna', 'Brian', 'Sophie', 'Kevin', 'Nina', 'Tom', 'Hana', 'Eric', 'Laura', 'Ryan',
  'Olivia', 'Daniel', 'Chloe', 'Mark', 'Grace', 'Paul', 'Mia', 'Steve', 'Ruby', 'Jason',
] as const

const MOCK_LAST_NAMES = [
  'Le', 'Nguyen', 'Chen', 'Wilson', 'Park', 'Garcia', 'Tran', 'Kim', 'Brown', 'Lee',
  'Martinez', 'Johnson', 'Davis', 'Rodriguez', 'Lopez', 'White', 'Hall', 'Young', 'King', 'Wright',
  'Scott', 'Adams', 'Baker', 'Clark', 'Evans', 'Foster', 'Green', 'Hill', 'Moore', 'Reed',
] as const

const MOCK_PREVIEW_SNIPPETS = [
  'Thanks for the update!',
  'See you tomorrow.',
  'Can we reschedule?',
  'Got it — will follow up shortly.',
  'Sounds good to me.',
  'Please send the details when you can.',
  'I shared the file in the group.',
  'Let me check and get back to you.',
  'Are you available this afternoon?',
  'Perfect, talk soon!',
  'Just confirmed the appointment.',
  'Could you review this today?',
  'On my way now.',
  'Received — thank you!',
  'Happy to help anytime.',
] as const

function getMockContactInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function buildMockConversations(): HeaderMessageConversation[] {
  return Array.from({ length: 50 }, (_, index) => {
    if (index === 0) {
      return {
        id: 'kayla-le',
        name: 'Kayla Le',
        initials: 'KL',
        previewKey: HeaderMessageListPreviewKey.Desktop,
        lastMessagePreviewKey: 'mockMsg16',
        updatedAt: '2026-07-22T22:31:00Z',
        unreadCount: 1,
      }
    }

    const firstName = MOCK_FIRST_NAMES[index % MOCK_FIRST_NAMES.length]
    const lastName = MOCK_LAST_NAMES[(index + 7) % MOCK_LAST_NAMES.length]
    const name = `${firstName} ${lastName}`

    return {
      id: `mock-conv-${index + 1}`,
      name,
      initials: getMockContactInitials(name),
      previewKey: HeaderMessageListPreviewKey.Desktop,
      lastMessagePreviewText: MOCK_PREVIEW_SNIPPETS[index % MOCK_PREVIEW_SNIPPETS.length],
      updatedAt: new Date(Date.now() - index * 3 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
    }
  })
}

/** Placeholder data until Community messenger API is integrated. */
export const HEADER_MESSAGES_MOCK_CONVERSATIONS: HeaderMessageConversation[] = buildMockConversations()

export const HEADER_MESSAGES_MOCK_UNREAD_TOTAL = HEADER_MESSAGES_MOCK_CONVERSATIONS.reduce(
  (sum, conversation) => sum + (conversation.unreadCount ?? 0),
  0,
)

export const HEADER_MESSAGES_MOCK_GROUPS: { id: string; name: string }[] = []

export const HEADER_MESSAGES_MOCK_GROUP_COUNT = HEADER_MESSAGES_MOCK_GROUPS.length

export const HEADER_MESSAGES_MOCK_THREADS: Record<string, HeaderChatThreadMessage[]> = {
  'kayla-le': applyMockOutgoingReceipts([
    { id: 'm1', direction: HeaderChatMessageDirection.Outgoing, bodyKey: 'mockMsg1', sentAt: '2026-07-22T09:05:00Z' },
    { id: 'm2', direction: HeaderChatMessageDirection.Incoming, bodyKey: 'mockMsg2', sentAt: '2026-07-22T09:08:00Z' },
    { id: 'm3', direction: HeaderChatMessageDirection.Incoming, bodyKey: 'mockMsg3', sentAt: '2026-07-22T09:09:00Z' },
    { id: 'm4', direction: HeaderChatMessageDirection.Outgoing, bodyKey: 'mockMsg4', sentAt: '2026-07-22T09:12:00Z' },
    { id: 'm5', direction: HeaderChatMessageDirection.Incoming, bodyKey: 'mockMsg5', sentAt: '2026-07-22T09:18:00Z' },
    { id: 'm6', direction: HeaderChatMessageDirection.Outgoing, bodyKey: 'mockMsg6', sentAt: '2026-07-22T09:20:00Z' },
    { id: 'm7', direction: HeaderChatMessageDirection.Incoming, bodyKey: 'mockMsg7', sentAt: '2026-07-22T09:25:00Z' },
    { id: 'm8', direction: HeaderChatMessageDirection.Outgoing, bodyKey: 'mockMsg8', sentAt: '2026-07-22T09:28:00Z' },
    { id: 'm9', direction: HeaderChatMessageDirection.Incoming, bodyKey: 'mockMsg9', sentAt: '2026-07-22T09:32:00Z' },
    { id: 'm10', direction: HeaderChatMessageDirection.Incoming, bodyKey: 'mockMsg10', sentAt: '2026-07-22T09:33:00Z' },
    { id: 'm11', direction: HeaderChatMessageDirection.Outgoing, bodyKey: 'mockMsg11', sentAt: '2026-07-22T09:35:00Z' },
    { id: 'm12', direction: HeaderChatMessageDirection.Incoming, bodyKey: 'mockMsg12', sentAt: '2026-07-22T09:40:00Z' },
    { id: 'm13', direction: HeaderChatMessageDirection.Outgoing, bodyKey: 'mockMsg13', sentAt: '2026-07-22T09:42:00Z' },
    { id: 'm14', direction: HeaderChatMessageDirection.Incoming, bodyKey: 'mockMsg14', sentAt: '2026-07-22T09:45:00Z' },
    { id: 'm15', direction: HeaderChatMessageDirection.Outgoing, bodyKey: 'mockMsg15', sentAt: '2026-07-22T09:48:00Z' },
    { id: 'm16', direction: HeaderChatMessageDirection.Incoming, bodyKey: 'mockMsg16', sentAt: '2026-07-22T09:50:00Z' },
  ]),
}

export const HEADER_MESSAGES_I18N = 'dashboard.header.messages' as const
export const HEADER_MESSAGES_CHAT_I18N = `${HEADER_MESSAGES_I18N}.chat` as const

export const HEADER_MESSAGES_UNREAD_BADGE_MAX = 99
export const HEADER_MESSAGES_UNREAD_BADGE_OVERFLOW_LABEL = '99+'
export const HEADER_MESSAGES_LIST_SKELETON_COUNT = 5

export const HEADER_MESSAGE_CHAT_LOADING_MS = 900
export const HEADER_MESSAGE_RECEIPT_READ_MS = 2800
export const HEADER_MESSAGE_REPLY_PREVIEW_MAX = 48

export const HEADER_MESSAGE_NEW_CHAT_STARTER_KEYS = [
  'newChatStarterHi',
  'newChatStarterAsk',
  'newChatStarterThanks',
] as const

export function formatHeaderMessagesUnreadCount(count: number): string {
  return count > HEADER_MESSAGES_UNREAD_BADGE_MAX
    ? HEADER_MESSAGES_UNREAD_BADGE_OVERFLOW_LABEL
    : String(count)
}

/** Marks portaled chat windows so header dropdown click-outside ignores them. */
export const HEADER_MESSAGE_CHAT_ROOT_ATTR = 'data-header-message-chat-root'
export const HEADER_MESSAGE_CHAT_ROOT_SELECTOR = `[${HEADER_MESSAGE_CHAT_ROOT_ATTR}]`

export const HEADER_MESSAGE_FLOATING_CHAT_WIDTH_PX = 360
export const HEADER_MESSAGE_FLOATING_CHAT_GAP_PX = 12
export const HEADER_MESSAGE_FLOATING_CHAT_FAB_SIZE_PX = 56
export const HEADER_MESSAGE_DESKTOP_EDGE_INSET_PX = 16
export const HEADER_MESSAGE_DESKTOP_PANEL_RESERVE_PX = 420

export const HEADER_MESSAGE_DESKTOP_DEFAULT_VIEWPORT_WIDTH_PX = 1280

export function getDesktopChatSessionWidthPx(session: HeaderDesktopChatSession): number {
  return session.minimized
    ? HEADER_MESSAGE_FLOATING_CHAT_FAB_SIZE_PX
    : HEADER_MESSAGE_FLOATING_CHAT_WIDTH_PX
}

export function getDesktopChatStripMaxWidthPx(
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : HEADER_MESSAGE_DESKTOP_DEFAULT_VIEWPORT_WIDTH_PX,
  messagesPanelOpen = false,
): number {
  const panelReserve = messagesPanelOpen ? HEADER_MESSAGE_DESKTOP_PANEL_RESERVE_PX : 0
  return Math.max(
    HEADER_MESSAGE_FLOATING_CHAT_WIDTH_PX,
    viewportWidth - HEADER_MESSAGE_DESKTOP_EDGE_INSET_PX - panelReserve,
  )
}

export function getHeaderMessageChatStackRightPx(
  sessions: HeaderDesktopChatSession[],
  sessionIndex: number,
): number {
  let offset = 0
  for (let index = 0; index < sessionIndex; index += 1) {
    offset += getDesktopChatSessionWidthPx(sessions[index]) + HEADER_MESSAGE_FLOATING_CHAT_GAP_PX
  }
  return offset
}

function getDesktopChatStripWidthPx(sessions: HeaderDesktopChatSession[]): number {
  return sessions.reduce((total, session, index) => {
    const gap = index === 0 ? 0 : HEADER_MESSAGE_FLOATING_CHAT_GAP_PX
    return total + getDesktopChatSessionWidthPx(session) + gap
  }, 0)
}

/** Minimize oldest expanded chats when overflowing; drop oldest session when all are minimized. */
export function normalizeDesktopChatSessions(
  sessions: HeaderDesktopChatSession[],
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : HEADER_MESSAGE_DESKTOP_DEFAULT_VIEWPORT_WIDTH_PX,
  messagesPanelOpen = false,
  keepExpandedConversationId?: string | null,
): HeaderDesktopChatSession[] {
  let next = sessions.map((session) => ({ ...session }))
  const maxStripWidth = getDesktopChatStripMaxWidthPx(viewportWidth, messagesPanelOpen)

  while (getDesktopChatStripWidthPx(next) > maxStripWidth) {
    const oldestExpandedIndex = next.findIndex(
      (session) => !session.minimized && session.conversation.id !== keepExpandedConversationId,
    )
    if (oldestExpandedIndex >= 0) {
      next[oldestExpandedIndex] = { ...next[oldestExpandedIndex], minimized: true }
      continue
    }

    if (next.length <= 1) break
    next = next.slice(1)
  }

  return next
}

export function expandDesktopChatSessionInPlace(
  sessions: HeaderDesktopChatSession[],
  conversationId: string,
): HeaderDesktopChatSession[] {
  return sessions.map((session) => (
    session.conversation.id === conversationId
      ? { ...session, minimized: false }
      : session
  ))
}

export const HEADER_MESSAGE_DESKTOP_CHAT_Z_BASE = 100
export const HEADER_MESSAGE_DESKTOP_CHAT_Z_FOCUSED = 200

export function promoteDesktopChatSession(
  sessions: HeaderDesktopChatSession[],
  conversation: HeaderMessageConversation,
): HeaderDesktopChatSession[] {
  const rest = sessions.filter((session) => session.conversation.id !== conversation.id)
  return [...rest, { conversation, minimized: false }]
}

export interface HeaderDesktopChatSession {
  conversation: HeaderMessageConversation
  minimized: boolean
}
