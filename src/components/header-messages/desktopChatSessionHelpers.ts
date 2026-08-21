import {
  expandDesktopChatSessionInPlace,
  normalizeDesktopChatSessions,
  type HeaderDesktopChatSession,
  type HeaderMessageConversation,
} from './headerMessagesConstants'

export interface DesktopChatLayoutContext {
  messagesPanelOpen: boolean
  keepExpandedConversationId?: string | null
}

export function getHeaderMessagesViewportWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 1280
}

export function layoutDesktopChatSessions(
  sessions: HeaderDesktopChatSession[],
  context: DesktopChatLayoutContext,
  viewportWidth = getHeaderMessagesViewportWidth(),
): HeaderDesktopChatSession[] {
  return normalizeDesktopChatSessions(
    sessions,
    viewportWidth,
    context.messagesPanelOpen,
    context.keepExpandedConversationId,
  )
}

export function minimizeDesktopChatSessionInPlace(
  sessions: HeaderDesktopChatSession[],
  conversationId: string,
): HeaderDesktopChatSession[] {
  return sessions.map((session) => (
    session.conversation.id === conversationId
      ? { ...session, minimized: true }
      : session
  ))
}

export function resolveDesktopConversationOpen(
  sessions: HeaderDesktopChatSession[],
  conversation: HeaderMessageConversation,
  _context: DesktopChatLayoutContext,
): HeaderDesktopChatSession[] {
  const existing = sessions.find(
    (session) => session.conversation.id === conversation.id,
  )

  // Single floating chat only — opening another conversation replaces the current one.
  if (existing && !existing.minimized) {
    return [{ conversation, minimized: true }]
  }

  return [{ conversation, minimized: false }]
}

/** Always expand (never toggle-minimize). Used when opening from a notification. */
export function resolveDesktopConversationForceOpen(
  _sessions: HeaderDesktopChatSession[],
  conversation: HeaderMessageConversation,
  _context: DesktopChatLayoutContext,
): HeaderDesktopChatSession[] {
  // Single floating chat — replace any previously open window.
  return [{ conversation, minimized: false }]
}

export function resolveDesktopConversationExpand(
  sessions: HeaderDesktopChatSession[],
  conversationId: string,
  context: DesktopChatLayoutContext,
): HeaderDesktopChatSession[] {
  return layoutDesktopChatSessions(
    expandDesktopChatSessionInPlace(sessions, conversationId),
    { ...context, keepExpandedConversationId: conversationId },
  )
}

export function resolveDesktopConversationMinimize(
  sessions: HeaderDesktopChatSession[],
  conversationId: string,
  context: DesktopChatLayoutContext,
): HeaderDesktopChatSession[] {
  return layoutDesktopChatSessions(
    minimizeDesktopChatSessionInPlace(sessions, conversationId),
    { ...context, keepExpandedConversationId: null },
  )
}
